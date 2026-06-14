import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { eq, asc, and, lt, gt } from 'drizzle-orm';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

function parseDateStr(str: string): string | null {
	// DD.MM или DD.MM.YYYY
	const dotMatch = str.replace(/\.$/, '').match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
	if (dotMatch) {
		const day = String(dotMatch[1]).padStart(2, '0');
		const month = String(dotMatch[2]).padStart(2, '0');
		const year = dotMatch[3] ?? String(new Date().getFullYear());
		return `${year}-${month}-${day}`;
	}
	// YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
	return null;
}

function parseBulkText(text: string) {
	const adds: Array<{ date: string; startHour: number; endHour: number }> = [];
	const removes: Array<{ date: string; startHour: number; endHour: number }> = [];
	let mode: 'add' | 'remove' | null = null;

	for (const rawLine of text.split('\n')) {
		const line = rawLine.trim();
		if (!line) continue;

		const upper = line.toUpperCase();
		if (upper === 'ADD') { mode = 'add'; continue; }
		if (upper === 'REMOVE') { mode = 'remove'; continue; }
		if (!mode) continue;

		const parts = line.split(/\s+/);
		if (parts.length < 2) continue;

		const date = parseDateStr(parts[0]);
		if (!date) continue;

		for (let i = 1; i < parts.length; i++) {
			// supports 10-18, 10:00-18:00, 10–18 (en-dash)
			const rangeMatch = parts[i].match(/^(\d{1,2})(?::\d{2})?[-–](\d{1,2})(?::\d{2})?$/);
			if (!rangeMatch) continue;
			const startHour = parseInt(rangeMatch[1]);
			const endHour = parseInt(rangeMatch[2]);
			if (startHour >= endHour) continue;

			(mode === 'add' ? adds : removes).push({ date, startHour, endHour });
		}
	}

	return { adds, removes };
}

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
	},

	bulk: async ({ request }) => {
		const form = await request.formData();
		const text = (form.get('text') as string) ?? '';

		const { adds, removes } = parseBulkText(text);

		if (!adds.length && !removes.length) {
			return fail(400, { bulkError: 'Не удалось распознать ни одной строки' });
		}

		let added = 0;
		let skipped = 0;
		for (const { date, startHour, endHour } of adds) {
			const startAt = dayjs.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK).toISOString();
			const endAt = dayjs.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK).toISOString();

			const overlap = await db
				.select({ id: schema.availability.id })
				.from(schema.availability)
				.where(and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt)))
				.limit(1);

			if (overlap.length > 0) { skipped++; continue; }

			await db.insert(schema.availability).values({ startAt, endAt });
			added++;
		}

		let removed = 0;
		for (const { date, startHour, endHour } of removes) {
			const startAt = dayjs.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK).toISOString();
			const endAt = dayjs.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK).toISOString();

			const result = await db
				.delete(schema.availability)
				.where(and(eq(schema.availability.startAt, startAt), eq(schema.availability.endAt, endAt)));
			removed++;
		}

		return { bulkSuccess: true, added, removed, skipped };
	}
} satisfies Actions;
