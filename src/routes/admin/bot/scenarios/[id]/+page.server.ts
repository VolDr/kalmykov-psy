import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../../..';
import * as schema from '../../../../../db/schema';
import { and, asc, desc, eq, gt, lt, ne, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';
import {
	deleteStepAndRepointQueue,
	launchScenarioForSegment,
	validateTrigger
} from '$lib/server/bot-scenarios.server';
import { tgFormat, TELEGRAM_MESSAGE_LIMIT } from '$lib/server/telegram-client-bot.server';

const UNIT_SECONDS: Record<string, number> = {
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

function parseStepFields(form: FormData) {
	const delaySeconds = parseDelay(form);
	if (delaySeconds === null) return { error: 'Некорректная задержка' } as const;

	const messageText = (form.get('messageText') as string)?.trim() || null;
	const setStage = (form.get('setStage') as string)?.trim() || null;
	const buttonText = (form.get('buttonText') as string)?.trim() || null;
	const buttonUrl = (form.get('buttonUrl') as string)?.trim() || null;
	const addTags = parseTags(form.get('addTags'));

	const startScenarioRaw = ((form.get('startScenarioId') as string) ?? '').trim();
	const startScenarioId = startScenarioRaw ? parseInt(startScenarioRaw, 10) : null;
	if (startScenarioRaw && (startScenarioId === null || isNaN(startScenarioId))) {
		return { error: 'Некорректная цепочка для запуска' } as const;
	}

	if (!messageText && !setStage && addTags.length === 0 && !startScenarioId) {
		return { error: 'Шаг должен содержать сообщение, теги, этап или запуск цепочки' } as const;
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

	return { delaySeconds, messageText, setStage, addTags, buttonText, buttonUrl, startScenarioId } as const;
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
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.botScheduledSteps)
		.where(
			and(
				eq(schema.botScheduledSteps.scenarioId, id),
				eq(schema.botScheduledSteps.status, 'pending')
			)
		);

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

	return { scenario, steps, pendingCount: pending?.count ?? 0, chainScenarios, runs };
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

		if (!name) return fail(400, { scenarioError: 'Укажите название' });

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
		const fields = parseStepFields(form);
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
			...fields
		});

		return { stepSuccess: true };
	},

	updateStep: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const stepId = parseInt(form.get('stepId') as string, 10);
		if (isNaN(stepId)) return fail(400, { stepError: 'Некорректный ID шага' });

		const fields = parseStepFields(form);
		if ('error' in fields) return fail(400, { stepError: fields.error });

		const [step] = await db
			.select({ scenarioId: schema.botScenarioSteps.scenarioId })
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.id, stepId));
		if (!step) return fail(400, { stepError: 'Шаг не найден' });
		if (fields.startScenarioId === step.scenarioId) {
			return fail(400, { stepError: 'Цепочка не может запускать саму себя' });
		}

		await db
			.update(schema.botScenarioSteps)
			.set(fields)
			.where(eq(schema.botScenarioSteps.id, stepId));

		return { stepSuccess: true };
	},

	deleteStep: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const stepId = parseInt(form.get('stepId') as string, 10);
		if (isNaN(stepId)) return fail(400, { stepError: 'Некорректный ID шага' });

		// Ожидающие этот шаг контакты переводятся на следующий шаг, а не бросаются
		await deleteStepAndRepointQueue(stepId);

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
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { launchError: 'Некорректный ID' });

		const scenario = await loadScenarioOr404(id);
		if (!scenario.enabled) {
			return fail(400, { launchError: 'Сначала включите цепочку — выключенная не отправляется' });
		}

		const form = await event.request.formData();
		const requireTags = parseTags(form.get('requireTags'));
		const excludeTags = parseTags(form.get('excludeTags'));

		const count = await launchScenarioForSegment(id, { requireTags, excludeTags });
		if (count === 0) {
			return fail(400, {
				launchError: 'Никому не отправлено: сегмент пуст или в цепочке нет шагов'
			});
		}

		return { launchCount: count };
	}
} satisfies Actions;
