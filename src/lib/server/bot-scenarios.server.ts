import { db } from '../..';
import * as schema from '../../db/schema';
import { and, asc, eq, gt, lte, sql } from 'drizzle-orm';
import { GrammyError } from 'grammy';
import { clientBotApi, tgFormat } from './telegram-client-bot.server';
import { getContact, logOutboundMessage, setBotBlocked } from './bot-contacts.server';

const MAX_ATTEMPTS = 3;

// Предохранитель от циклов «шаг запускает цепочку» (A → B → A → …)
const MAX_CHAIN_DEPTH = 5;

type BotContact = typeof schema.botContacts.$inferSelect;
type BotScenario = typeof schema.botScenarios.$inferSelect;
type BotScenarioStep = typeof schema.botScenarioSteps.$inferSelect;

/**
 * Проверяет значение триггера для типа. Возвращает текст ошибки или null.
 * Payload диплинка ограничен правилами Telegram (t.me/<bot>?start=<payload>).
 */
export function validateTrigger(triggerType: string, value: string): string | null {
	switch (triggerType) {
		case 'start_param':
			return /^[A-Za-z0-9_-]{1,64}$/.test(value)
				? null
				: 'Payload диплинка: латиница, цифры, «_» и «-», до 64 символов';
		case 'command':
			return /^\/[a-zA-Z0-9_]{1,32}$/.test(value)
				? null
				: 'Команда должна быть вида /start (латиница, цифры, «_»)';
		case 'text':
			return value.trim() ? null : 'Текст триггера не может быть пустым';
		default:
			return 'Неизвестный тип триггера';
	}
}

/**
 * Определяет, какие включённые цепочки запускает входящее сообщение.
 * Один триггер может запускать несколько цепочек — вернутся все совпавшие.
 * Приоритет: /start <payload> → start_param; /команда → command;
 * иначе — точное совпадение текста (без учёта регистра).
 * Для неизвестного payload падаем обратно на сценарии команды /start,
 * чтобы юзер по «протухшему» диплинку не остался без приветствия.
 */
export async function findTriggeredScenarios(
	text: string | null | undefined
): Promise<BotScenario[]> {
	if (!text) return [];
	const trimmed = text.trim();

	if (trimmed.startsWith('/start')) {
		const param = trimmed.slice('/start'.length).trim();
		if (param) {
			const byParam = await findEnabledScenarios('start_param', param);
			if (byParam.length > 0) return byParam;
		}
		return findEnabledScenarios('command', '/start');
	}

	if (trimmed.startsWith('/')) {
		const command = trimmed.split(/\s+/)[0];
		return findEnabledScenarios('command', command);
	}

	return findEnabledScenarios('text', trimmed);
}

async function findEnabledScenarios(
	triggerType: (typeof schema.botScenarioTriggerEnum.enumValues)[number],
	value: string
): Promise<BotScenario[]> {
	return db
		.select()
		.from(schema.botScenarios)
		.where(
			and(
				eq(schema.botScenarios.enabled, true),
				eq(schema.botScenarios.triggerType, triggerType),
				triggerType === 'text'
					? sql`lower(${schema.botScenarios.triggerValue}) = lower(${value})`
					: eq(schema.botScenarios.triggerValue, value)
			)
		)
		.orderBy(asc(schema.botScenarios.id));
}

/**
 * Запускает цепочки по ключу события с сайта (прогресс лид-магнитов, записи).
 * Ключ ищется среди включённых start_param-цепочек — те же цепочки можно
 * запустить и диплинком t.me/<бот>?start=<key>. Возвращает false, если
 * цепочек/контакта нет или юзер заблокировал бота.
 */
export async function triggerScenarioByKey(key: string, contactId: number): Promise<boolean> {
	const scenarios = await findEnabledScenarios('start_param', key);
	if (scenarios.length === 0) return false;

	const contact = await getContact(contactId);
	if (!contact || contact.botBlocked) return false;

	for (const scenario of scenarios) {
		await triggerScenarioForContact(scenario, contact);
	}
	return true;
}

/**
 * Запускает цепочку для контакта: отменяет её же ранее запланированные шаги
 * (повторный триггер перезапускает с начала); если у цепочки стоит
 * «отменяет другие» — снимает ожидающие шаги всех незащищённых цепочек контакта.
 * Затем выполняет шаги подряд, пока не встретится шаг с задержкой.
 */
export async function triggerScenarioForContact(
	scenario: BotScenario,
	contact: BotContact,
	depth = 0
) {
	if (depth > MAX_CHAIN_DEPTH) {
		console.error(
			`[bot-scenarios] Слишком глубокая цепочка запусков (сценарий ${scenario.id}, контакт ${contact.id}) — останавливаюсь`
		);
		return;
	}

	await db
		.update(schema.botScheduledSteps)
		.set({ status: 'cancelled', processedAt: sql`now()` })
		.where(
			and(
				eq(schema.botScheduledSteps.contactId, contact.id),
				eq(schema.botScheduledSteps.scenarioId, scenario.id),
				eq(schema.botScheduledSteps.status, 'pending')
			)
		);

	if (scenario.cancelsOthers) {
		await db
			.update(schema.botScheduledSteps)
			.set({ status: 'cancelled', processedAt: sql`now()` })
			.where(
				and(
					eq(schema.botScheduledSteps.contactId, contact.id),
					eq(schema.botScheduledSteps.status, 'pending'),
					sql`${schema.botScheduledSteps.scenarioId} in (select ${schema.botScenarios.id} from ${schema.botScenarios} where ${schema.botScenarios.protectedFromCancel} = false)`
				)
			);
	}

	await continueScenario(contact, scenario.id, null, depth);
}

