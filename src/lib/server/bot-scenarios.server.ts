import { db } from '../..';
import * as schema from '../../db/schema';
import { and, asc, eq, gt, lte, ne, sql, type SQL } from 'drizzle-orm';
import { GrammyError, InputFile } from 'grammy';
import type { InlineKeyboardButton } from 'grammy/types';
import {
	apiDeadline,
	CALLBACK_SUBSCRIPTION_TIMEOUT_MS,
	clientBotApi,
	tgFormat
} from './telegram-client-bot.server';
import { absoluteStepFilePath } from './bot-step-files.server';
import { chatIdForApi } from './bot-channel-posts.server';
import { getQuizBotSettings } from './quiz-results.server';
import { markGatePassed, markGateShown } from './bot-funnel.server';
import { logSafeError } from './log-error.server';
import {
	getContact,
	logOutboundMessage,
	pgTextArrayLiteral,
	setBotBlocked
} from './bot-contacts.server';

const MAX_ATTEMPTS = 3;

/** Префикс callback data кнопки «Я подписался» у шага-шлагбаума: sub:<stepId> */
export const SUBSCRIPTION_CALLBACK_PREFIX = 'sub:';

const GATE_CALLBACK_CONSTRAINT = 'bot_scheduled_steps_gate_callback_key';
const SCENARIO_RUN_CONSTRAINT = 'bot_scenario_runs_contact_scenario_key';

/**
 * Причины отмены, за которыми стоит временная поломка, а не решение системы:
 * повторное нажатие «Я подписался» имеет право поднять такое продолжение.
 */
const REVIVABLE_CANCELLATIONS = ['scenario_disabled', 'contact_blocked'];

/**
 * Единственная причина отмены, о которой стоит сказать человеку при повторном
 * нажатии: отправку снял администратор. Остальные (`scenario_restarted`,
 * `cancelled_by_scenario`, `broadcast_restarted`, `step_deleted_no_successor`)
 * системные — цепочку заменили новее либо хвоста уже не существует, чинить
 * там нечего, и алерт «напишите администратору» только пугает.
 */
const MANUAL_CANCELLATION = 'cancelled_manually';

// Предохранитель от циклов «шаг запускает цепочку» (A → B → A → …)
const MAX_CHAIN_DEPTH = 5;

type BotContact = typeof schema.botContacts.$inferSelect;
type BotScenario = typeof schema.botScenarios.$inferSelect;
type BotScenarioStep = typeof schema.botScenarioSteps.$inferSelect;
type BotScheduledStep = typeof schema.botScheduledSteps.$inferSelect;

type SubscriptionGateCallbackResult = {
	alert: string | null;
	/** id задания очереди, которое можно выполнить прямо сейчас, не дожидаясь крона */
	continuationId: number | null;
	accepted: boolean;
};

/**
 * Общий контекст одного синхронного прохода по цепочке: глубина вложенных
 * запусков (предохранитель от циклов) и ответ Telegram о подписке, чтобы не
 * спрашивать getChatMember через прокси на каждом шаге. Память живёт ровно
 * один проход, поэтому «подписался прямо сейчас» не может застрять в кеше.
 */
type ChainContext = { depth: number; subscription: Map<string, boolean> };

/** db или транзакция — обе умеют select/insert/update, которые здесь нужны. */
type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

type MarkScheduledData = {
	status: (typeof schema.botScheduledStepStatusEnum.enumValues)[number];
	attempts?: number;
	lastError?: string;
	cancellationReason?: string;
};

function newChainContext(depth = 0): ChainContext {
	return { depth, subscription: new Map() };
}

/**
 * Проверяет значение триггера для типа. Возвращает текст ошибки или null.
 * Payload диплинка ограничен правилами Telegram (t.me/<bot>?start=<payload>).
 */
