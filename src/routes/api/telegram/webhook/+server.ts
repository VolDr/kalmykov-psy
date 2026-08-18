import { webhookCallback } from 'grammy';
import { TELEGRAM_WEBHOOK_SECRET } from '$env/static/private';
import { clientBot } from '$lib/server/telegram-client-bot.server';
import type { RequestHandler } from './$types';

// Telegram стучится сюда напрямую по HTTPS — прокси для входящих не нужен
// (SOCKS5-прокси в telegram-client-bot.server.ts используется только для исходящих
// вызовов Bot API).
//
// grammy типизирует handlerReturn для адаптера 'sveltekit' как Promise<unknown>,
// хотя фактически (см. node_modules/grammy/out/convenience/frameworks.js) он всегда
// резолвится в Response — приводим тип явно.
export const POST: RequestHandler = webhookCallback(clientBot, 'sveltekit', {
	secretToken: TELEGRAM_WEBHOOK_SECRET,
	// Единичная медленная операция не должна возвращать Telegram 500 и запускать
	// лавину повторов. Основные callback'и отвечают раньше этого предохранителя.
	// Контекст (update_id, автор, длительность) пишет middleware в
	// telegram-client-bot.server.ts — здесь тела запроса уже нет.
	onTimeout: () => console.error('[telegram-webhook] Обработка update превысила 9 секунд'),
	timeoutMilliseconds: 9_000
}) as RequestHandler;
