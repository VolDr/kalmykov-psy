import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../..';
import * as schema from '../../../../db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';
import {
	chatIdForApi,
	listChannelPosts,
	parsePostLink
} from '$lib/server/bot-channel-posts.server';
import { clientBotApi } from '$lib/server/telegram-client-bot.server';
import { GrammyError } from 'grammy';

export const load: PageServerLoad = async () => {
	const posts = await listChannelPosts();

	// Кнопка ведёт на диплинк t.me/<bot>?start=<payload> — подходят только start_param-сценарии
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

	return { posts, scenarios };
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const title = (form.get('title') as string)?.trim() || null;
		const postLink = (form.get('postLink') as string)?.trim() ?? '';
		const buttonText = (form.get('buttonText') as string)?.trim();
		const scenarioId = parseInt(form.get('scenarioId') as string, 10);
		const requireSubscription = form.get('requireSubscription') === 'on';
		const subscriptionPrompt = (form.get('subscriptionPrompt') as string)?.trim() || null;

		if (!buttonText) return fail(400, { createError: 'Укажите текст кнопки' });
		if (isNaN(scenarioId)) return fail(400, { createError: 'Выберите сценарий' });
		// Лимит Telegram на текст алерта answerCallbackQuery — 200 символов
		if (subscriptionPrompt && subscriptionPrompt.length > 200) {
			return fail(400, {
				createError: `Текст алерта слишком длинный: ${subscriptionPrompt.length} из 200 символов`
			});
		}

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
				scenarioId,
				requireSubscription,
				subscriptionPrompt
			})
			.returning();

		try {
			await clientBotApi.editMessageReplyMarkup(chatIdForApi(created.chatId), created.messageId, {
				reply_markup: {
					inline_keyboard: [[{ text: buttonText, callback_data: `cp:${created.id}` }]]
				}
			});
		} catch (err) {
			// Кнопку на пост повесить не удалось (бот не админ канала, пост не найден…) —
			// откатываем запись, чтобы в списке не висела нерабочая кнопка
			await db.delete(schema.botChannelPosts).where(eq(schema.botChannelPosts.id, created.id));
			const description = err instanceof GrammyError ? err.description : String(err);
			return fail(400, {
				createError: `Telegram: ${description}. Проверьте, что бот добавлен админом канала, а ссылка ведёт на существующий пост.`
			});
		}

		return { createSuccess: true };
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
