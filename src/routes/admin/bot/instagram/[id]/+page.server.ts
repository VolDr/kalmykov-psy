import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../../..';
import * as schema from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) throw error(404, 'Правило не найдено');

	const [rule] = await db
		.select()
		.from(schema.instagramRules)
		.where(eq(schema.instagramRules.id, id));
	if (!rule) throw error(404, 'Правило не найдено');

	return { rule };
};

function parseKeywords(raw: string): string[] {
	return [
		...new Set(
			raw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		)
	];
}

export const actions = {
	update: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		const [rule] = await db
			.select()
			.from(schema.instagramRules)
			.where(eq(schema.instagramRules.id, id));
		if (!rule) return fail(404, { error: 'Правило не найдено' });

		const form = await event.request.formData();
		const name = (form.get('name') as string)?.trim();
		const keywords = parseKeywords((form.get('keywords') as string) ?? '');
		const matchExact = form.get('matchExact') === 'on';
		const mediaId = (form.get('mediaId') as string)?.trim() || null;
		const commentReplyText = (form.get('commentReplyText') as string)?.trim() || null;
		const dmText = (form.get('dmText') as string)?.trim() || null;
		const enabled = form.get('enabled') === 'on';

		if (!name) return fail(400, { error: 'Укажите название правила' });
		if (enabled) {
			if (keywords.length === 0) {
				return fail(400, { error: 'Для включённого правила нужно хотя бы одно ключевое слово' });
			}
			const hasAction = rule.triggerType === 'comment' ? commentReplyText || dmText : dmText;
			if (!hasAction) {
				return fail(400, { error: 'Для включённого правила заполните хотя бы один текст ответа' });
			}
		}

		await db
			.update(schema.instagramRules)
			.set({
				name,
				keywords,
				matchExact,
				mediaId: rule.triggerType === 'comment' ? mediaId : null,
				commentReplyText: rule.triggerType === 'comment' ? commentReplyText : null,
				dmText,
				enabled,
				updatedAt: new Date().toISOString()
			})
			.where(eq(schema.instagramRules.id, id));

		return { success: true };
	},

	delete: async (event) => {
		requireAuth(event);
		const id = parseInt(event.params.id, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db.delete(schema.instagramRules).where(eq(schema.instagramRules.id, id));

		throw redirect(303, '/admin/bot/instagram');
	}
} satisfies Actions;
