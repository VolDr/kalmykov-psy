import { GrammyError } from 'grammy';
import type { InlineKeyboardButton } from 'grammy/types';
import * as schema from '../../db/schema';
import {
	clientBotApi,
	tgFormat,
	TELEGRAM_MESSAGE_LIMIT
} from './telegram-client-bot.server';
import { chatIdForApi } from './bot-channel-posts.server';
import { addTagsToContact, logOutboundMessage, setBotBlocked } from './bot-contacts.server';
import { triggerScenarioByKey } from './bot-scenarios.server';
import {
	claimQuizResult,
	getQuizBotSettings,
	getQuizResultByToken,
	markQuizResultDelivered,
	type QuizBotSettings,
	type QuizResult
} from './quiz-results.server';
import { buildQuizResultBlocks, packMessages } from './quiz-messages';

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
async function isSubscribed(settings: QuizBotSettings, telegramUserId: number): Promise<boolean> {
	if (!settings.requireSubscription || !settings.channelChatId) return true;
	try {
		const member = await clientBotApi.getChatMember(
			chatIdForApi(settings.channelChatId),
			telegramUserId
		);
		return ['creator', 'administrator', 'member'].includes(member.status);
	} catch (err) {
		console.error('[quiz-bot] getChatMember не удался:', err);
		return true;
	}
}

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
			console.error('[quiz-bot] Сообщение отправлено, но не записано в историю:', err);
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

	await markQuizResultDelivered(result.id, contact.id);
	await addTagsToContact(contact.id, ['quiz_burnout', `quiz_burnout_${result.color}`]);
	await triggerScenarioByKey(RESULTS_DELIVERED_SCENARIO_KEY, contact.id);
}

/**
 * Обработка диплинка /start qr_<token>. Возвращает false, если токен неизвестен —
 * тогда вызывающий код падает обратно на обычные сценарии /start.
 * Без подписки — сообщение с кнопками «Подписаться» и «Я подписался».
 */
export async function handleQuizDeeplink(contact: BotContact, token: string): Promise<boolean> {
	const result = await getQuizResultByToken(token);
	if (!result) return false;

	await claimQuizResult(result.id, contact.id);

	const settings = await getQuizBotSettings();
	if (await isSubscribed(settings, contact.telegramUserId)) {
		await deliverQuizResults(contact, result, settings);
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
 * Клик «Я подписался» (callback qz:<token>): перепроверяем подписку; подписан —
 * выдаём разбор, нет — алерт. Возвращает текст алерта или null (алерт не нужен).
 */
export async function handleQuizCheckCallback(
	contact: BotContact,
	token: string
): Promise<string | null> {
	const result = await getQuizResultByToken(token);
	if (!result) return 'Не нашёл результаты — пройдите опросник ещё раз, пожалуйста.';

	const settings = await getQuizBotSettings();
	if (!(await isSubscribed(settings, contact.telegramUserId))) {
		return settings.notSubscribedAlert;
	}

	await deliverQuizResults(contact, result, settings);
	return null;
}