export function validateTrigger(triggerType: string, value: string): string | null {
	switch (triggerType) {
		case 'start_param':
			if (/^cp_\d+$/.test(value)) {
				return 'Ключи вида cp_<число> заняты кнопками постов канала — выберите другой';
			}
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
 * Канал, подписку на который проверяют условия шагов этой цепочки.
 * Сначала — канал привязанного к цепочке поста (обычный случай: цепочка выдаёт
 * материал из конкретного поста), иначе — канал из общих настроек бота.
 * null — канал не настроен, проверять нечего.
 */
async function resolveScenarioChannelChatId(scenarioId: number): Promise<string | null> {
	const [post] = await db
		.select({ chatId: schema.botChannelPosts.chatId })
		.from(schema.botChannelPosts)
		.where(eq(schema.botChannelPosts.scenarioId, scenarioId))
		.orderBy(asc(schema.botChannelPosts.id))
		.limit(1);
	if (post?.chatId?.trim()) return post.chatId.trim();

	const settings = await getQuizBotSettings();
	return settings.channelChatId;
}

/**
 * Подписан ли контакт на канал цепочки. Ошибка проверки (бот не админ канала,
 * недоступный API) трактуется в пользу юзера — как в кнопках на постах: лучше
 * отдать материал лишнему человеку, чем заблокировать всех из-за сбоя.
 */
export async function isContactSubscribed(
	scenarioId: number,
	telegramUserId: number,
	timeoutMs?: number
): Promise<boolean> {
	const chatId = await resolveScenarioChannelChatId(scenarioId);
	if (!chatId) return true;
	try {
		const member = await clientBotApi.getChatMember(
			chatIdForApi(chatId),
			telegramUserId,
			apiDeadline(timeoutMs)
		);
		return ['creator', 'administrator', 'member'].includes(member.status);
	} catch (err) {
		logSafeError('[bot-scenarios] getChatMember не удался:', err);
		return true;
	}
}

/**
 * Не сняли ли задание, пока мы его выполняли. Захват не выводит запись из
 * pending, поэтому отмена может прилететь в любой момент отправки.
 */
async function isStillPending(id: number): Promise<boolean> {
	const [row] = await db
		.select({ status: schema.botScheduledSteps.status })
		.from(schema.botScheduledSteps)
		.where(eq(schema.botScheduledSteps.id, id))
		.limit(1);
	return row?.status === 'pending';
}

/** isContactSubscribed с памятью на один проход по цепочке (см. ChainContext). */
async function subscribedInChain(
	scenarioId: number,
	telegramUserId: number,
	chain: ChainContext
): Promise<boolean> {
	const key = `${scenarioId}:${telegramUserId}`;
	const remembered = chain.subscription.get(key);
	if (remembered !== undefined) return remembered;

	const subscribed = await isContactSubscribed(scenarioId, telegramUserId);
	chain.subscription.set(key, subscribed);
	return subscribed;
}

/** Шаг-шлагбаум: выполнившись, останавливает цепочку до нажатия «Я подписался». */
function isGateStep(step: BotScenarioStep): boolean {
	return step.buttonAction === 'check_subscription';
}

/**
 * Разбирает payload диплинка: `<ключ>` или `<ключ>__<ClientID Метрики>`.
 * Двойное подчёркивание — разделитель: в ключах сценариев (`lm_otpusk_read75`)
 * оно не встречается, поэтому старые диплинки продолжают работать как раньше.
 * ClientID Метрики — только цифры, всё остальное игнорируем.
 */
export function parseStartPayload(payload: string): {
	key: string;
	metrikaClientId: string | null;
} {
	const separator = payload.indexOf('__');
	if (separator === -1) return { key: payload, metrikaClientId: null };

	const key = payload.slice(0, separator);
	const tail = payload.slice(separator + 2);
	return { key, metrikaClientId: /^\d{1,32}$/.test(tail) ? tail : null };
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
		const payload = trimmed.slice('/start'.length).trim();
		if (payload) {
			const { key } = parseStartPayload(payload);
			const byParam = await findEnabledScenarios('start_param', key);
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

	// Кулдаун «не запускать чаще раза в N дней»: недавний запуск — выходим
	if (scenario.cooldownDays > 0) {
		const [recent] = await db
			.select({ id: schema.botScenarioRuns.id })
			.from(schema.botScenarioRuns)
			.where(
				and(
					eq(schema.botScenarioRuns.contactId, contact.id),
					eq(schema.botScenarioRuns.scenarioId, scenario.id),
					sql`${schema.botScenarioRuns.lastStartedAt} > now() - make_interval(days => ${scenario.cooldownDays})`
				)
			)
			.limit(1);
		if (recent) {
			console.log(
				`[bot-scenarios] «${scenario.name}» (id ${scenario.id}) для контакта ${contact.id} не запущен: кулдаун ${scenario.cooldownDays} дн., уже запускался недавно`
			);
			return;
		}

		// Фиксируем запуск (окно кулдауна отсчитывается от него)
		const [existing] = await db
			.select({ id: schema.botScenarioRuns.id })
			.from(schema.botScenarioRuns)
			.where(
				and(
					eq(schema.botScenarioRuns.contactId, contact.id),
					eq(schema.botScenarioRuns.scenarioId, scenario.id)
				)
			)
			.limit(1);
		if (existing) {
			await db
				.update(schema.botScenarioRuns)
				.set({ lastStartedAt: sql`now()` })
				.where(eq(schema.botScenarioRuns.id, existing.id));
		} else {
			try {
				await db.insert(schema.botScenarioRuns).values({
					contactId: contact.id,
					scenarioId: scenario.id,
					lastStartedAt: sql`now()`
				});
			} catch (err) {
				// Параллельный запуск (двойной /start) уже записал — не роняем обработку
				if (!isConstraintViolation(err, SCENARIO_RUN_CONSTRAINT)) throw err;
			}
		}
	}

	await db
		.update(schema.botScheduledSteps)
		.set({
			status: 'cancelled',
			cancellationReason: 'scenario_restarted',
			processedAt: sql`now()`
		})
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
			.set({
				status: 'cancelled',
				cancellationReason: 'cancelled_by_scenario',
				processedAt: sql`now()`
			})
			.where(
				and(
					eq(schema.botScheduledSteps.contactId, contact.id),
					eq(schema.botScheduledSteps.status, 'pending'),
					sql`${schema.botScheduledSteps.scenarioId} in (select ${schema.botScenarios.id} from ${schema.botScenarios} where ${schema.botScenarios.protectedFromCancel} = false)`
				)
			);
	}

	await continueScenario(contact, scenario.id, null, newChainContext(depth));
}

/**
 * Продвигает цепочку на один шаг после позиции `afterPosition` (null — с начала).
 *
 * Каждый шаг сначала становится записью в bot_scheduled_steps и только потом
 * выполняется — даже шаг без задержки. Это стоит одной вставки, но даёт всему
 * тракту (а не только отложенным шагам) чекпоинты частичной доставки и ретрай
 * кроном: если процесс упадёт на середине цепочки, запись останется pending и
 * цепочка доедет, а не оборвётся молча.
 *
 * Шаг без задержки выполняется здесь же, синхронно, поэтому для человека ничего
 * не меняется: после /start сообщения приходят мгновенно. Дальше цепочку
 * двигает сам runScheduledStep — рекурсивно, шаг за шагом.
 */
export async function continueScenario(
	contact: BotContact,
	scenarioId: number,
	afterPosition: number | null,
	chain: ChainContext = newChainContext()
) {
	const queuedId = await enqueueNextStep(db, contact, scenarioId, afterPosition, chain);
	if (queuedId !== null) await runScheduledStep(queuedId, chain);
}

/**
 * Ставит в очередь ближайший шаг после `afterPosition`. Возвращает id задания,
 * которое надо выполнить прямо сейчас, или null — если шагов больше нет либо
 * ближайший отложенный (его заберёт cron).
 *
 * Принимает `tx`, чтобы постановку следующего шага можно было выполнить в одной
 * транзакции с завершением текущего: иначе падение между этими двумя записями
 * обрывает цепочку навсегда — текущий шаг уже `sent`, а следующего ещё нет.
 */
async function enqueueNextStep(
	tx: DbExecutor,
	contact: BotContact,
	scenarioId: number,
	afterPosition: number | null,
	chain: ChainContext
): Promise<number | null> {
	const [step] = await tx
		.select()
		.from(schema.botScenarioSteps)
		.where(
			and(
				eq(schema.botScenarioSteps.scenarioId, scenarioId),
				gt(schema.botScenarioSteps.position, afterPosition ?? -1)
			)
		)
		.orderBy(asc(schema.botScenarioSteps.position))
		.limit(1);
	if (!step) return null;

	// Условие шага проверяется не сейчас, а в момент выполнения: за время
	// задержки юзер мог подписаться (или отписаться) — считаем по состоянию тогда
	const [queued] = await tx
		.insert(schema.botScheduledSteps)
		.values({
			contactId: contact.id,
			scenarioId,
			stepId: step.id,
			// Глубину несёт сама запись — переживает задержку и рестарт процесса
			chainDepth: chain.depth,
			scheduledAt:
				step.delaySeconds > 0
					? sql`now() + make_interval(secs => ${step.delaySeconds})`
					: sql`now()`
		})
		.returning({ id: schema.botScheduledSteps.id });

	return step.delaySeconds > 0 ? null : queued.id;
}

/**
 * Нажатие «Я подписался» под шагом-шлагбаумом: перепроверяет подписку и, если
 * она есть, ставит следующий шаг в надёжную очередь. Сам callback сможет
 * ответить Telegram сразу, а очередь продолжит цепочку независимо от webhook.
 * sourceMessageId вместе с contactId и stepId защищает от повторной доставки
 * одного и того же нажатия Telegram'ом.
 */
export async function handleSubscriptionGateCallback(
	contact: BotContact,
	stepId: number,
	sourceMessageId: number
): Promise<SubscriptionGateCallbackResult> {
	const [step] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.id, stepId));
	if (!step) {
		return { alert: 'Кнопка больше не активна.', continuationId: null, accepted: false };
	}

	const [scenario] = await db
		.select()
		.from(schema.botScenarios)
		.where(eq(schema.botScenarios.id, step.scenarioId));
	if (!scenario?.enabled) {
		return { alert: 'Кнопка больше не активна.', continuationId: null, accepted: false };
	}

	const subscribed = await isContactSubscribed(
		step.scenarioId,
		contact.telegramUserId,
		CALLBACK_SUBSCRIPTION_TIMEOUT_MS
	);
	if (!subscribed) {
		const settings = await getQuizBotSettings();
		return { alert: settings.notSubscribedAlert, continuationId: null, accepted: false };
	}

	const [nextStep] = await db
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

	// Порядок важен: сначала ставим продолжение, потом снимаем всё остальное.
	//
	// Вставка заодно и распознаёт повторную доставку одного и того же нажатия:
	// уникальный индекс не даст поставить хвост дважды. Если бы отмена шла
	// первой, копия апдейта от Telegram сняла бы хвост, поставленный оригиналом,
	// и человек не получил бы вообще ничего.
	let queuedId: number | null = null;
	let continuationId: number | null = null;
	if (nextStep) {
		try {
			const [queued] = await db
				.insert(schema.botScheduledSteps)
				.values({
					contactId: contact.id,
					scenarioId: step.scenarioId,
					stepId: nextStep.id,
					sourceStepId: step.id,
					sourceMessageId,
					// Глубина с нуля: шлагбаум разрывает автоматическую цепочку — за
					// каждым продолжением стоит отдельное нажатие живого человека
					chainDepth: 0,
					scheduledAt:
						nextStep.delaySeconds > 0
							? sql`now() + make_interval(secs => ${nextStep.delaySeconds})`
							: sql`now()`
				})
				.returning({ id: schema.botScheduledSteps.id });
			queuedId = queued.id;
			// Отложенный хвост выполнит cron, торопить нечего
			continuationId = nextStep.delaySeconds > 0 ? null : queued.id;
		} catch (err) {
			if (!isConstraintViolation(err, GATE_CALLBACK_CONSTRAINT)) throw err;

			const [existing] = await db
				.select()
				.from(schema.botScheduledSteps)
				.where(
					and(
						eq(schema.botScheduledSteps.contactId, contact.id),
						eq(schema.botScheduledSteps.sourceStepId, step.id),
						eq(schema.botScheduledSteps.sourceMessageId, sourceMessageId)
					)
				)
				.limit(1);

			if (!existing) throw err;

			const revivable =
				existing.status === 'failed' ||
				(existing.status === 'cancelled' &&
					REVIVABLE_CANCELLATIONS.includes(existing.cancellationReason ?? ''));

			if (revivable) {
				const [revived] = await db
					.update(schema.botScheduledSteps)
					.set({
						status: 'pending',
						scheduledAt: sql`now()`,
						attempts: 0,
						lastError: null,
						cancellationReason: null,
						processedAt: null
					})
					.where(
						and(
							eq(schema.botScheduledSteps.id, existing.id),
							eq(schema.botScheduledSteps.status, existing.status)
						)
					)
					.returning({ id: schema.botScheduledSteps.id });
				queuedId = revived?.id ?? null;
				continuationId = queuedId;
			} else if (existing.cancellationReason === MANUAL_CANCELLATION) {
				return {
					alert: 'Не удалось продолжить отправку. Напишите боту или администратору.',
					continuationId: null,
					accepted: false
				};
			}
		}
	}

	// Кнопка ведёт себя как повторный /start: всё незавершённое по этой цепочке
	// снимаем, чтобы нажатие по старому сообщению не пустило вторую копию
	// параллельно уже идущей. Кроме, разумеется, только что поставленного хвоста.
	if (queuedId !== null) {
		await db
			.update(schema.botScheduledSteps)
			.set({
				status: 'cancelled',
				cancellationReason: 'gate_restarted',
				processedAt: sql`now()`
			})
			.where(
				and(
					eq(schema.botScheduledSteps.contactId, contact.id),
					eq(schema.botScheduledSteps.scenarioId, step.scenarioId),
					eq(schema.botScheduledSteps.status, 'pending'),
					ne(schema.botScheduledSteps.id, queuedId)
				)
			);
	}

	await markGatePassed(contact.id);
	return { alert: null, continuationId, accepted: true };
}

