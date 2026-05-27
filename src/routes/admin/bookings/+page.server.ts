import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);

	const bookings = await db
		.select()
		.from(schema.booking)
		.orderBy(desc(schema.booking.bookedAt));

	return { bookings };
};
