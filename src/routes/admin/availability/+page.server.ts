import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { db } from '../../..';
import * as schema from '../../../db/schema';
import { eq, asc, and, lt, gt, gte, sql } from 'drizzle-orm';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { parseAvailabilityBulkText } from '$lib/server/availability-bulk';

dayjs.extend(utc);
dayjs.extend(timezone);

const MSK = 'Europe/Moscow';

// Правки расписания идут по одной: проверка пересечений и вставка не атомарны,
// и два одновременных запроса (двойной клик) создавали дубли окон.
const AVAILABILITY_LOCK_ID = 7301;

export const load: PageServerLoad = async (event) => {
	requireAuth(event);

	const availabilities = await db
		.select()
		.from(schema.availability)
		.orderBy(asc(schema.availability.startAt));

	return { availabilities };
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
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

		await db.transaction(async (tx) => {
			await tx.execute(sql`SELECT pg_advisory_xact_lock(${AVAILABILITY_LOCK_ID})`);

			for (const date of dates) {
				const startAt = dayjs
					.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK)
					.toISOString();
				const endAt = dayjs
					.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK)
					.toISOString();

				const overlap = await tx
					.select({ id: schema.availability.id })
					.from(schema.availability)
					.where(
						and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt))
					)
					.limit(1);

				if (overlap.length > 0) {
					skipped.push(date);
					continue;
				}

				await tx.insert(schema.availability).values({ startAt, endAt });
			}
		});

		if (skipped.length > 0 && skipped.length === dates.length) {
			return fail(400, { error: `Все слоты пересекаются с существующими` });
		}

		return { success: true, skipped };
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = parseInt(form.get('id') as string, 10);

		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		await db.delete(schema.availability).where(eq(schema.availability.id, id));
		return { success: true };
	},

	bulk: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const textValue = form.get('text');
		const text = typeof textValue === 'string' ? textValue : '';
		const currentMskYear = dayjs().tz(MSK).year();
		const { commands, errors } = parseAvailabilityBulkText(text, currentMskYear);

		if (errors.length > 0) {
			return fail(400, { bulkError: errors.join('\n') });
		}

		if (!commands.length) {
			return fail(400, { bulkError: 'Не удалось распознать ни одной строки' });
		}

		try {
			const result = await db.transaction(async (tx) => {
				await tx.execute(sql`SELECT pg_advisory_xact_lock(${AVAILABILITY_LOCK_ID})`);
				let added = 0;
				let removed = 0;
				let replaced = 0;

				for (const { mode, date, startHour, endHour } of commands) {
					const startAt = dayjs
						.tz(`${date} ${String(startHour).padStart(2, '0')}:00:00`, MSK)
						.toISOString();
					const endAt = dayjs
						.tz(`${date} ${String(endHour).padStart(2, '0')}:00:00`, MSK)
						.toISOString();

					if (mode === 'add') {
						const deleted = await tx
							.delete(schema.availability)
							.where(
								and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt))
							)
							.returning({ id: schema.availability.id });
						replaced += deleted.length;

						await tx.insert(schema.availability).values({ startAt, endAt });
						added++;
						continue;
					}

					const overlaps = await tx
						.select({
							id: schema.availability.id,
							startAt: schema.availability.startAt,
							endAt: schema.availability.endAt
						})
						.from(schema.availability)
						.where(
							and(lt(schema.availability.startAt, endAt), gt(schema.availability.endAt, startAt))
						);

					for (const overlap of overlaps) {
						const overlapStart = new Date(overlap.startAt).getTime();
						const overlapEnd = new Date(overlap.endAt).getTime();
						const removeStart = new Date(startAt).getTime();
						const removeEnd = new Date(endAt).getTime();

						if (removeStart <= overlapStart && removeEnd >= overlapEnd) {
							await tx.delete(schema.availability).where(eq(schema.availability.id, overlap.id));
							removed++;
							continue;
						}

						if (removeStart <= overlapStart) {
							await tx
								.update(schema.availability)
								.set({ startAt: endAt })
								.where(eq(schema.availability.id, overlap.id));
							removed++;
							continue;
						}

						if (removeEnd >= overlapEnd) {
							await tx
								.update(schema.availability)
								.set({ endAt: startAt })
								.where(eq(schema.availability.id, overlap.id));
							removed++;
							continue;
						}

						// Removing the middle leaves two windows. Keep the original id for
						// the left part and move right-side bookings to the new window.
						await tx
							.update(schema.availability)
							.set({ endAt: startAt })
							.where(eq(schema.availability.id, overlap.id));
						const [right] = await tx
							.insert(schema.availability)
							.values({ startAt: endAt, endAt: overlap.endAt })
							.returning({ id: schema.availability.id });

						if (right) {
							await tx
								.update(schema.booking)
								.set({ availabilityId: right.id })
								.where(
									and(
										eq(schema.booking.availabilityId, overlap.id),
										gte(schema.booking.bookedAt, endAt)
									)
								);
						}
						removed++;
					}
				}

				return { added, removed, replaced };
			});

			return { bulkSuccess: true, ...result };
		} catch (error) {
			console.error('Не удалось применить массовое изменение доступности:', error);
			return fail(500, {
				bulkError: 'Не удалось применить изменения. Ни одна строка не была сохранена.'
			});
		}
	}
} satisfies Actions;
