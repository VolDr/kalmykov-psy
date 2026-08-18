import { GrammyError } from 'grammy';
import type { InlineKeyboardButton } from 'grammy/types';
import * as schema from '../../db/schema';
import {
	apiDeadline,
	CALLBACK_SUBSCRIPTION_TIMEOUT_MS,
	clientBotApi,
	tgFormat,
	TELEGRAM_MESSAGE_LIMIT
} from './telegram-client-bot.server';
import { chatIdForApi } from './bot-channel-posts.server';
import { addTagsToContact, logOutboundMessage, setBotBlocked } from './bot-contacts.server';
import { triggerScenarioByKey } from './bot-scenarios.server';
import {
	claimQuizDelivery,
	claimQuizResult,
	findStalledQuizDeliveries,
	getQuizBotSettings,
	getQuizResultByToken,
	markQuizResultDelivered,
	type QuizBotSettings,
	type QuizResult
} from './quiz-results.server';
import { buildQuizResultBlocks, packMessages } from './quiz-messages';
import { logSafeError } from './log-error.server';

type BotContact = typeof schema.botContacts.$inferSelect;

/** Префикс start-payload диплинка: t.me/<бот>?start=qr_<token> */
export const QUIZ_START_PREFIX = 'qr_';
/** Префикс callback data кнопки «Я подписался»: qz:<token> */
export const QUIZ_CALLBACK_PREFIX = 'qz:';

/** Ключ start_param-сценария, который запускается после выдачи разбора (если настроен). */
const RESULTS_DELIVERED_SCENARIO_KEY = 'quiz_results_delivered';

/**
 * Подписан ли юзер на канал из настроек. Ошибка проверки (бот не админ канала
 * и т.п.) трактуется в пользу юзера — как в кнопках на постах.
 */
async function isSubscribed(
	settings: QuizBotSettings,
	telegramUserId: number,
	timeoutMs?: number
): Promise<boolean> {
	if (!settings.requireSubscription || !settings.channelChatId) return true;
	try {
		const member = await clientBotApi.getChatMember(
			chatIdForApi(settings.channelChatId),
			telegramUserId,
			apiDeadline(timeoutMs)
		);
		return ['creator', 'administrator', 'member'].includes(member.status);
	} catch (err) {
		logSafeError('[quiz-bot] getChatMember не удался:', err);
		return true;
	}
}

/**
 * Можно ли выдавать разбор прямо сейчас. Первая выдача захватывается атомарно,
 * чтобы два одновременных нажатия не прислали человеку два полных разбора и не
 * запустили дважды побочные эффекты. Повторный заход за уже выданным разбором —
 * это чтение по собственной ссылке, его не блокируем.
 */
async function mayDeliver(result: QuizResult): Promise<boolean> {
	if (result.deliveredAt) return true;
	return claimQuizDelivery(result.id);
}

/** Ответ тому, кто открыл чужую ссылку на результаты (её переслали). */
const FOREIGN_RESULT_TEXT =
	'Эта ссылка уже привязана к другому человеку. Пройдите опросник сами — и я пришлю ваш разбор.';

/** Отправляет сообщение с логом в инбокс; false — юзер заблокировал бота. */
async function sendAndLog(
	contact: BotContact,
	text: string,
	replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] }
): Promise<boolean> {
	try {
		const sent = await clientBotApi.sendMessage(contact.telegramUserId, tgFormat(text), {
			parse_mode: 'HTML',
			...(replyMarkup ? { reply_markup: replyMarkup } : {})
		});
		try {
			await logOutboundMessage({
				contactId: contact.id,
				text,
				telegramMessageId: sent.message_id
			});
		} catch (err) {
			logSafeError('[quiz-bot] Сообщение отправлено, но не записано в историю:', err);
		}
		return true;
	} catch (err) {
		if (err instanceof GrammyError && err.error_code === 403) {
			await setBotBlocked(contact.id, true);
			return false;
		}
		throw err;
	}
}

/**
 * Отправляет разбор по сферам: сводка, рекомендации, футер (склеенные по лимиту
 * Telegram). Сами сообщения шлём и при повторном заходе (юзер открыл ссылку, чтобы
 * их увидеть), но теги и прогревочную цепочку — только при ПЕРВОЙ выдаче
 * (по deliveredAt): повторный /start иначе перезапускал бы цепочку с начала.
 */
