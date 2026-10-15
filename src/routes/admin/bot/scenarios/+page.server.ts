import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../..';
import * as schema from '../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';
import { validateTrigger } from '$lib/server/bot-scenarios.server';

export const load: PageServerLoad = async () => {
	const scenarios = await db
		.select({
			scenario: schema.botScenarios,
			stepsCount: sql<number>`count(${schema.botScenarioSteps.id})::int`
		})
		.from(schema.botScenarios)
		.leftJoin(
			schema.botScenarioSteps,
			eq(schema.botScenarioSteps.scenarioId, schema.botScenarios.id)
		)
		.where(eq(schema.botScenarios.kind, 'funnel'))
		.groupBy(schema.botScenarios.id)
		.orderBy(desc(schema.botScenarios.createdAt));

	const pending = await db
		.select({
			scenarioId: schema.botScheduledSteps.scenarioId,
			count: sql<number>`count(*)::int`
		})
		.from(schema.botScheduledSteps)
		.where(eq(schema.botScheduledSteps.status, 'pending'))
		.groupBy(schema.botScheduledSteps.scenarioId);

	const pendingByScenario = new Map(pending.map((p) => [p.scenarioId, p.count]));

	return {
		scenarios: scenarios.map(({ scenario, stepsCount }) => ({
			...scenario,
			stepsCount,
			pendingCount: pendingByScenario.get(scenario.id) ?? 0
		}))
	};
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const name = (form.get('name') as string)?.trim();
		const triggerType = (form.get('triggerType') as string) ?? '';
		const triggerValue = (form.get('triggerValue') as string)?.trim() ?? '';

		if (!name) return fail(400, { createError: 'Укажите название сценария' });
		if (!schema.botScenarioTriggerEnum.enumValues.includes(triggerType as never)) {
			return fail(400, { createError: 'Неизвестный тип триггера' });
		}
		const triggerError = validateTrigger(triggerType, triggerValue);
		if (triggerError) return fail(400, { createError: triggerError });

		const [created] = await db
			.insert(schema.botScenarios)
			.values({
				name,
				triggerType: triggerType as (typeof schema.botScenarioTriggerEnum.enumValues)[number],
				triggerValue
			})
			.returning();

		throw redirect(303, `/admin/bot/scenarios/${created.id}`);
	},

	toggle: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db
			.update(schema.botScenarios)
			.set({ enabled: sql`not ${schema.botScenarios.enabled}`, updatedAt: sql`now()` })
			.where(eq(schema.botScenarios.id, id));

		return { success: true };
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		// Кнопки на постах ссылаются на сценарий с onDelete:restrict — сначала снять кнопку
		const [linkedPost] = await db
			.select({ id: schema.botChannelPosts.id })
			.from(schema.botChannelPosts)
			.where(eq(schema.botChannelPosts.scenarioId, id))
			.limit(1);
		if (linkedPost) {
			return fail(400, {
				error:
					'К сценарию привязаны кнопки на постах — сначала удалите их во вкладке «Кнопки на постах»'
			});
		}

		await db.delete(schema.botScenarios).where(eq(schema.botScenarios.id, id));

		return { success: true };
	}
} satisfies Actions;
