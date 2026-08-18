import type { Api } from 'grammy';
import { Bot, GrammyError } from 'grammy';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { TELEGRAM_CLIENT_BOT_TOKEN } from '$env/static/private';
import { logInboundMessage, upsertContactFromTelegramUser } from './bot-contacts.server';
import {
	findTriggeredScenarios,
	handleSubscriptionGateCallback,
	parseStartPayload,
	runScheduledStep,
	SUBSCRIPTION_CALLBACK_PREFIX,
	triggerScenarioForContact
} from './bot-scenarios.server';
import { logSafeError } from './log-error.server';
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
	client: {
		baseFetchConfig: { agent, compress: true },
		// По умолчанию grammy ждёт ответа Bot API до 500 секунд. Через SOCKS5 это
		// значит, что одна зависшая отправка держит и обработчик апдейта, и
		// задание очереди — дольше, чем 10-минутная аренда шага, после чего cron
		// заберёт ту же строку и отправит дубль. 30 секунд с запасом покрывают
		// нормальную отправку, а зависание превращают в обычную ошибку с ретраем.
		timeoutSeconds: 30
	}
});

export const clientBotApi: Api = clientBot.api;

/**
 * Дедлайн на один вызов Bot API (последний аргумент любого метода grammy).
 *
 * Типы grammy ссылаются на полифил abort-controller, структурно несовместимый с
 * нативным AbortSignal, хотя в рантайме сигнал уходит в обычный fetch — поэтому
 * приведение здесь безопасно и собрано в одном месте.
 */
/**
 * Дедлайн проверки подписки на пути callback'а. У Telegram считаные секунды на
 * ответ по нажатию кнопки, а общий таймаут Bot API для этого слишком велик.
 */
export const CALLBACK_SUBSCRIPTION_TIMEOUT_MS = 3_000;

export function apiDeadline(ms: number | undefined): Parameters<Api['getChatMember']>[2] {
	if (!ms) return undefined;
	return AbortSignal.timeout(ms) as unknown as Parameters<Api['getChatMember']>[2];
}

// Без bot.catch ошибка обработчика роняет вебхук в 500, и Telegram перепосылает
// апдейт — дубли входящих в инбоксе и повторные запуски цепочек. Логируем и отвечаем 200.
clientBot.catch((err) => {
	logSafeError('[client-bot] Ошибка обработчика апдейта:', err.error);
});

/**
 * Порог «апдейт обрабатывается подозрительно долго». Ниже предохранителя в
 * webhookCallback (9 с), чтобы в логах были видны не только сработавшие
 * таймауты, но и приближения к нему — по ним и ловится причина.
 */
const SLOW_UPDATE_MS = 5_000;

// Сам предохранитель по таймауту знает только факт, но не контекст: тело запроса
// к тому моменту уже прочитано. Замеряем здесь, где есть и update_id, и автор.
clientBot.use(async (ctx, next) => {
	const startedAt = Date.now();
	try {
		await next();
	} finally {
		const ms = Date.now() - startedAt;
		if (ms >= SLOW_UPDATE_MS) {
			console.warn('[client-bot] Медленная обработка update', {
				updateId: ctx.update.update_id,
				from: ctx.from?.id,
				// Только вид кнопки. В callback data лежит токен (qz:<token>), по
				// которому отдаются результаты опросника, — в логах ему не место.
				callback: ctx.callbackQuery?.data?.split(':')[0],
				ms
			});
		}
	}
});

let cachedBotUsername: string | null = null;

/** Username для серверных диплинков вне контекста Telegram update. */
export async function getBotUsername(): Promise<string> {
	if (!cachedBotUsername) {
		const username = (await clientBotApi.getMe()).username;
		if (!username) throw new Error('У бота нет username — диплинки невозможны');
		cachedBotUsername = username;
	}
	return cachedBotUsername;
}