function isConstraintViolation(error: unknown, constraint: string): boolean {
	let current: unknown = error;
	for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth++) {
		const record = current as { code?: unknown; constraint?: unknown; cause?: unknown };
		if (record.code === '23505' && record.constraint === constraint) return true;
		current = record.cause;
	}
	return false;
}

/**
 * Подстановки в тексте/ссылках шага: {contact_id} — для персональных ссылок,
 * {first_name} — имя. #{client_id} — алиас из Salebot, чтобы скопированные
 * оттуда тексты работали без правок.
 */
function renderStepText(text: string, contact: BotContact): string {
	return text
		.replaceAll('{contact_id}', String(contact.publicId))
		.replaceAll('#{client_id}', String(contact.publicId))
		.replaceAll('{first_name}', contact.firstName ?? '');
}

/**
 * Клавиатура под сообщением шага. Обычный шаг — одна кнопка-ссылка.
 * Шаг-шлагбаум — ссылка на канал (button_url) плюс callback-кнопка проверки,
 * подпись которой берётся из общих настроек бота («Я подписался»).
 */
async function buildStepKeyboard(
	step: BotScenarioStep,
	contact: BotContact
): Promise<{ inline_keyboard: InlineKeyboardButton[][] } | null> {
	if (isGateStep(step)) {
		const rows: InlineKeyboardButton[][] = [];
		if (step.buttonText && step.buttonUrl) {
			rows.push([{ text: step.buttonText, url: renderStepText(step.buttonUrl, contact) }]);
		}
		const settings = await getQuizBotSettings();
		rows.push([
			{
				text: settings.checkButtonText,
				callback_data: `${SUBSCRIPTION_CALLBACK_PREFIX}${step.id}`
			}
		]);
		return { inline_keyboard: rows };
	}

	if (step.buttonText && step.buttonUrl) {
		return {
			inline_keyboard: [[{ text: step.buttonText, url: renderStepText(step.buttonUrl, contact) }]]
		};
	}

	return null;
}

