import { error, fail, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../../..';
import * as schema from '../../../../../db/schema';
import { and, asc, desc, eq, gt, lt, ne, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';
import {
	cancelScheduledLaunch,
	deleteStepAndRepointQueue,
	launchScenarioForSegment,
	previewSegment,
	validateTrigger,
	type SegmentFilter
} from '$lib/server/bot-scenarios.server';
import { tgFormat, TELEGRAM_MESSAGE_LIMIT } from '$lib/server/telegram-client-bot.server';
import {
	deleteStepFileFromDisk,
	MAX_STEP_FILE_BYTES,
	saveStepFile
} from '$lib/server/bot-step-files.server';

const UNIT_SECONDS: Record<string, number> = {
	seconds: 1,
	minutes: 60,
	hours: 3600,
	days: 86400
};

function parseDelay(form: FormData): number | null {
	const value = parseInt(form.get('delayValue') as string, 10);
	const unit = (form.get('delayUnit') as string) ?? 'minutes';
	if (isNaN(value) || value < 0 || !(unit in UNIT_SECONDS)) return null;
	return value * UNIT_SECONDS[unit];
}

function parseTags(raw: unknown): string[] {
	return String(raw ?? '')
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

function parseSegmentFilter(form: FormData): SegmentFilter {
	return {
		requireTags: parseTags(form.get('requireTags')),
		excludeTags: parseTags(form.get('excludeTags')),
		onlyIdle: form.get('onlyIdle') === 'on'
	};
}

/** datetime-local из админки трактуем именно как московское время (UTC+3). */
function parseMoscowDateTime(raw: unknown): Date | null {
	const value = String(raw ?? '').trim();
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
	if (!match) return null;

	const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
	const year = Number(yearRaw);
	const month = Number(monthRaw);
	const day = Number(dayRaw);
	const hour = Number(hourRaw);
	const minute = Number(minuteRaw);
	const calendarCheck = new Date(Date.UTC(year, month - 1, day, hour, minute));
	if (
		calendarCheck.getUTCFullYear() !== year ||
		calendarCheck.getUTCMonth() !== month - 1 ||
		calendarCheck.getUTCDate() !== day ||
		calendarCheck.getUTCHours() !== hour ||
		calendarCheck.getUTCMinutes() !== minute
	) {
		return null;
	}

	const parsed = new Date(`${value}:00+03:00`);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function launchFromForm(event: RequestEvent, scheduled: boolean) {
	requireAuth(event);
	const id = parseInt(event.params.id, 10);
	if (isNaN(id)) return fail(400, { launchError: 'Некорректный ID' });

	const scenario = await loadScenarioOr404(id);
	if (!scenario.enabled) {
		return fail(400, { launchError: 'Сначала включите цепочку — выключенная не отправляется' });
	}

	const form = await event.request.formData();
	const filter = parseSegmentFilter(form);
	let launchAt: Date | null = null;
	if (scheduled) {
		launchAt = parseMoscowDateTime(form.get('launchAt'));
		if (!launchAt) {
			return fail(400, { launchError: 'Укажите корректные дату и время по Москве' });
		}
		if (launchAt.getTime() <= Date.now()) {
			return fail(400, { launchError: 'Время запуска должно быть в будущем' });
		}
	}

	const count = await launchScenarioForSegment(id, filter, launchAt);
	if (count === 0) {
		return fail(400, {
			launchError: filter.onlyIdle
				? 'Никому не отправлено: сегмент пуст, все заняты другими цепочками или в цепочке нет шагов'
				: 'Никому не отправлено: сегмент пуст или в цепочке нет шагов'
		});
	}

	return { launchCount: count, launchScheduledAt: launchAt?.toISOString() ?? null };
}

/** Файл из multipart-формы; пустой input даёт File с size 0 — это «нет файла» */
function extractUpload(form: FormData): File | null {
	const file = form.get('file');
	return file instanceof File && file.size > 0 && file.name ? file : null;
}

function parseStepFields(form: FormData, hasFile: boolean) {
	const delaySeconds = parseDelay(form);
	if (delaySeconds === null) return { error: 'Некорректная задержка' } as const;

	const messageText = (form.get('messageText') as string)?.trim() || null;
	const setStage = (form.get('setStage') as string)?.trim() || null;
	const buttonText = (form.get('buttonText') as string)?.trim() || null;
	const buttonUrl = (form.get('buttonUrl') as string)?.trim() || null;
	const addTags = parseTags(form.get('addTags'));

	const conditionRaw = ((form.get('condition') as string) ?? '').trim();
	if (conditionRaw && !schema.botStepConditionEnum.enumValues.includes(conditionRaw as never)) {
		return { error: 'Неизвестное условие шага' } as const;
	}
	const condition = conditionRaw
		? (conditionRaw as (typeof schema.botStepConditionEnum.enumValues)[number])
		: null;

	const buttonActionRaw = ((form.get('buttonAction') as string) || 'url').trim();
	if (!schema.botStepButtonActionEnum.enumValues.includes(buttonActionRaw as never)) {
		return { error: 'Неизвестный тип кнопки' } as const;
	}
	const buttonAction =
		buttonActionRaw as (typeof schema.botStepButtonActionEnum.enumValues)[number];

	const startScenarioRaw = ((form.get('startScenarioId') as string) ?? '').trim();
	const startScenarioId = startScenarioRaw ? parseInt(startScenarioRaw, 10) : null;
	if (startScenarioRaw && (startScenarioId === null || isNaN(startScenarioId))) {
		return { error: 'Некорректная цепочка для запуска' } as const;
	}

	if (!messageText && !hasFile && !setStage && addTags.length === 0 && !startScenarioId) {
		return {
			error: 'Шаг должен содержать сообщение, файл, теги, этап или запуск цепочки'
		} as const;
	}

	if (messageText && tgFormat(messageText).length > TELEGRAM_MESSAGE_LIMIT) {
		return {
			error: `Сообщение слишком длинное: ${tgFormat(messageText).length} из ${TELEGRAM_MESSAGE_LIMIT} символов (спецсимволы считаются с запасом)`
		} as const;
	}

	if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
		return { error: 'У кнопки нужны и текст, и ссылка' } as const;
	}
	if (buttonText && !messageText) {
		return { error: 'Кнопка возможна только вместе с сообщением' } as const;
	}
	if (buttonUrl && !/^https?:\/\//.test(buttonUrl)) {
		return { error: 'Ссылка кнопки должна начинаться с https://' } as const;
	}

	// Шлагбаум без сообщения показать негде: кнопка «Я подписался» вешается под текст
	if (buttonAction === 'check_subscription' && !messageText) {
		return {
			error: 'Для кнопки «Проверить подписку» нужен текст сообщения — под ним она и появится'
		} as const;
	}

	return {
		delaySeconds,
		messageText,
		setStage,
		addTags,
		buttonText,
		buttonUrl,
		condition,
		buttonAction,
		startScenarioId
	} as const;
}

async function loadScenarioOr404(id: number) {
	const [scenario] = await db
		.select()
		.from(schema.botScenarios)
		.where(eq(schema.botScenarios.id, id));
	if (!scenario) throw error(404, 'Цепочка не найдена');
	return scenario;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) throw error(404, 'Цепочка не найдена');

	const scenario = await loadScenarioOr404(id);
	const steps = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.scenarioId, id))
		.orderBy(asc(schema.botScenarioSteps.position));

	const [pending] = await db
		.select({
			count: sql<number>`count(*)::int`,
			nextAt: sql<string | null>`min(${schema.botScheduledSteps.scheduledAt})`
		})
		.from(schema.botScheduledSteps)
		.where(
			and(
				eq(schema.botScheduledSteps.scenarioId, id),
				eq(schema.botScheduledSteps.status, 'pending')
			)
		);

	// Первый шаг с будущим временем — это зафиксированный пакет ручного запуска.
	// Группировка по точному времени позволяет отменить и планы, созданные до
	// появления отдельной кнопки, без миграции и без затрагивания других очередей.
	const firstStep = steps[0];
	const plannedLaunches = firstStep
		? await db
				.select({
					stepId: schema.botScheduledSteps.stepId,
					scheduledAt: schema.botScheduledSteps.scheduledAt,
					count: sql<number>`count(*)::int`
				})
				.from(schema.botScheduledSteps)
				.where(
					and(
						eq(schema.botScheduledSteps.scenarioId, id),
						eq(schema.botScheduledSteps.stepId, firstStep.id),
						eq(schema.botScheduledSteps.status, 'pending'),
						gt(schema.botScheduledSteps.scheduledAt, sql`now()`)
					)
				)
				.groupBy(schema.botScheduledSteps.stepId, schema.botScheduledSteps.scheduledAt)
				.orderBy(asc(schema.botScheduledSteps.scheduledAt))
		: [];

	// Другие цепочки — для поля «запустить цепочку после шага»
	const chainScenarios = await db
		.select({
			id: schema.botScenarios.id,
			name: schema.botScenarios.name,
			kind: schema.botScenarios.kind
		})
		.from(schema.botScenarios)
		.where(ne(schema.botScenarios.id, id))
		.orderBy(asc(schema.botScenarios.name));

	const runs = await db
		.select()
		.from(schema.botBroadcastRuns)
		.where(eq(schema.botBroadcastRuns.scenarioId, id))
		.orderBy(desc(schema.botBroadcastRuns.createdAt))
		.limit(10);

	return {
		scenario,
		steps,
		pendingCount: pending?.count ?? 0,
		nextPendingAt: pending?.nextAt ?? null,
		plannedLaunches,
		chainScenarios,
		runs
	};
};

