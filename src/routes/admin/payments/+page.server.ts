import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);

	const payments = await db
		.select()
		.from(schema.robokassaPayment)
		.orderBy(desc(schema.robokassaPayment.createdAt));

	return { payments };
};