/**
 * Выполняет один шаг: отправляет сообщение (если есть), добавляет теги, меняет
 * этап и запускает связанную цепочку. Возвращает false при блокировке ботом.
 */
async function executeStep(
	contact: BotContact,
	step: BotScenarioStep,
	depth = 0,
	scheduled?: BotScheduledStep
): Promise<boolean> {
	if (step.messageText && !scheduled?.messageTelegramId) {
		const rendered = renderStepText(step.messageText, contact);
		const replyMarkup = await buildStepKeyboard(step, contact);
		let sentMessageId: number;
		try {
			const sent = await clientBotApi.sendMessage(contact.telegramUserId, tgFormat(rendered), {
				parse_mode: 'HTML',
				...(replyMarkup ? { reply_markup: replyMarkup } : {})
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

		// Сначала фиксируем необратимый внешний эффект. Если позже упадут теги,
		// этап или связанная цепочка, ретрай не отправит это сообщение повторно.
		if (scheduled) {
			await db
				.update(schema.botScheduledSteps)
				.set({ messageTelegramId: sentMessageId })
				.where(eq(schema.botScheduledSteps.id, scheduled.id));
			scheduled.messageTelegramId = sentMessageId;
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

	if (step.filePath && !scheduled?.fileTelegramMessageId) {
		let sentMessageId: number | undefined;
		try {
			// После первой отправки Telegram возвращает file_id — дальше шлём по нему,
			// без повторной загрузки файла с диска
			const media =
				step.fileTelegramId ??
				new InputFile(absoluteStepFilePath(step.filePath), step.fileName ?? undefined);
			const sent = await clientBotApi.sendDocument(contact.telegramUserId, media);
			sentMessageId = sent.message_id;

			if (scheduled) {
				await db
					.update(schema.botScheduledSteps)
					.set({ fileTelegramMessageId: sentMessageId })
					.where(eq(schema.botScheduledSteps.id, scheduled.id));
				scheduled.fileTelegramMessageId = sentMessageId;
			}

			if (!step.fileTelegramId && sent.document?.file_id) {
				// file_path в условии — защита от кеширования id уже заменённого файла
				try {
					await db
						.update(schema.botScenarioSteps)
						.set({ fileTelegramId: sent.document.file_id })
						.where(
							and(
								eq(schema.botScenarioSteps.id, step.id),
								eq(schema.botScenarioSteps.filePath, step.filePath)
							)
						);
				} catch (err) {
					// Файл уже у пользователя и отмечен в queued-задании. Ошибка кеша
					// file_id не должна превращать успешную доставку в повторную.
					console.error('[bot-scenarios] Не смог закешировать Telegram file_id:', err);
				}
			}
		} catch (err) {
			if (err instanceof GrammyError && err.error_code === 403) {
				await setBotBlocked(contact.id, true);
				return false;
			}
			throw err;
		}

		try {
			await logOutboundMessage({
				contactId: contact.id,
				text: `📎 ${step.fileName ?? step.filePath}`,
				telegramMessageId: sentMessageId
			});
		} catch (err) {
			console.error('[bot-scenarios] Файл отправлен, но не записан в историю:', err);
		}
	}

	// Отправку не отозвать, а вот обратимые последствия — можно. Если задание сняли,
	// пока уходило сообщение, теги, этап и дочернюю цепочку применять уже нельзя:
	// администратор отменял именно их.
	if (scheduled && !(await isStillPending(scheduled.id))) {
		console.warn(
			`[bot-scenarios] Задание ${scheduled.id} отменили во время отправки — эффекты шага не применяю`
		);
		return true;
	}

	if ((step.addTags.length > 0 || step.setStage) && !scheduled?.effectsAppliedAt) {
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
		if (scheduled) {
			await db
				.update(schema.botScheduledSteps)
				.set({ effectsAppliedAt: sql`now()` })
				.where(eq(schema.botScheduledSteps.id, scheduled.id));
			scheduled.effectsAppliedAt = new Date().toISOString();
		}
	}

	// Запуск связанной цепочки (например, «не догрелся → классическая рассылка»)
	if (step.startScenarioId && !scheduled?.childScenarioStartedAt) {
		const [chained] = await db
			.select()
			.from(schema.botScenarios)
			.where(
				and(eq(schema.botScenarios.id, step.startScenarioId), eq(schema.botScenarios.enabled, true))
			);
		if (chained) {
			await triggerScenarioForContact(chained, contact, depth + 1);
		}
		if (scheduled) {
			await db
				.update(schema.botScheduledSteps)
				.set({ childScenarioStartedAt: sql`now()` })
				.where(eq(schema.botScheduledSteps.id, scheduled.id));
			scheduled.childScenarioStartedAt = new Date().toISOString();
		}
	}

	return true;
}

export type SegmentFilter = {
	requireTags: string[];
	excludeTags: string[];
	/**
	 * Только контакты, у которых нет ни одного ожидающего шага — ни в одной цепочке,
	 * включая саму запускаемую. Отдельного признака «идёт цепочка» у контакта нет:
	 * цепочка = pending-запись в bot_scheduled_steps. Контакт, остановившийся на
	 * непройденном шлагбауме подписки, pending-записей не имеет и считается свободным.
	 */
	onlyIdle?: boolean;
};

async function selectSegmentContactIds(filter: SegmentFilter): Promise<number[]> {
	const conditions = [eq(schema.botContacts.botBlocked, false)];
	if (filter.requireTags.length > 0) {
		conditions.push(
			sql`${schema.botContacts.tags} @> ${pgTextArrayLiteral(filter.requireTags)}::text[]`
		);
	}
	if (filter.excludeTags.length > 0) {
		conditions.push(
			sql`not (${schema.botContacts.tags} && ${pgTextArrayLiteral(filter.excludeTags)}::text[])`
		);
	}
	if (filter.onlyIdle) {
		conditions.push(
			sql`not exists (select 1 from ${schema.botScheduledSteps} where ${schema.botScheduledSteps.contactId} = ${schema.botContacts.id} and ${schema.botScheduledSteps.status} = 'pending')`
		);
	}

	const contacts = await db
		.select({ id: schema.botContacts.id })
		.from(schema.botContacts)
		.where(and(...conditions));
	return contacts.map((c) => c.id);
}

/**
 * Сколько контактов подходит под сегмент и сколько из них отсеет onlyIdle
 * (заняты другой цепочкой). Ничего не пишет — для предпросмотра перед запуском.
 */
export async function previewSegment(
	filter: SegmentFilter
): Promise<{ matched: number; busy: number; willReceive: number }> {
	const matched = (await selectSegmentContactIds({ ...filter, onlyIdle: false })).length;
	const willReceive = filter.onlyIdle ? (await selectSegmentContactIds(filter)).length : matched;
	return { matched, busy: matched - willReceive, willReceive };
}

/**
 * Массовый запуск цепочки (рассылки) по сегменту: всем контактам, у которых
 * есть все requireTags и нет ни одного из excludeTags (и бот не заблокирован),
 * первый шаг ставится в очередь — отправка идёт порциями через cron, чтобы
 * не упереться в лимиты Telegram. Повторный запуск перезапускает цепочку
 * (её ожидающие шаги отменяются) — кроме режима onlyIdle: там отмены нет, кто
 * уже идёт по цепочке (в том числе по этой же), спокойно доходит до конца, а
 * новый запуск получают только свободные. Возвращает число контактов.
 */
export async function launchScenarioForSegment(
	scenarioId: number,
	filter: SegmentFilter,
	launchAt: Date | null = null
): Promise<number> {
	const [firstStep] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.scenarioId, scenarioId))
		.orderBy(asc(schema.botScenarioSteps.position))
		.limit(1);
	if (!firstStep) return 0;

	const contactIds = await selectSegmentContactIds(filter);

	if (contactIds.length > 0) {
		// Транзакция: иначе падение между отменой и вставкой снимет старую очередь,
		// не поставив новую — контакты выпадут из рассылки без следа
		await db.transaction(async (tx) => {
			// Отмена всей очереди рассылки задела бы и тех, кто в сегмент не попал
			// (заняты этой же рассылкой) — они выпали бы из неё на полпути
			if (!filter.onlyIdle) {
				await tx
					.update(schema.botScheduledSteps)
					.set({
						status: 'cancelled',
						cancellationReason: 'broadcast_restarted',
						processedAt: sql`now()`
					})
					.where(
						and(
							eq(schema.botScheduledSteps.scenarioId, scenarioId),
							eq(schema.botScheduledSteps.status, 'pending')
						)
					);
			}

			await tx.insert(schema.botScheduledSteps).values(
				contactIds.map((contactId) => ({
					contactId,
					scenarioId,
					stepId: firstStep.id,
					scheduledAt: launchAt
						? sql`${launchAt.toISOString()}::timestamptz + make_interval(secs => ${firstStep.delaySeconds})`
						: sql`now() + make_interval(secs => ${firstStep.delaySeconds})`
				}))
			);
		});
	}

	await db.insert(schema.botBroadcastRuns).values({
		scenarioId,
		requireTags: filter.requireTags,
		excludeTags: filter.excludeTags,
		onlyIdle: filter.onlyIdle ?? false,
		matchedCount: contactIds.length
	});

	return contactIds.length;
}

/** Отменяет один конкретный пакет первого шага, запланированный на точное время. */
export async function cancelScheduledLaunch(
	scenarioId: number,
	stepId: number,
	scheduledAt: string
): Promise<number> {
	const cancelled = await db
		.update(schema.botScheduledSteps)
		.set({
			status: 'cancelled',
			cancellationReason: MANUAL_CANCELLATION,
			processedAt: sql`now()`
		})
		.where(
			and(
				eq(schema.botScheduledSteps.scenarioId, scenarioId),
				eq(schema.botScheduledSteps.stepId, stepId),
				eq(schema.botScheduledSteps.scheduledAt, scheduledAt),
				eq(schema.botScheduledSteps.status, 'pending')
			)
		)
		.returning({ id: schema.botScheduledSteps.id });

	return cancelled.length;
}

/**
 * Удаляет шаг, не бросая контактов, которые его ждут: их ожидающие записи
 * переводятся на следующий шаг цепочки (время срабатывания сохраняется);
 * если следующего шага нет — записи отменяются.
 */
export async function deleteStepAndRepointQueue(id: number) {
	await db.transaction(async (tx) => {
		const [step] = await tx
			.select()
			.from(schema.botScenarioSteps)
			.where(eq(schema.botScenarioSteps.id, id));
		if (!step) return;

		const [next] = await tx
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
			await tx.update(schema.botScheduledSteps).set({ stepId: next.id }).where(pendingOfStep);
		} else {
			await tx
				.update(schema.botScheduledSteps)
				.set({
					status: 'cancelled',
					cancellationReason: 'step_deleted_no_successor',
					processedAt: sql`now()`
				})
				.where(pendingOfStep);
		}

		await tx.delete(schema.botScenarioSteps).where(eq(schema.botScenarioSteps.id, id));
	});
}

/** Задание очереди вместе со всем, что нужно для его выполнения. */
type DueScheduledStep = {
	scheduled: BotScheduledStep;
	step: BotScenarioStep;
	contact: BotContact;
	scenario: BotScenario;
};

/**
 * Задания очереди, готовые к выполнению прямо сейчас. `extra` сужает выборку
 * до одной записи, когда её надо выполнить адресно (см. runScheduledStep).
 */
function selectDueScheduledSteps(extra?: SQL) {
	return db
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
				lte(schema.botScheduledSteps.scheduledAt, sql`now()`),
				...(extra ? [extra] : [])
			)
		);
}