export const actions = {
	updateScenario: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { scenarioError: 'Некорректный ID' });
		const current = await loadScenarioOr404(id);

		const form = await event.request.formData();
		const name = (form.get('name') as string)?.trim();
		const triggerTypeRaw = ((form.get('triggerType') as string) ?? '').trim();
		const triggerValue = (form.get('triggerValue') as string)?.trim() ?? '';
		const enabled = form.get('enabled') === 'on';
		const cancelsOthers = form.get('cancelsOthers') === 'on';
		const protectedFromCancel = form.get('protectedFromCancel') === 'on';
		const cooldownDays = parseInt((form.get('cooldownDays') as string) ?? '0', 10);

		if (!name) return fail(400, { scenarioError: 'Укажите название' });
		if (isNaN(cooldownDays) || cooldownDays < 0) {
			return fail(400, { scenarioError: 'Кулдаун — целое число дней, 0 = без ограничений' });
		}

		let triggerType: (typeof schema.botScenarioTriggerEnum.enumValues)[number] | null = null;
		if (triggerTypeRaw) {
			if (!schema.botScenarioTriggerEnum.enumValues.includes(triggerTypeRaw as never)) {
				return fail(400, { scenarioError: 'Неизвестный тип триггера' });
			}
			const triggerError = validateTrigger(triggerTypeRaw, triggerValue);
			if (triggerError) return fail(400, { scenarioError: triggerError });
			triggerType = triggerTypeRaw as (typeof schema.botScenarioTriggerEnum.enumValues)[number];
		}
		// Воронка без триггера никогда не запустится — не даём так сохранить;
		// у рассылки триггер опционален (запуск вручную по сегменту)
		if (current.kind === 'funnel' && !triggerType) {
			return fail(400, { scenarioError: 'У воронки должен быть триггер' });
		}

		await db
			.update(schema.botScenarios)
			.set({
				name,
				triggerType,
				triggerValue: triggerType ? triggerValue : null,
				enabled,
				cancelsOthers,
				protectedFromCancel,
				cooldownDays,
				updatedAt: sql`now()`
			})
			.where(eq(schema.botScenarios.id, id));

		return { scenarioSuccess: true };
	},

	addStep: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { stepError: 'Некорректный ID' });
		await loadScenarioOr404(id);

		const form = await event.request.formData();
		const upload = extractUpload(form);
		if (upload && upload.size > MAX_STEP_FILE_BYTES) {
			return fail(400, { stepError: 'Файл больше 50 МБ — Telegram не даст боту его отправить' });
		}

		const fields = parseStepFields(form, Boolean(upload));
		if ('error' in fields) return fail(400, { stepError: fields.error });
		if (fields.startScenarioId === id) {
			return fail(400, { stepError: 'Цепочка не может запускать саму себя' });
		}

		const [last] = await db
			.select({ position: schema.botScenarioSteps.position })
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.scenarioId, id))
			.orderBy(desc(schema.botScenarioSteps.position))
			.limit(1);

		await db.insert(schema.botScenarioSteps).values({
			scenarioId: id,
			position: (last?.position ?? 0) + 1,
			...fields,
			...(upload ? await saveStepFile(upload) : {})
		});

		return { stepSuccess: true };
	},

	updateStep: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const stepId = parseInt(form.get('stepId') as string, 10);
		if (isNaN(stepId)) return fail(400, { stepError: 'Некорректный ID шага' });

		const [step] = await db
			.select()
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.id, stepId));
		if (!step) return fail(400, { stepError: 'Шаг не найден' });

		const upload = extractUpload(form);
		if (upload && upload.size > MAX_STEP_FILE_BYTES) {
			return fail(400, { stepError: 'Файл больше 50 МБ — Telegram не даст боту его отправить' });
		}
		const removeFile = form.get('removeFile') === 'on';
		const keepsFile = Boolean(upload) || (Boolean(step.filePath) && !removeFile);

		const fields = parseStepFields(form, keepsFile);
		if ('error' in fields) return fail(400, { stepError: fields.error });
		if (fields.startScenarioId === step.scenarioId) {
			return fail(400, { stepError: 'Цепочка не может запускать саму себя' });
		}

		// Новый файл заменяет старый; смена файла сбрасывает кеш telegram file_id
		let fileFields = {};
		if (upload) {
			fileFields = { ...(await saveStepFile(upload)), fileTelegramId: null };
			await deleteStepFileFromDisk(step.filePath);
		} else if (removeFile && step.filePath) {
			fileFields = { fileName: null, filePath: null, fileTelegramId: null };
			await deleteStepFileFromDisk(step.filePath);
		}

		await db
			.update(schema.botScenarioSteps)
			.set({ ...fields, ...fileFields })
			.where(eq(schema.botScenarioSteps.id, stepId));

		return { stepSuccess: true };
	},

	deleteStep: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const stepId = parseInt(form.get('stepId') as string, 10);
		if (isNaN(stepId)) return fail(400, { stepError: 'Некорректный ID шага' });

		const [step] = await db
			.select({ filePath: schema.botScenarioSteps.filePath })
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.id, stepId));

		// Ожидающие этот шаг контакты переводятся на следующий шаг, а не бросаются
		await deleteStepAndRepointQueue(stepId);
		await deleteStepFileFromDisk(step?.filePath);

		return { stepSuccess: true };
	},

	moveStep: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const stepId = parseInt(form.get('stepId') as string, 10);
		const direction = form.get('direction') as string;
		if (isNaN(stepId) || !['up', 'down'].includes(direction)) {
			return fail(400, { stepError: 'Некорректный запрос' });
		}

		const [step] = await db
			.select()
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.id, stepId));
		if (!step) return fail(400, { stepError: 'Шаг не найден' });

		// Сосед по позиции: ближайший сверху или снизу
		const [neighbor] = await db
			.select()
			.from(schema.botScenarioSteps)
			.where(
				and(
					eq(schema.botScenarioSteps.scenarioId, step.scenarioId),
					direction === 'up'
						? lt(schema.botScenarioSteps.position, step.position)
						: gt(schema.botScenarioSteps.position, step.position)
				)
			)
			.orderBy(
				direction === 'up'
					? desc(schema.botScenarioSteps.position)
					: asc(schema.botScenarioSteps.position)
			)
			.limit(1);
		if (!neighbor) return { stepSuccess: true };

		await db.transaction(async (tx) => {
			await tx
				.update(schema.botScenarioSteps)
				.set({ position: neighbor.position })
				.where(eq(schema.botScenarioSteps.id, step.id));
			await tx
				.update(schema.botScenarioSteps)
				.set({ position: step.position })
				.where(eq(schema.botScenarioSteps.id, neighbor.id));
		});

		return { stepSuccess: true };
	},

	launch: async (event) => {
		return launchFromForm(event, false);
	},

	scheduleLaunch: async (event) => {
		return launchFromForm(event, true);
	},

	cancelLaunch: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { cancelLaunchError: 'Некорректный ID' });

		const form = await event.request.formData();
		const stepId = parseInt(String(form.get('stepId') ?? ''), 10);
		const requestedAt = new Date(String(form.get('scheduledAt') ?? ''));
		if (isNaN(stepId) || Number.isNaN(requestedAt.getTime())) {
			return fail(400, { cancelLaunchError: 'Некорректный запланированный запуск' });
		}

		const [firstStep] = await db
			.select({ id: schema.botScenarioSteps.id })
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.scenarioId, id))
			.orderBy(asc(schema.botScenarioSteps.position))
			.limit(1);
		if (!firstStep || firstStep.id !== stepId) {
			return fail(400, { cancelLaunchError: 'Запуск не найден в этой цепочке' });
		}

		const count = await cancelScheduledLaunch(id, stepId, requestedAt.toISOString());
		if (count === 0) {
			return fail(409, {
				cancelLaunchError: 'Запуск уже отменён или начал отправляться'
			});
		}

		return { cancelLaunchCount: count };
	},

	// Ничего не отправляет: показывает, сколько контактов получит запуск
	previewLaunch: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { launchError: 'Некорректный ID' });

		await loadScenarioOr404(id);
		const preview = await previewSegment(parseSegmentFilter(await event.request.formData()));

		return { launchPreview: preview };
	}
} satisfies Actions;
