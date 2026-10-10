import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../..';
import * as schema from '../../../../db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';
import {
	chatIdForApi,
	listChannelPosts,
	parsePostLink,
	postButtonMarkup
} from '$lib/server/bot-channel-posts.server';
import { clientBotApi, getBotUsername } from '$lib/server/telegram-client-bot.server';
import { GrammyError } from 'grammy';

/**
 * Как цепочка проверяет подписку. Кнопка поста — прямая ссылка в бота, так что
 * без шлагбаума (цепочки нет в ответе) материал получит и тот, кто на канал не
 * подписан. 'unsubscribed' — шлагбаум с условием «не подписан»: подписчики
 * проходят сразу; 'all' — без условия: «Я подписался» нажимают и подписчики.
 */
type GateMode = 'all' | 'unsubscribed';

async function gateModes(): Promise<Record<number, GateMode>> {
	const gates = await db
		.select({
			scenarioId: schema.botScenarioSteps.scenarioId,
			condition: schema.botScenarioSteps.condition
		})
		.from(schema.botScenarioSteps)
		.where(eq(schema.botScenarioSteps.buttonAction, 'check_subscription'));

	const modes: Record<number, GateMode> = {};
	for (const gate of gates) {
		if (gate.condition === 'not_subscribed') modes[gate.scenarioId] = 'unsubscribed';
		else modes[gate.scenarioId] ??= 'all';
	}
	return modes;
}

export const load: PageServerLoad = async () => {
	const [posts, gates] = await Promise.all([listChannelPosts(), gateModes()]);

	// Кнопка запускает цепочку диплинком — подходят только start_param-сценарии
	const scenarios = await db
		.select({
			id: schema.botScenarios.id,
			name: schema.botScenarios.name,
			triggerValue: schema.botScenarios.triggerValue,
			enabled: schema.botScenarios.enabled
		})
		.from(schema.botScenarios)
		.where(eq(schema.botScenarios.triggerType, 'start_param'))
		.orderBy(asc(schema.botScenarios.name));

	return { posts, scenarios, gates };
};

function telegramErrorText(err: unknown): string {
	return err instanceof GrammyError ? err.description : String(err);
}

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const title = (form.get('title') as string)?.trim() || null;
		const postLink = (form.get('postLink') as string)?.trim() ?? '';
		const buttonText = (form.get('buttonText') as string)?.trim();
		const scenarioId = parseInt(form.get('scenarioId') as string, 10);

		if (!buttonText) return fail(400, { createError: 'Укажите текст кнопки' });
		if (isNaN(scenarioId)) return fail(400, { createError: 'Выберите сценарий' });

		const parsed = parsePostLink(postLink);
		if (!parsed) {
			return fail(400, {
				createError:
					'Не удалось разобрать ссылку на пост. Форматы: https://t.me/канал/123 или https://t.me/c/1234567890/123'
			});
		}

		const [scenario] = await db
			.select()
			.from(schema.botScenarios)
			.where(
				and(
					eq(schema.botScenarios.id, scenarioId),
					eq(schema.botScenarios.triggerType, 'start_param')
				)
			);
		if (!scenario) {
			return fail(400, { createError: 'Сценарий не найден или его триггер — не диплинк' });
		}

		const [created] = await db
			.insert(schema.botChannelPosts)
			.values({
				title,
				chatId: parsed.chatId,
				messageId: parsed.messageId,
				buttonText,
				scenarioId
			})
			.returning();

		try {
			await clientBotApi.editMessageReplyMarkup(chatIdForApi(created.chatId), created.messageId, {
				reply_markup: postButtonMarkup(buttonText, await getBotUsername(), created.id)
			});
		} catch (err) {
			// Кнопку на пост повесить не удалось (бот не админ канала, пост не найден…) —
			// откатываем запись, чтобы в списке не висела нерабочая кнопка
			await db.delete(schema.botChannelPosts).where(eq(schema.botChannelPosts.id, created.id));
			return fail(400, {
				createError: `Telegram: ${telegramErrorText(err)}. Проверьте, что бот добавлен админом канала, а ссылка ведёт на существующий пост.`
			});
		}

		return { createSuccess: true };
	},

	// Разовый перевод кнопок, опубликованных до прямых ссылок (callback cp:<id>).
	// Повторное нажатие безопасно: уже переведённые Telegram отвечает «not modified».
	relink: async (event) => {
		requireAuth(event);

		const posts = await db
			.select()
			.from(schema.botChannelPosts)
			.orderBy(asc(schema.botChannelPosts.id));
		const username = await getBotUsername();

		let updated = 0;
		const failed: string[] = [];
		for (const post of posts) {
			try {
				await clientBotApi.editMessageReplyMarkup(chatIdForApi(post.chatId), post.messageId, {
					reply_markup: postButtonMarkup(post.buttonText, username, post.id)
				});
				updated++;
			} catch (err) {
				if (err instanceof GrammyError && err.description.includes('message is not modified')) {
					updated++;
					continue;
				}
				// Лимит Telegram на правки — дальше будет то же самое. Уже сделанное
				// сохранится, повторное нажатие продолжит с остальных.
				if (err instanceof GrammyError && err.error_code === 429) {
					const wait = err.parameters.retry_after ?? 60;
					failed.push(`Telegram попросил подождать ${wait} с — нажмите ещё раз позже`);
					break;
				}
				failed.push(`${post.title ?? `пост ${post.messageId}`}: ${telegramErrorText(err)}`);
			}
		}

		return { relinkResult: { updated, total: posts.length, failed } };
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		const [post] = await db
			.select()
			.from(schema.botChannelPosts)
			.where(eq(schema.botChannelPosts.id, id));
		if (!post) return fail(400, { error: 'Кнопка не найдена' });

		try {
			await clientBotApi.editMessageReplyMarkup(chatIdForApi(post.chatId), post.messageId, {
				reply_markup: { inline_keyboard: [] }
			});
		} catch (err) {
			// Пост могли удалить или у бота отобрали права — запись всё равно убираем
			console.error('[bot-posts] Не удалось снять кнопку с поста:', err);
		}

		await db.delete(schema.botChannelPosts).where(eq(schema.botChannelPosts.id, id));

		return { deleteSuccess: true };
	}
} satisfies Actions;
