import { requireAuth } from '$lib/server/protected';
import type { LayoutServerLoad } from './$types';
import { db } from '../..';
import * as schema from '../../db/schema';
import { desc, sql, eq } from 'drizzle-orm';

export const load = async (event) => {
	requireAuth(event);

	// Get clients with their latest session date, sorted by date (clients with activities first, then without)
	const clients = await db
		.select({
			id: schema.client.id,
			name: schema.client.name,
			nick: schema.client.nick,
			lastSessionDate: sql<string>`MAX(${schema.activity.scheduledDate})`
		})
		.from(schema.client)
		.leftJoin(schema.activity, eq(schema.client.id, schema.activity.clientId))
		.where(eq(schema.client.disabled, false))
		.groupBy(schema.client.id, schema.client.name, schema.client.nick)
		.orderBy(desc(sql`MAX(${schema.activity.scheduledDate})`));

	return {
		user: event.locals.user,
		clients
	};
};
