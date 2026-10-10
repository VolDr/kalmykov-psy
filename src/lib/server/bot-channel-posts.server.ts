import { db } from '../..';
import * as schema from '../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

/** Значение chat_id для Telegram API: '@channelname' как есть, числовой id — числом. */
export function chatIdForApi(chatId: string): string | number {
	return chatId.startsWith('@') ? chatId : Number(chatId);
}

/**
 * Разбирает ссылку на пост канала в chatId + messageId.
 * Поддерживаются: https://t.me/channelname/123, https://t.me/c/2223334445/123,
 * @channelname/123.
 */
export function parsePostLink(link: string): { chatId: string; messageId: number } | null {
	const trimmed = link.trim();

	// Приватный канал: t.me/c/<internal_id>/<message_id> → chat_id = -100<internal_id>
	const privateMatch = /^(?:https?:\/\/)?t\.me\/c\/(\d+)\/(\d+)/.exec(trimmed);
	if (privateMatch) {
		return { chatId: `-100${privateMatch[1]}`, messageId: Number(privateMatch[2]) };
	}

	// Публичный канал: t.me/<username>/<message_id> или @<username>/<message_id>
	const publicMatch = /^(?:(?:https?:\/\/)?t\.me\/|@)([A-Za-z0-9_]{4,})\/(\d+)/.exec(trimmed);
	if (publicMatch) {
		return { chatId: `@${publicMatch[1]}`, messageId: Number(publicMatch[2]) };
	}

	return null;
}

/**
 * Кнопка поста — прямая ссылка t.me/<бот>?start=cp_<id поста>: Telegram открывает
 * бота сразу, без круга через наш сервер. Подписку проверяет шлагбаум в цепочке,
 * клик считается при /start (см. telegram-client-bot.server.ts).
 * Префикс зарезервирован — validateTrigger не даёт завести такой ключ цепочке.
 */
export const POST_START_PREFIX = 'cp_';

const POST_START_KEY = /^cp_(\d{1,15})$/;

export function postStartKey(postId: number): string {
	return `${POST_START_PREFIX}${postId}`;
}

/** id поста из ключа диплинка cp_<id>, иначе null. */
export function parsePostStartKey(key: string): number | null {
	const match = POST_START_KEY.exec(key);
	return match ? Number(match[1]) : null;
}

export function postButtonMarkup(buttonText: string, botUsername: string, postId: number) {
	return {
		inline_keyboard: [
			[{ text: buttonText, url: `https://t.me/${botUsername}?start=${postStartKey(postId)}` }]
		]
	};
}

export async function getChannelPost(id: number) {
	const [post] = await db
		.select({
			post: schema.botChannelPosts,
			scenario: schema.botScenarios
		})
		.from(schema.botChannelPosts)
		.innerJoin(schema.botScenarios, eq(schema.botChannelPosts.scenarioId, schema.botScenarios.id))
		.where(eq(schema.botChannelPosts.id, id));
	return post ?? null;
}

export async function listChannelPosts() {
	return db
		.select({
			post: schema.botChannelPosts,
			scenarioName: schema.botScenarios.name
		})
		.from(schema.botChannelPosts)
		.innerJoin(schema.botScenarios, eq(schema.botChannelPosts.scenarioId, schema.botScenarios.id))
		.orderBy(desc(schema.botChannelPosts.createdAt));
}

export async function incrementChannelPostClicks(id: number) {
	await db
		.update(schema.botChannelPosts)
		.set({ clicks: sql`${schema.botChannelPosts.clicks} + 1`, updatedAt: sql`now()` })
		.where(eq(schema.botChannelPosts.id, id));
}
