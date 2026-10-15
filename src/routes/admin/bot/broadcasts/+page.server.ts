import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '../../../..';
import * as schema from '../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/protected';

export const load: PageServerLoad = async () => {
	const broadcasts = await db
		.select({
			scenario: schema.botScenarios,
			stepsCount: sql<number>`count(${schema.botScenarioSteps.id})::int`
		})
		.from(schema.botScenarios)
		.leftJoin(
			schema.botScenarioSteps,
			eq(schema.botScenarioSteps.scenarioId, schema.botScenarios.id)
		)
		.where(eq(schema.botScenarios.kind, 'broadcast'))
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

	const lastRuns = await db
		.select({
			scenarioId: schema.botBroadcastRuns.scenarioId,
			lastRunAt: sql<string>`max(${schema.botBroadcastRuns.createdAt})`
		})
		.from(schema.botBroadcastRuns)
		.groupBy(schema.botBroadcastRuns.scenarioId);

	const pendingByScenario = new Map(pending.map((p) => [p.scenarioId, p.count]));
	const lastRunByScenario = new Map(lastRuns.map((r) => [r.scenarioId, r.lastRunAt]));

	return {
		broadcasts: broadcasts.map(({ scenario, stepsCount }) => ({
			...scenario,
			stepsCount,
			pendingCount: pendingByScenario.get(scenario.id) ?? 0,
			lastRunAt: lastRunByScenario.get(scenario.id) ?? null
		}))
	};
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const name = (form.get('name') as string)?.trim();
		if (!name) return fail(400, { createError: 'Укажите название рассылки' });

		const [created] = await db
			.insert(schema.botScenarios)
			.values({ name, kind: 'broadcast' })
			.returning();

		throw redirect(303, `/admin/bot/scenarios/${created.id}`);
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		const [linkedPost] = await db
			.select({ id: schema.botChannelPosts.id })
			.from(schema.botChannelPosts)
			.where(eq(schema.botChannelPosts.scenarioId, id))
			.limit(1);
		if (linkedPost) {
			return fail(400, {
				error:
					'К рассылке привязаны кнопки на постах — сначала удалите их во вкладке «Кнопки на постах»'
			});
		}

		await db.delete(schema.botScenarios).where(eq(schema.botScenarios.id, id));

		return { success: true };
	}
} satisfies Actions;
