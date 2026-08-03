import { db } from '../..';
import * as schema from '../../db/schema';
import { and, asc, eq, gt, lte, sql } from 'drizzle-orm';
import { GrammyError, InputFile } from 'grammy';
import type { InlineKeyboardButton } from 'grammy/types';
import { clientBotApi, tgFormat } from './telegram-client-bot.server';
import { absoluteStepFilePath } from './bot-step-files.server';
import { chatIdForApi } from './bot-channel-posts.server';
import { getQuizBotSettings } from './quiz-results.server';
import { markGatePassed, markGateShown } from './bot-funnel.server';
import {
	getContact,
	logOutboundMessage,
	pgTextArrayLiteral,
	setBotBlocked
} from './bot-contacts.server';

const MAX_ATTEMPTS = 3;

/** Префикс callback data кнопки «Я подписался» у шага-шлагбаума: sub:<stepId> */
export const SUBSCRIPTION_CALLBACK_PREFIX = 'sub:';

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
	telegramUserId: number
): Promise<boolean> {
	const chatId = await resolveScenarioChannelChatId(scenarioId);
	if (!chatId) return true;
	try {
		const member = await clientBotApi.getChatMember(chatIdForApi(chatId), telegramUserId);
		return ['creator', 'administrator', 'member'].includes(member.status);
	} catch (err) {
		console.error('[bot-scenarios] getChatMember не удался:', err);
		return true;
	}
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

	// Кулдаун «не запускать чаще раза в N дней»: недавний запуск — молча выходим
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
		if (recent) return;

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
				if (!(err instanceof Error && err.message.includes('bot_scenario_runs_contact_scenario_key'))) {
					throw err;
				}
			}
		}
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
 *
 * Шаг с условием, которое не выполнено, пропускается — цепочка идёт дальше.
 * Шаг-шлагбаум («Проверить подписку») останавливает цепочку: продолжит её
 * handleSubscriptionGateCallback, когда юзер нажмёт кнопку.
 */
export async function continueScenario(
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

	// Подписку в рамках одного прохода спрашиваем у Telegram максимум один раз
	let subscribed: boolean | undefined;
	const subscribedNow = async () => {
		if (subscribed === undefined) {
			subscribed = await isContactSubscribed(scenarioId, contact.telegramUserId);
		}
		return subscribed;
	};

	for (const step of steps) {
		if (step.delaySeconds > 0) {
			// Условие отложенного шага проверяется не сейчас, а при его отправке
			// (processDueScheduledSteps) — за время задержки юзер мог подписаться
			await db.insert(schema.botScheduledSteps).values({
				contactId: contact.id,
				scenarioId,
				stepId: step.id,
				scheduledAt: sql`now() + make_interval(secs => ${step.delaySeconds})`
			});
			return;
		}

		if (step.condition) {
			const met =
				step.condition === 'subscribed' ? await subscribedNow() : !(await subscribedNow());
			if (!met) continue;
		}

		const delivered = await executeStep(contact, step, depth);
		if (!delivered) return; // юзер заблокировал бота — цепочку останавливаем
		if (isGateStep(step)) {
			await markGateShown(contact.id);
			return; // ждём нажатия «Я подписался»
		}
	}
}

/**
 * Нажатие «Я подписался» под шагом-шлагбаумом: перепроверяет подписку и, если
 * она есть, продолжает цепочку со следующего шага. Возвращает текст алерта
 * (юзер всё ещё не подписан / шаг устарел) или null, если всё прошло.
 */