/**
 * Атомарный захват задания: сдвигаем scheduledAt в будущее — параллельный
 * процесс (cron, другой инстанс во время деплоя, соседний webhook) по условию
 * scheduled_at <= now() эту запись уже не возьмёт. При падении процесса запись
 * останется pending и ретраится через 10 минут.
 * Возвращает номер попытки или null, если задание перехватили.
 */
async function claimScheduledStep(scheduled: BotScheduledStep): Promise<number | null> {
	const attempts = scheduled.attempts + 1;
	const claimed = await db
		.update(schema.botScheduledSteps)
		.set({
			scheduledAt: sql`now() + interval '10 minutes'`,
			attempts
		})
		.where(
			and(
				eq(schema.botScheduledSteps.id, scheduled.id),
				eq(schema.botScheduledSteps.status, 'pending'),
				lte(schema.botScheduledSteps.scheduledAt, sql`now()`)
			)
		)
		.returning({ id: schema.botScheduledSteps.id });
	return claimed.length > 0 ? attempts : null;
}

/**
 * Выполняет уже захваченное задание и, если шаг доставлен, продвигает цепочку
 * дальше. Ошибки не пробрасывает: запись остаётся pending (или failed после
 * MAX_ATTEMPTS), и её подберёт cron. `delivered` — сообщение ушло человеку,
 * `failed` — шаг упал и будет ретраиться (нужно только для счётчиков крона).
 */
