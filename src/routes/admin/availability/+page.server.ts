import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { eq, asc, and, lt, gt } from 'drizzle-orm';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const MSK = 'Europe/Moscow';

export const load: PageServerLoad = async (event) => {
	const availabilities = await db
		.select()
		.from(schema.availability)
		.orderBy(asc(schema.availability.startAt));

	return { availabilities };
};

export const actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const dates = form.getAll('date') as string[];
		const startHour = parseInt(form.get('startHour') as string, 10);
		const endHour = parseInt(form.get('endHour') as string, 10);

		if (!dates.length || isNaN(startHour) || isNaN(endHour)) {
			return fail(400, { error: 'Заполните все поля' });
		}

		if (startHour >= endHour) {
			return fail(400, { error: 'Начало должно быть раньше конца' });
		}

		const skipped: string[] = [];

		for (const date of dates) {
			const startAt = dayjs.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK).toISOString();
			const endAt = dayjs.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK).toISOString();

			const overlap = await db
				.select({ id: schema.availability.id })
				.from(schema.availability)
				.where(and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt)))
				.limit(1);

			if (overlap.length > 0) {
				skipped.push(date);
				continue;
			}

			await db.insert(schema.availability).values({ startAt, endAt });
		}

		if (skipped.length > 0 && skipped.length === dates.length) {
			return fail(400, { error: `Все слоты пересекаются с существующими` });
		}

		return { success: true, skipped };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = parseInt(form.get('id') as string, 10);

		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db.delete(schema.availability).where(eq(schema.availability.id, id));
		return { success: true };
	}
} satisfies Actions;