export async function handleSubscriptionGateCallback(
	contact: BotContact,
	stepId: number
): Promise<string | null> {
	const [step] = await db
		.select()
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.id, stepId));
	if (!step) return 'Кнопка больше не активна.';

	const [scenario] = await db
		.select()
		.from(schema.botScenarios)
		.where(eq(schema.botScenarios.id, step.scenarioId));
	if (!scenario?.enabled) return 'Кнопка больше не активна.';

	if (!(await isContactSubscribed(step.scenarioId, contact.telegramUserId))) {
		const settings = await getQuizBotSettings();
		return settings.notSubscribedAlert;
	}

	await markGatePassed(contact.id);
	await continueScenario(contact, step.scenarioId, step.position);
	return null;
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
	depth = 0
): Promise<boolean> {
	if (step.messageText) {
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

	if (step.filePath) {
		let sentMessageId: number | undefined;
		try {
			// После первой отправки Telegram возвращает file_id — дальше шлём по нему,
			// без повторной загрузки файла с диска
			const media =
				step.fileTelegramId ?? new InputFile(absoluteStepFilePath(step.filePath), step.fileName ?? undefined);
			const sent = await clientBotApi.sendDocument(contact.telegramUserId, media);
			sentMessageId = sent.message_id;

			if (!step.fileTelegramId && sent.document?.file_id) {
				// file_path в условии — защита от кеширования id уже заменённого файла
				await db
					.update(schema.botScenarioSteps)
					.set({ fileTelegramId: sent.document.file_id })
					.where(
						and(
							eq(schema.botScenarioSteps.id, step.id),
							eq(schema.botScenarioSteps.filePath, step.filePath)
						)
					);
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
		conditions.push(
			sql`${schema.botContacts.tags} @> ${pgTextArrayLiteral(filter.requireTags)}::text[]`
		);
	}
	if (filter.excludeTags.length > 0) {
		conditions.push(
			sql`not (${schema.botContacts.tags} && ${pgTextArrayLiteral(filter.excludeTags)}::text[])`
		);
	}

	const contacts = await db
		.select({ id: schema.botContacts.id })
		.from(schema.botContacts)
		.where(and(...conditions));

	if (contacts.length > 0) {
		// Транзакция: иначе падение между отменой и вставкой снимет старую очередь,
		// не поставив новую — контакты выпадут из рассылки без следа
		await db.transaction(async (tx) => {
			await tx
				.update(schema.botScheduledSteps)
				.set({ status: 'cancelled', processedAt: sql`now()` })
				.where(
					and(
						eq(schema.botScheduledSteps.scenarioId, scenarioId),
						eq(schema.botScheduledSteps.status, 'pending')
					)
				);

			await tx.insert(schema.botScheduledSteps).values(
				contacts.map((c) => ({
					contactId: c.id,
					scenarioId,
					stepId: firstStep.id,
					scheduledAt: sql`now() + make_interval(secs => ${firstStep.delaySeconds})`
				}))
			);
		});
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
				.set({ status: 'cancelled', processedAt: sql`now()` })
				.where(pendingOfStep);
		}

		await tx.delete(schema.botScenarioSteps).where(eq(schema.botScenarioSteps.id, id));
	});
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
		// Атомарный захват шага: сдвигаем scheduledAt в будущее — параллельный
		// процесс (например, старый инстанс во время деплоя) по условию
		// scheduled_at <= now() этот шаг уже не возьмёт. При падении процесса
		// шаг останется pending и ретраится через 10 минут.
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
		if (claimed.length === 0) continue; // шаг захватил другой процесс

		try {
			// Шаг завис в ретраях (например, процесс падал на середине отправки)
			if (attempts > MAX_ATTEMPTS) {
				await markScheduled(scheduled.id, { status: 'failed', attempts });
				continue;
			}

			// Сценарий выключили или юзер заблокировал бота, пока шаг ждал в очереди
			if (!scenario.enabled || contact.botBlocked) {
				await markScheduled(scheduled.id, { status: 'cancelled' });
				continue;
			}

			// Условие проверяем здесь, а не при планировании: за время задержки
			// юзер мог подписаться (или отписаться) — считаем по состоянию сейчас
			if (step.condition) {
				const subscribed = await isContactSubscribed(
					scheduled.scenarioId,
					contact.telegramUserId
				);
				const met = step.condition === 'subscribed' ? subscribed : !subscribed;
				if (!met) {
					await markScheduled(scheduled.id, { status: 'cancelled' });
					await continueScenario(contact, scheduled.scenarioId, step.position);
					continue;
				}
			}

			const delivered = await executeStep(contact, step);
			await markScheduled(scheduled.id, { status: delivered ? 'sent' : 'cancelled' });

			if (delivered) {
				sent++;
				if (isGateStep(step)) {
					// Шлагбаум ждёт нажатия «Я подписался» — дальше цепочку двигает callback
					await markGateShown(contact.id);
				} else {
					await continueScenario(contact, scheduled.scenarioId, step.position);
				}
			}
		} catch (err) {
			errors++;
			// При status='pending' шаг ретраится, когда сдвинутый scheduledAt назреет (~10 мин)
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