async function runClaimedStep(
	{ scheduled, step, contact, scenario }: DueScheduledStep,
	attempts: number,
	chain: ChainContext
): Promise<{ delivered: boolean; failed: boolean }> {
	try {
		// Шаг завис в ретраях (например, процесс падал на середине отправки)
		if (attempts > MAX_ATTEMPTS) {
			await markScheduled(scheduled.id, { status: 'failed', attempts });
			return { delivered: false, failed: false };
		}

		// Сценарий выключили или юзер заблокировал бота, пока шаг ждал в очереди
		if (!scenario.enabled) {
			await markScheduled(scheduled.id, {
				status: 'cancelled',
				cancellationReason: 'scenario_disabled'
			});
			return { delivered: false, failed: false };
		}
		if (contact.botBlocked) {
			await markScheduled(scheduled.id, {
				status: 'cancelled',
				cancellationReason: 'contact_blocked'
			});
			return { delivered: false, failed: false };
		}

		// Условие проверяем здесь, а не при планировании: за время задержки
		// юзер мог подписаться (или отписаться) — считаем по состоянию сейчас
		if (step.condition) {
			const subscribed = await subscribedInChain(
				scheduled.scenarioId,
				contact.telegramUserId,
				chain
			);
			const met = step.condition === 'subscribed' ? subscribed : !subscribed;
			if (!met) {
				// Отдельный терминальный статус: шаг не отправляли (значит не 'sent'),
				// но и не сломался (значит не 'cancelled', и повторное нажатие
				// «Я подписался» не должно пытаться его оживить).
				const nextId = await finishAndEnqueueNext(scheduled.id, { status: 'skipped' }, (tx) =>
					enqueueNextStep(tx, contact, scheduled.scenarioId, step.position, chain)
				);
				if (nextId !== null) await runScheduledStep(nextId, chain);
				return { delivered: false, failed: false };
			}
		}

		const delivered = await executeStep(contact, step, chain.depth, scheduled);

		if (!delivered) {
			await markScheduled(scheduled.id, {
				status: 'cancelled',
				cancellationReason: 'contact_blocked'
			});
			return { delivered: false, failed: false };
		}

		// Шлагбаум ждёт нажатия «Я подписался» — дальше цепочку двигает callback,
		// ставить следующий шаг сейчас нечего
		if (isGateStep(step)) {
			if (await markScheduled(scheduled.id, { status: 'sent' })) {
				await markGateShown(contact.id);
			}
			return { delivered: true, failed: false };
		}

		const nextId = await finishAndEnqueueNext(scheduled.id, { status: 'sent' }, (tx) =>
			enqueueNextStep(tx, contact, scheduled.scenarioId, step.position, chain)
		);
		if (nextId !== null) await runScheduledStep(nextId, chain);
		return { delivered: true, failed: false };
	} catch (err) {
		// При status='pending' шаг ретраится, когда сдвинутый scheduledAt назреет (~10 мин)
		logSafeError(`[bot-scenarios] Шаг очереди ${scheduled.id} упал:`, err);
		await markScheduled(scheduled.id, {
			status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
			attempts,
			lastError: err instanceof Error ? err.message : String(err)
		});
		return { delivered: false, failed: true };
	}
}