async function deliverQuizResults(
	contact: BotContact,
	result: QuizResult,
	settings: QuizBotSettings
): Promise<void> {
	const alreadyDelivered = result.deliveredAt !== null;

	const blocks = buildQuizResultBlocks(
		{
			averageScore: result.averageScore,
			severity: result.severity,
			color: result.color,
			subscales: result.subscales
		},
		settings
	);
	const messages = packMessages(blocks, TELEGRAM_MESSAGE_LIMIT, (text) => tgFormat(text).length);

	for (const message of messages) {
		const delivered = await sendAndLog(contact, message);
		if (!delivered) return;
	}

	if (alreadyDelivered) return;

	// Галочка «выдано» — последней. Она гасит подметание, поэтому если поставить
	// её раньше тегов и прогрева, их падение потеряется навсегда: восстановление
	// увидит запись завершённой и чинить не станет.
	await addTagsToContact(contact.id, ['quiz_burnout', `quiz_burnout_${result.color}`]);
	await triggerScenarioByKey(RESULTS_DELIVERED_SCENARIO_KEY, contact.id);
	await markQuizResultDelivered(result.id, contact.id);
}

/**
 * Обработка диплинка /start qr_<token>. Возвращает false, если токен неизвестен —
 * тогда вызывающий код падает обратно на обычные сценарии /start.
 * Без подписки — сообщение с кнопками «Подписаться» и «Я подписался».
 */
export async function handleQuizDeeplink(contact: BotContact, token: string): Promise<boolean> {
	const result = await getQuizResultByToken(token);
	if (!result) return false;

	// Ссылку могли переслать: результаты отдаём только тому, кто пришёл по ней первым
	if (!(await claimQuizResult(result.id, contact.id))) {
		await sendAndLog(contact, FOREIGN_RESULT_TEXT);
		return true;
	}

	const settings = await getQuizBotSettings();
	if (await isSubscribed(settings, contact.telegramUserId)) {
		if (await mayDeliver(result)) await deliverQuizResults(contact, result, settings);
		return true;
	}

	const buttons: InlineKeyboardButton[][] = [];
	if (settings.channelUrl) {
		buttons.push([{ text: settings.subscribeButtonText, url: settings.channelUrl }]);
	}
	buttons.push([
		{ text: settings.checkButtonText, callback_data: `${QUIZ_CALLBACK_PREFIX}${token}` }
	]);

	await sendAndLog(contact, settings.subscribeText, { inline_keyboard: buttons });
	return true;
}

/**
 * Клик «Я подписался» (callback qz:<token>): перепроверяем подписку и решаем,
 * можно ли выдавать разбор. Сама выдача — отдельным шагом (deliverQuizResults),
 * потому что у Telegram есть считаные секунды на ответ по callback, а разбор
 * это несколько сообщений подряд: пока они уходили, кнопка успевала протухнуть
 * и апдейт прилетал повторно.
 *
 * `alert` — что показать человеку, `deliver` — выдавать ли разбор после ответа.
 */
export async function handleQuizCheckCallback(
	contact: BotContact,
	token: string
): Promise<{ alert: string | null; deliver: (() => Promise<void>) | null }> {
	const result = await getQuizResultByToken(token);
	if (!result) {
		return { alert: 'Не нашёл результаты — пройдите опросник ещё раз, пожалуйста.', deliver: null };
	}

	if (!(await claimQuizResult(result.id, contact.id))) {
		return { alert: FOREIGN_RESULT_TEXT, deliver: null };
	}

	const settings = await getQuizBotSettings();
	const subscribed = await isSubscribed(
		settings,
		contact.telegramUserId,
		CALLBACK_SUBSCRIPTION_TIMEOUT_MS
	);
	if (!subscribed) {
		return { alert: settings.notSubscribedAlert, deliver: null };
	}

	// Захват ДО ответа Telegram, а не внутри deliver(): выдача уходит в фон, и
	// если процесс перезапустят сразу после ответа, следа не останется совсем —
	// кнопку мы уже сняли, а Telegram апдейт не повторит.
	if (!(await mayDeliver(result))) return { alert: null, deliver: null };

	return { alert: null, deliver: () => deliverQuizResults(contact, result, settings) };
}

/**
 * Доигрывает разборы, выдача которых оборвалась (рестарт процесса, сбой сети).
 * Вызывается кроном: сам callback отвечает Telegram сразу и шлёт разбор в фоне,
 * поэтому без этого подметания оборванная выдача терялась бы навсегда — кнопка
 * к тому моменту уже снята, и повторить её человеку нечем.
 *
 * Повтор шлёт блоки заново: гарантия at-least-once, как и у очереди шагов.
 */
export async function retryStalledQuizDeliveries(): Promise<number> {
	const stalled = await findStalledQuizDeliveries();
	if (stalled.length === 0) return 0;

	const settings = await getQuizBotSettings();
	let recovered = 0;

	for (const { result, contact } of stalled) {
		// Перезахватываем: иначе два инстанса подметания доиграли бы один разбор дважды
		if (!(await claimQuizDelivery(result.id))) continue;

		try {
			await deliverQuizResults(contact, result, settings);
			recovered++;
		} catch (err) {
			logSafeError(`[quiz-bot] Не смог доиграть разбор ${result.id}:`, err);
		}
	}

	return recovered;
}
