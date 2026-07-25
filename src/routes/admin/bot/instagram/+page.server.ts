import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../..';
import * as schema from '../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';

export const load: PageServerLoad = async () => {
	const rules = await db
		.select()
		.from(schema.instagramRules)
		.orderBy(desc(schema.instagramRules.createdAt));

	return { rules };
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const name = (form.get('name') as string)?.trim();
		const triggerType = (form.get('triggerType') as string) ?? '';

		if (!name) return fail(400, { createError: 'Укажите название правила' });
		if (!schema.instagramRuleTriggerEnum.enumValues.includes(triggerType as never)) {
			return fail(400, { createError: 'Неизвестный тип триггера' });
		}

		const [created] = await db
			.insert(schema.instagramRules)
			.values({
				name,
				triggerType: triggerType as (typeof schema.instagramRuleTriggerEnum.enumValues)[number]
			})
			.returning();

		throw redirect(303, `/admin/bot/instagram/${created.id}`);
	},

	toggle: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db
			.update(schema.instagramRules)
			.set({ enabled: sql`not ${schema.instagramRules.enabled}`, updatedAt: sql`now()` })
			.where(eq(schema.instagramRules.id, id));

		return { success: true };
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db.delete(schema.instagramRules).where(eq(schema.instagramRules.id, id));

		return { success: true };
	}
} satisfies Actions;