/**
 * Выполняет одно конкретное задание очереди немедленно, не трогая остальные.
 *
 * Нужно там, где человек ждёт ответа прямо сейчас: нажал «Я подписался» или
 * прислал /start. Гонять ради этого общую очередь нельзя — задание встало бы
 * в хвост назревшей рассылки и материал приехал бы через минуты.
 */
export async function runScheduledStep(id: number, chain?: ChainContext): Promise<boolean> {
	const [due] = await selectDueScheduledSteps(eq(schema.botScheduledSteps.id, id)).limit(1);
	if (!due) return false; // ещё не назрело, отменено или уже выполнено

	const { delivered } = await runDueRow(due, chain);
	return delivered;
}

/**
 * Захватывает и выполняет назревшее задание. Глубину цепочки берём из самой
 * записи, если её не передал синхронный проход: только так предохранитель от
 * циклов (см. MAX_CHAIN_DEPTH в triggerScenarioForContact) переживает задержку
 * между шагами и продолжает считать сквозь тики крона.
 */
async function runDueRow(
	due: DueScheduledStep,
	chain?: ChainContext
): Promise<{ delivered: boolean; failed: boolean }> {
	const attempts = await claimScheduledStep(due.scheduled);
	if (attempts === null) return { delivered: false, failed: false }; // захватил другой процесс

	return runClaimedStep(due, attempts, chain ?? newChainContext(due.scheduled.chainDepth));
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
	const due = await selectDueScheduledSteps()
		.orderBy(asc(schema.botScheduledSteps.scheduledAt))
		.limit(200);

	let sent = 0;
	let errors = 0;

	for (const row of due) {
		// Контекст каждому заданию свой: ответ Telegram о подписке одного контакта
		// не должен переезжать на соседнего, а глубина берётся из самой записи
		const result = await runDueRow(row);
		if (result.delivered) sent++;
		if (result.failed) errors++;
	}

	return { processed: due.length, sent, errors };
}