/** Просроченный callback уже нельзя оживить, но его надо завершить без нового 500. */
async function answerCallbackSafely(answer: () => Promise<unknown>): Promise<boolean> {
	try {
		await answer();
		return true;
	} catch (error) {
		if (
			error instanceof GrammyError &&
			error.error_code === 400 &&
			error.description.includes('query is too old')
		) {
			console.warn('[client-bot] Просроченный callback пропущен');
			return false;
		}
		throw error;
	}
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
		const { alert, deliver } = await handleQuizCheckCallback(contact, token);
		await answerCallbackSafely(() =>
			ctx.answerCallbackQuery(alert ? { text: alert, show_alert: true } : {})
		);

		// Разбор — несколько сообщений подряд; держать на них ответ Telegram нельзя.
		// Сначала снимаем клавиатуру, чтобы повторное нажатие не выдало разбор
		// второй раз, и только потом отправляем.
		if (deliver) {
			void (async () => {
				try {
					await ctx.editMessageReplyMarkup();
				} catch (error) {
					logSafeError('[client-bot] Не смог снять клавиатуру опросника:', error);
				}
				await deliver();
			})().catch((error) => logSafeError('[client-bot] Не смог выдать разбор опросника:', error));
		}
		return;
	}

	// Кнопка «Я подписался» под шагом-шлагбаумом цепочки (sub:<stepId>)
	if (ctx.callbackQuery.data.startsWith(SUBSCRIPTION_CALLBACK_PREFIX)) {
		const stepId = Number(ctx.callbackQuery.data.slice(SUBSCRIPTION_CALLBACK_PREFIX.length));
		if (!Number.isInteger(stepId)) {
			await answerCallbackSafely(() => ctx.answerCallbackQuery());
			return;
		}
		const sourceMessageId = ctx.callbackQuery.message?.message_id;
		if (!sourceMessageId) {
			await answerCallbackSafely(() =>
				ctx.answerCallbackQuery({ text: 'Кнопка больше не активна.', show_alert: true })
			);
			return;
		}
		const contact = await upsertContactFromTelegramUser(ctx.from);
		const { alert, continuationId, accepted } = await handleSubscriptionGateCallback(
			contact,
			stepId,
			sourceMessageId
		);
		await answerCallbackSafely(() =>
			ctx.answerCallbackQuery(alert ? { text: alert, show_alert: true } : {})
		);

		// Кнопка уже подтверждена, поэтому снятие клавиатуры и выдача материала
		// не удерживают webhook. Выполняем адресно своё задание, а не всю очередь:
		// иначе материал встал бы в хвост назревшей рассылки. Если процесс упадёт,
		// задание останется в очереди и его подберёт cron.
		if (accepted) {
			void (async () => {
				// Материал вперёд, клавиатура потом: от повторного нажатия защищает
				// уникальный индекс в очереди, а не снятая кнопка, поэтому лишний
				// round-trip к Telegram не должен стоять между человеком и выдачей.
				if (continuationId !== null) await runScheduledStep(continuationId);
				try {
					await ctx.editMessageReplyMarkup();
				} catch (error) {
					logSafeError('[client-bot] Не смог снять клавиатуру шлагбаума:', error);
				}
			})().catch((error) =>
				logSafeError('[client-bot] Не смог запустить продолжение цепочки:', error)
			);
		}
		return;
	}

	const match = /^cp:(\d+)$/.exec(ctx.callbackQuery.data);
	if (!match) {
		await answerCallbackSafely(() => ctx.answerCallbackQuery());
		return;
	}

	const row = await getChannelPost(Number(match[1]));
	if (!row || !row.scenario.enabled || !row.scenario.triggerValue) {
		await answerCallbackSafely(() =>
			ctx.answerCallbackQuery({ text: 'Кнопка больше не активна.', show_alert: true })
		);
		return;
	}

	if (row.post.requireSubscription) {
		let isMember = true;
		try {
			// Тот же короткий дедлайн, что и у остальных кнопок: этот вызов стоит
			// перед answerCallbackQuery, и на общем 30-секундном таймауте кнопка
			// выглядела бы зависшей, а поздний ответ ловил бы «query is too old»
			const member = await ctx.api.getChatMember(
				chatIdForApi(row.post.chatId),
				ctx.from.id,
				apiDeadline(CALLBACK_SUBSCRIPTION_TIMEOUT_MS)
			);
			isMember = ['creator', 'administrator', 'member'].includes(member.status);
		} catch (err) {
			// Не смогли проверить (например, бот не админ канала) — не блокируем юзера
			logSafeError('[client-bot] getChatMember не удался:', err);
		}
		if (!isMember) {
			await answerCallbackSafely(() =>
				ctx.answerCallbackQuery({
					text: row.post.subscriptionPrompt ?? 'Подпишитесь на канал, чтобы получить материал 🙌',
					show_alert: true
				})
			);
			return;
		}
	}

	const username = ctx.me.username;
	if (!username) {
		await answerCallbackSafely(() =>
			ctx.answerCallbackQuery({ text: 'У бота не настроен username.', show_alert: true })
		);
		return;
	}

	const answered = await answerCallbackSafely(() =>
		ctx.answerCallbackQuery({
			url: `https://t.me/${username}?start=${row.scenario.triggerValue}`
		})
	);
	if (answered) {
		void incrementChannelPostClicks(row.post.id).catch((error) =>
			logSafeError('[client-bot] Не смог увеличить счётчик кликов:', error)
		);
	}
});
