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
		const date = form.get('date') as string;
		const startHour = parseInt(form.get('startHour') as string, 10);
		const endHour = parseInt(form.get('endHour') as string, 10);

		if (!date || isNaN(startHour) || isNaN(endHour)) {
			return fail(400, { error: 'Заполните все поля' });
		}

		if (startHour >= endHour) {
			return fail(400, { error: 'Начало должно быть раньше конца' });
		}

		const startAt = dayjs.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK).toISOString();
		const endAt = dayjs.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK).toISOString();

		const overlap = await db
			.select({ id: schema.availability.id })
			.from(schema.availability)
			.where(and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt)))
			.limit(1);

		if (overlap.length > 0) {
			return fail(400, { error: 'Слот пересекается с уже существующим временем' });
		}

		await db.insert(schema.availability).values({ startAt, endAt });
		return { success: true };
	},

	delete: async ({ request, locals }) => {

		const form = await request.formData();
		const id = parseInt(form.get('id') as string, 10);

		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		try {
			await db.delete(schema.availability).where(eq(schema.availability.id, id));
		} catch {
			return fail(400, { error: 'Невозможно удалить: на эту дату есть бронирования' });
		}
		return { success: true };
	}
} satisfies Actions;