/**
 * Выполняет шаги цепочки после позиции `afterPosition` (null — с начала):
 * шаги без задержки выполняются сразу один за другим, первый шаг с задержкой
 * планируется в bot_scheduled_steps, и обработка останавливается — дальше
 * цепочку продолжит cron после отправки этого шага.
 */
async function continueScenario(
	contact: BotContact,
	scenarioId: number,
	afterPosition: number | null,
	depth = 0
) {
	const steps = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(
			and(
				eq(schema.botScenarioSteps.scenarioId, scenarioId),
				gt(schema.botScenarioSteps.position, afterPosition ?? -1)
			)
		)
		.orderBy(asc(schema.botScenarioSteps.position));

	for (const step of steps) {
		if (step.delaySeconds > 0) {
			await db.insert(schema.botScheduledSteps).values({
				contactId: contact.id,
				scenarioId,
				stepId: step.id,
				scheduledAt: sql`now() + make_interval(secs => ${step.delaySeconds})`
			});
			return;
		}

		const delivered = await executeStep(contact, step, depth);
		if (!delivered) return; // юзер заблокировал бота — цепочку останавливаем
	}
}

/** Подстановки в тексте шага: {contact_id} — для персональных ссылок, {first_name} — имя. */
function renderStepText(text: string, contact: BotContact): string {
	return text
		.replaceAll('{contact_id}', String(contact.id))
		.replaceAll('{first_name}', contact.firstName ?? '');
}

/**
 * Выполняет один шаг: отправляет сообщение (если есть), добавляет теги, меняет
 * этап и запускает связанную цепочку. Возвращает false при блокировке ботом.
 */
async function executeStep(
	contact: BotContact,
	step: BotScenarioStep,
	depth = 0
): Promise<boolean> {
	if (step.messageText) {
		const rendered = renderStepText(step.messageText, contact);
		let sentMessageId: number;
		try {
			const sent = await clientBotApi.sendMessage(contact.telegramUserId, tgFormat(rendered), {
				parse_mode: 'HTML',
				...(step.buttonText && step.buttonUrl
					? {
							reply_markup: {
								inline_keyboard: [
									[{ text: step.buttonText, url: renderStepText(step.buttonUrl, contact) }]
								]
							}
						}
					: {})
			});
			sentMessageId = sent.message_id;
		} catch (err) {
			// botBlocked ставим только по 403 "Forbidden: bot was blocked by the user" —
			// остальные ошибки пробрасываем, очередь их ретраит
			if (err instanceof GrammyError && err.error_code === 403) {
				await setBotBlocked(contact.id, true);
				return false;
			}
			throw err;
		}

		// Сообщение уже доставлено — ошибка записи в историю не должна ронять шаг,
		// иначе ретрай очереди отправит клиенту дубль
		try {
			await logOutboundMessage({
				contactId: contact.id,
				text: rendered,
				telegramMessageId: sentMessageId
			});
		} catch (err) {
			console.error('[bot-scenarios] Шаг отправлен, но не записан в историю:', err);
		}
	}

	if (step.addTags.length > 0 || step.setStage) {
		const tags = Array.from(new Set([...contact.tags, ...step.addTags]));
		await db
			.update(schema.botContacts)
			.set({
				tags,
				...(step.setStage ? { stage: step.setStage } : {}),
				updatedAt: sql`now()`
			})
			.where(eq(schema.botContacts.id, contact.id));
		contact.tags = tags;
	}

	// Запуск связанной цепочки (например, «не догрелся → классическая рассылка»)
	if (step.startScenarioId) {
		const [chained] = await db
			.select()
			.from(schema.botScenarios)
			.where(
				and(
					eq(schema.botScenarios.id, step.startScenarioId),
					eq(schema.botScenarios.enabled, true)
				)
			);
		if (chained) {
			await triggerScenarioForContact(chained, contact, depth + 1);
		}
	}

	return true;
}

/**
 * Массовый запуск цепочки (рассылки) по сегменту: всем контактам, у которых
 * есть все requireTags и нет ни одного из excludeTags (и бот не заблокирован),
 * первый шаг ставится в очередь — отправка идёт порциями через cron, чтобы
 * не упереться в лимиты Telegram. Повторный запуск перезапускает цепочку
 * (её ожидающие шаги отменяются). Возвращает число контактов.
 */
