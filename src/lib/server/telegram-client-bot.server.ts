import type { Api } from 'grammy';
import { Bot } from 'grammy';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { TELEGRAM_CLIENT_BOT_TOKEN } from '$env/static/private';
import { logInboundMessage, upsertContactFromTelegramUser } from './bot-contacts.server';
import { findTriggeredScenarios, triggerScenarioForContact } from './bot-scenarios.server';
import {
	chatIdForApi,
	getChannelPost,
	incrementChannelPostClicks
} from './bot-channel-posts.server';

/** Экранирует спецсимволы HTML для Telegram parse_mode:'HTML' */
export function tgEscape(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Лимит Telegram на длину текстового сообщения. Проверять надо длину
 * УЖЕ экранированного текста (tgEscape раздувает & < > в entities).
 */
export const TELEGRAM_MESSAGE_LIMIT = 4096;

/**
 * Мини-разметка для сообщений бота (тот же синтаксис, что у MarkdownLink на сайте):
 * **жирный** → <b>, [текст](https://url) → <a>; переносы строк Telegram сохраняет сам.
 * Сначала всё экранируется, поэтому произвольный HTML в тексте безопасен.
 */
export function tgFormat(text: string): string {
	return tgEscape(text)
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}

// Исходящие запросы к Telegram Bot API с этого хостинга требуют SOCKS5-прокси —
// тот же прокси, что использует личный бот уведомлений (telegram.server.ts).
const agent = new SocksProxyAgent('socks5://127.0.0.1:1080');

export const clientBot = new Bot(TELEGRAM_CLIENT_BOT_TOKEN, {
	client: { baseFetchConfig: { agent, compress: true } }
});

export const clientBotApi: Api = clientBot.api;

let cachedBotUsername: string | null = null;

/** Username бота для диплинков t.me/<bot>?start=… — берём из getMe и кешируем. */
async function getBotUsername(): Promise<string> {
	if (!cachedBotUsername) {
		cachedBotUsername = (await clientBotApi.getMe()).username;
	}
	return cachedBotUsername;
}

// Приём сообщений: CRM-контакт + инбокс (Фаза 1), затем триггеры сценариев (Фаза 2).
clientBot.on('message', async (ctx) => {
	const from = ctx.from;
	if (!from) return;

	const contact = await upsertContactFromTelegramUser(from);
	await logInboundMessage({
		contactId: contact.id,
		text: ctx.message.text ?? null,
		telegramMessageId: ctx.message.message_id,
		payload: ctx.update
	});

	// Один триггер может запускать несколько цепочек — запускаем все совпавшие
	const scenarios = await findTriggeredScenarios(ctx.message.text);
	for (const scenario of scenarios) {
		await triggerScenarioForContact(scenario, contact);
	}
});

// Клик по кнопке на посте канала: проверяем подписку через getChatMember и отдаём
// диплинк t.me/<bot>?start=<payload> через answerCallbackQuery — сценарий запустится,
// когда юзер нажмёт Start в открывшемся чате с ботом (придёт /start <payload>).
clientBot.on('callback_query:data', async (ctx) => {
	const match = /^cp:(\d+)$/.exec(ctx.callbackQuery.data);
	if (!match) {
		await ctx.answerCallbackQuery();
		return;
	}

	const row = await getChannelPost(Number(match[1]));
	if (!row || !row.scenario.enabled || !row.scenario.triggerValue) {
		await ctx.answerCallbackQuery({ text: 'Кнопка больше не активна.', show_alert: true });
		return;
	}

	if (row.post.requireSubscription) {
		let isMember = true;
		try {
			const member = await ctx.api.getChatMember(chatIdForApi(row.post.chatId), ctx.from.id);
			isMember = ['creator', 'administrator', 'member'].includes(member.status);
		} catch (err) {
			// Не смогли проверить (например, бот не админ канала) — не блокируем юзера
			console.error('[client-bot] getChatMember не удался:', err);
		}
		if (!isMember) {
			await ctx.answerCallbackQuery({
				text: row.post.subscriptionPrompt ?? 'Подпишитесь на канал, чтобы получить материал 🙌',
				show_alert: true
			});
			return;
		}
	}

	await incrementChannelPostClicks(row.post.id);

	const username = await getBotUsername();
	await ctx.answerCallbackQuery({
		url: `https://t.me/${username}?start=${row.scenario.triggerValue}`
	});
});
