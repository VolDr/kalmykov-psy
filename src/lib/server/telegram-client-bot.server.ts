import type { Api } from 'grammy';
import { Bot } from 'grammy';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { TELEGRAM_CLIENT_BOT_TOKEN } from '$env/static/private';
import { logInboundMessage, upsertContactFromTelegramUser } from './bot-contacts.server';
import {
	findTriggeredScenarios,
	handleSubscriptionGateCallback,
	parseStartPayload,
	SUBSCRIPTION_CALLBACK_PREFIX,
	triggerScenarioForContact
} from './bot-scenarios.server';
import { markBotStarted } from './bot-funnel.server';
import { attachMetrikaClientId } from './bot-contacts.server';
import {
	chatIdForApi,
	getChannelPost,
	incrementChannelPostClicks
} from './bot-channel-posts.server';
import {
	handleQuizCheckCallback,
	handleQuizDeeplink,
	QUIZ_CALLBACK_PREFIX,
	QUIZ_START_PREFIX
} from './quiz-bot.server';

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

// Без bot.catch ошибка обработчика роняет вебхук в 500, и Telegram перепосылает
// апдейт — дубли входящих в инбоксе и повторные запуски цепочек. Логируем и отвечаем 200.
clientBot.catch((err) => {
	console.error('[client-bot] Ошибка обработчика апдейта:', err.error);
});

let cachedBotUsername: string | null = null;

/** Username бота для диплинков t.me/<bot>?start=… — берём из getMe и кешируем. */
export async function getBotUsername(): Promise<string> {
	if (!cachedBotUsername) {
		const username = (await clientBotApi.getMe()).username;
		if (!username) throw new Error('У бота нет username — диплинки невозможны');
		cachedBotUsername = username;
	}
	return cachedBotUsername;
}

// Приём сообщений: CRM-контакт + инбокс (Фаза 1), затем триггеры сценариев (Фаза 2).
clientBot.on('message', async (ctx) => {
	const from = ctx.from;
	if (!from) return;

	let contact = await upsertContactFromTelegramUser(from);
	await logInboundMessage({
		contactId: contact.id,
		text: ctx.message.text ?? null,
		telegramMessageId: ctx.message.message_id,
		payload: ctx.update
	});

	// Диплинк t.me/<бот>?start=<ключ>__<clientId>: ClientID Метрики связывает человека
	// в боте с его визитом на посадочной — без него офлайн-конверсию не к чему
	// прицепить. Пишем один раз, первый визит не перетираем.
	const trimmed = ctx.message.text?.trim() ?? '';
	const payload = trimmed.startsWith('/start') ? trimmed.slice('/start'.length).trim() : '';
	const { key, metrikaClientId } = payload
		? parseStartPayload(payload)
		: { key: '', metrikaClientId: null };

	if (metrikaClientId && !contact.metrikaClientId) {
		contact = (await attachMetrikaClientId(contact.id, metrikaClientId)) ?? contact;
	}

	// Диплинк с результатами опросника (/start qr_<token>) — выдача разбора по сферам.
	// Неизвестный токен — не обрабатываем, юзер получит обычное приветствие по /start.
	const quizMatch = new RegExp(`^/start\\s+${QUIZ_START_PREFIX}([A-Za-z0-9_-]{1,64})$`).exec(
		ctx.message.text?.trim() ?? ''
	);
	if (quizMatch && (await handleQuizDeeplink(contact, quizMatch[1]))) return;

	// Один триггер может запускать несколько цепочек — запускаем все совпавшие
	const scenarios = await findTriggeredScenarios(ctx.message.text);
	if (scenarios.length > 0) await markBotStarted(contact.id, key || null);
	for (const scenario of scenarios) {
		await triggerScenarioForContact(scenario, contact);
	}
});

// Клик по кнопке на посте канала: проверяем подписку через getChatMember и отдаём
// диплинк t.me/<bot>?start=<payload> через answerCallbackQuery — сценарий запустится,
// когда юзер нажмёт Start в открывшемся чате с ботом (придёт /start <payload>).
clientBot.on('callback_query:data', async (ctx) => {
	// Кнопка «Я подписался» под сообщением о результатах опросника (qz:<token>)
	if (ctx.callbackQuery.data.startsWith(QUIZ_CALLBACK_PREFIX)) {
		const token = ctx.callbackQuery.data.slice(QUIZ_CALLBACK_PREFIX.length);
		const contact = await upsertContactFromTelegramUser(ctx.from);
		const alert = await handleQuizCheckCallback(contact, token);
		await ctx.answerCallbackQuery(alert ? { text: alert, show_alert: true } : {});
		return;
	}

	// Кнопка «Я подписался» под шагом-шлагбаумом цепочки (sub:<stepId>)
	if (ctx.callbackQuery.data.startsWith(SUBSCRIPTION_CALLBACK_PREFIX)) {
		const stepId = Number(ctx.callbackQuery.data.slice(SUBSCRIPTION_CALLBACK_PREFIX.length));
		if (!Number.isInteger(stepId)) {
			await ctx.answerCallbackQuery();
			return;
		}
		const contact = await upsertContactFromTelegramUser(ctx.from);
		const alert = await handleSubscriptionGateCallback(contact, stepId);
		await ctx.answerCallbackQuery(alert ? { text: alert, show_alert: true } : {});

		// Шлагбаум пройден — снимаем кнопки, иначе человек нажмёт их через неделю
		// и получит хвост цепочки повторно. Сообщение могло устареть для
		// редактирования — на выдачу материала это уже не влияет.
		if (!alert) {
			try {
				await ctx.editMessageReplyMarkup();
			} catch (err) {
				console.error('[client-bot] Не смог снять клавиатуру шлагбаума:', err);
			}
		}
		return;
	}

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