export async function launchScenarioForSegment(
	scenarioId: number,
	filter: { requireTags: string[]; excludeTags: string[] }
): Promise<number> {
	const [firstStep] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.scenarioId, scenarioId))
		.orderBy(asc(schema.botScenarioSteps.position))
		.limit(1);
	if (!firstStep) return 0;

	const conditions = [eq(schema.botContacts.botBlocked, false)];
	if (filter.requireTags.length > 0) {
		conditions.push(sql`${schema.botContacts.tags} @> ${filter.requireTags}::text[]`);
	}
	if (filter.excludeTags.length > 0) {
		conditions.push(sql`not (${schema.botContacts.tags} && ${filter.excludeTags}::text[])`);
	}

	const contacts = await db
		.select({ id: schema.botContacts.id })
		.from(schema.botContacts)
		.where(and(...conditions));

	if (contacts.length > 0) {
		await db
			.update(schema.botScheduledSteps)
			.set({ status: 'cancelled', processedAt: sql`now()` })
			.where(
				and(
					eq(schema.botScheduledSteps.scenarioId, scenarioId),
					eq(schema.botScheduledSteps.status, 'pending')
				)
			);

		await db.insert(schema.botScheduledSteps).values(
			contacts.map((c) => ({
				contactId: c.id,
				scenarioId,
				stepId: firstStep.id,
				scheduledAt: sql`now() + make_interval(secs => ${firstStep.delaySeconds})`
			}))
		);
	}

	await db.insert(schema.botBroadcastRuns).values({
		scenarioId,
		requireTags: filter.requireTags,
		excludeTags: filter.excludeTags,
		matchedCount: contacts.length
	});

	return contacts.length;
}

/**
 * Удаляет шаг, не бросая контактов, которые его ждут: их ожидающие записи
 * переводятся на следующий шаг цепочки (время срабатывания сохраняется);
 * если следующего шага нет — записи отменяются.
 */
export async function deleteStepAndRepointQueue(id: number) {
	const [step] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.id, id));
	if (!step) return;

	const [next] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(
			and(
				eq(schema.botScenarioSteps.scenarioId, step.scenarioId),
				gt(schema.botScenarioSteps.position, step.position)
			)
		)
		.orderBy(asc(schema.botScenarioSteps.position))
		.limit(1);

	const pendingOfStep = and(
		eq(schema.botScheduledSteps.stepId, id),
		eq(schema.botScheduledSteps.status, 'pending')
	);

	if (next) {
		await db.update(schema.botScheduledSteps).set({ stepId: next.id }).where(pendingOfStep);
	} else {
		await db
			.update(schema.botScheduledSteps)
			.set({ status: 'cancelled', processedAt: sql`now()` })
			.where(pendingOfStep);
	}

	await db.delete(schema.botScenarioSteps).where(eq(schema.botScenarioSteps.id, id));
}

/**
 * Обрабатывает назревшие отложенные шаги (вызывается cron'ом раз в минуту).
 * После успешной отправки продолжает цепочку сценария с следующего шага.
 */
export async function processDueScheduledSteps(): Promise<{
	processed: number;
	sent: number;
	errors: number;
}> {
	const due = await db
		.select({
			scheduled: schema.botScheduledSteps,
			step: schema.botScenarioSteps,
			contact: schema.botContacts,
			scenario: schema.botScenarios
		})
		.from(schema.botScheduledSteps)
		.innerJoin(
			schema.botScenarioSteps,
			eq(schema.botScheduledSteps.stepId, schema.botScenarioSteps.id)
		)
		.innerJoin(schema.botContacts, eq(schema.botScheduledSteps.contactId, schema.botContacts.id))
		.innerJoin(schema.botScenarios, eq(schema.botScheduledSteps.scenarioId, schema.botScenarios.id))
		.where(
			and(
				eq(schema.botScheduledSteps.status, 'pending'),
				lte(schema.botScheduledSteps.scheduledAt, sql`now()`)
			)
		)
		.orderBy(asc(schema.botScheduledSteps.scheduledAt))
		.limit(200);

	let sent = 0;
	let errors = 0;

	for (const { scheduled, step, contact, scenario } of due) {
		try {
			// Сценарий выключили или юзер заблокировал бота, пока шаг ждал в очереди
			if (!scenario.enabled || contact.botBlocked) {
				await markScheduled(scheduled.id, { status: 'cancelled' });
				continue;
			}

			const delivered = await executeStep(contact, step);
			await markScheduled(scheduled.id, { status: delivered ? 'sent' : 'cancelled' });

			if (delivered) {
				sent++;
				await continueScenario(contact, scheduled.scenarioId, step.position);
			}
		} catch (err) {
			errors++;
			const attempts = scheduled.attempts + 1;
			await markScheduled(scheduled.id, {
				status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
				attempts,
				lastError: err instanceof Error ? err.message : String(err)
			});
		}
	}

	return { processed: due.length, sent, errors };
}

async function markScheduled(
	id: number,
	data: {
		status: (typeof schema.botScheduledStepStatusEnum.enumValues)[number];
		attempts?: number;
		lastError?: string;
	}
) {
	await db
		.update(schema.botScheduledSteps)
		.set({ ...data, processedAt: sql`now()` })
		.where(eq(schema.botScheduledSteps.id, id));
}
