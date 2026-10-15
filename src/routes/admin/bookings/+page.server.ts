import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { telegramService } from '$lib/server/telegram.server';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);

	const bookings = await db.select().from(schema.booking).orderBy(desc(schema.booking.bookedAt));

	return { bookings };
};

export const actions: Actions = {
	cancel: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db
			.update(schema.booking)
			.set({ status: 'cancelled', updatedAt: new Date().toISOString() })
			.where(eq(schema.booking.id, id));

		return { success: true };
	},

	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const bookedAt = form.get('bookedAt') as string;
		const telegram = (form.get('telegram') as string)?.trim();
		const email = (form.get('email') as string)?.trim();

		if (!bookedAt || !telegram || !email) return fail(400, { createError: 'Заполните все поля' });

		const parsedDate = new Date(bookedAt);
		if (isNaN(parsedDate.getTime())) return fail(400, { createError: 'Некорректная дата' });

		const now = new Date().toISOString();
		const bookedAtIso = parsedDate.toISOString();
		await db.insert(schema.booking).values({
			availabilityId: 0,
			bookedAt: bookedAtIso,
			clientName: telegram,
			email,
			status: 'confirmed',
			updatedAt: now
		});

		telegramService
			.sendBookingConfirmed({
				clientName: telegram,
				email,
				bookedAt: bookedAtIso,
				source: 'admin'
			})
			.catch((e) => console.error('Telegram booking notification failed:', e));

		return { created: true };
	}
};