/**
 * Переводит задание в терминальный статус — но только если оно всё ещё pending.
 *
 * Захват шага не выводит запись из pending (двигается лишь scheduledAt), поэтому
 * пока идёт отправка, администратор или перезапуск цепочки могут пометить её
 * cancelled. Без этой проверки воркер затирал бы отмену обратно в 'sent' и вёл
 * человека по цепочке, которую уже сняли. Возвращает false, если статус
 * перехватили: отправку не вернуть, но продолжать цепочку в таком случае нельзя.
 */
async function markScheduled(
	id: number,
	data: MarkScheduledData,
	executor: DbExecutor = db
): Promise<boolean> {
	const updated = await executor
		.update(schema.botScheduledSteps)
		.set({ ...data, processedAt: sql`now()` })
		.where(and(eq(schema.botScheduledSteps.id, id), eq(schema.botScheduledSteps.status, 'pending')))
		.returning({ id: schema.botScheduledSteps.id });
	return updated.length > 0;
}

/**
 * Завершает текущее задание и ставит следующее — одной транзакцией.
 *
 * Порознь эти две записи оставляют дыру, в которую цепочка проваливается
 * навсегда: текущий шаг уже 'sent', вставка следующего упала, а вернуть текущий
 * в 'pending' уже нельзя — markScheduled обновляет только pending. В очереди не
 * остаётся ничего, что могло бы цепочку продолжить.
 *
 * Возвращает id следующего задания к немедленному выполнению или null — если
 * шагов больше нет, следующий отложен, либо текущее задание успели отменить.
 */
async function finishAndEnqueueNext(
	id: number,
	data: MarkScheduledData,
	enqueue: (tx: DbExecutor) => Promise<number | null>
): Promise<number | null> {
	return db.transaction(async (tx) => {
		if (!(await markScheduled(id, data, tx))) {
			// Задание отменили, пока шаг отправлялся: отправку не вернуть, но хвост
			// снятой цепочки продолжать нельзя
			console.warn(
				`[bot-scenarios] Задание ${id} отменили во время отправки — цепочку не продолжаю`
			);
			return null;
		}
		return enqueue(tx);
	});
}
