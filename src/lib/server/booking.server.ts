import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, and, or, gt, lt } from 'drizzle-orm';
import { createPayment } from './robokassa.server';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const CONSULTATION_PRICE = '4000.00';
export const PACKAGE_PRICE = '14000.00';
export const MSK_TZ = 'Europe/Moscow';
/** Minimum lead time before a slot can be booked. Shared by createBooking and getAvailabilities. */
export const BUFFER_MS = 24 * 60 * 60 * 1000;

export type SlotStatus = 'available' | 'locked' | 'booked';

export type SlotInfo = { startAt: string; status: SlotStatus };

export type AvailabilityWithSlots = {
	id: number;
	startAt: string;
	endAt: string;
	slots: SlotInfo[];
};

function nowIso() {
	return new Date().toISOString();
}

function activeBookingCondition() {
	const now = nowIso();
	return or(
		eq(schema.booking.status, 'confirmed'),
		and(eq(schema.booking.status, 'pending_payment'), gt(schema.booking.lockedUntil, now))
	);
}

/** Pure function — generates ISO strings for each whole-hour slot within [startAt, endAt).
 *  If startAt is not on the hour, rounds UP so no slot falls before startAt. */
export function generateHourlySlots(startAt: string, endAt: string): string[] {
	const slots: string[] = [];
	const cursor = new Date(startAt);
	// Round UP to the next whole hour so we never produce a slot that starts before startAt
	if (cursor.getUTCMinutes() !== 0 || cursor.getUTCSeconds() !== 0 || cursor.getUTCMilliseconds() !== 0) {
		cursor.setUTCHours(cursor.getUTCHours() + 1);
	}
	cursor.setUTCMinutes(0, 0, 0);
	const endMs = new Date(endAt).getTime();
	while (cursor.getTime() < endMs) {
		slots.push(cursor.toISOString());
		cursor.setUTCHours(cursor.getUTCHours() + 1);
	}
	return slots;
}

export async function getAvailabilities(): Promise<AvailabilityWithSlots[]> {
	const now = nowIso();
	const nowMs = Date.now();

	const avails = await db
		.select()
		.from(schema.availability)
		.where(gt(schema.availability.endAt, now))
		.orderBy(schema.availability.startAt);

	const activeBookings = await db
		.select()
		.from(schema.booking)
		.where(activeBookingCondition());

	return avails.map((a) => {
		const slotTimes = generateHourlySlots(a.startAt, a.endAt);
		const slots: SlotInfo[] = slotTimes
			.filter((slotStart) => new Date(slotStart).getTime() > nowMs + BUFFER_MS) // skip past and near-future slots (< 24h)
			.map((slotStart) => {
				const match = activeBookings.find(
					(b) => new Date(b.bookedAt).getTime() === new Date(slotStart).getTime()
				);
				let status: SlotStatus = 'available';
				if (match) status = match.status === 'confirmed' ? 'booked' : 'locked';
				return { startAt: slotStart, status };
			});
		return { id: a.id, startAt: a.startAt, endAt: a.endAt, slots };
	});
}

export async function createBooking(params: {
	availabilityId: number;
	bookedAt: string;
	email: string;
	clientName: string;
	originUrl: string;
	outSum?: string;
}) {
	const now = nowIso();
	// 20 min in DB vs 15 min in Robokassa — gives webhook time to arrive before scheduler cancels
	const lockedUntil = new Date(Date.now() + 20 * 60 * 1000).toISOString();

	const [avail] = await db
		.select()
		.from(schema.availability)
		.where(eq(schema.availability.id, params.availabilityId))
		.limit(1);

	if (!avail) throw new Error('Слот не найден');

	const bookedMs = new Date(params.bookedAt).getTime();
	const startMs = new Date(avail.startAt).getTime();
	const endMs = new Date(avail.endAt).getTime();

	if (bookedMs < startMs || bookedMs >= endMs) {
		throw new Error('Час вне диапазона доступности');
	}

	const d = new Date(params.bookedAt);
	if (d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0 || d.getUTCMilliseconds() !== 0) {
		throw new Error('Некорректное время слота');
	}

	if (bookedMs <= Date.now() + BUFFER_MS) {
		throw new Error('Забронировать можно минимум за 24 часа до начала');
	}

	// Cancel any expired lock for this slot so the unique index doesn't block us
	await db
		.update(schema.booking)
		.set({ status: 'cancelled', updatedAt: now })
		.where(
			and(
				eq(schema.booking.availabilityId, params.availabilityId),
				eq(schema.booking.bookedAt, params.bookedAt),
				eq(schema.booking.status, 'pending_payment'),
				lt(schema.booking.lockedUntil, now)
			)
		);

	const existing = await db
		.select()
		.from(schema.booking)
		.where(
			and(
				eq(schema.booking.availabilityId, params.availabilityId),
				eq(schema.booking.bookedAt, params.bookedAt),
				activeBookingCondition()
			)
		)
		.limit(1);

	if (existing.length > 0) throw new Error('Слот уже занят');

	const msk = dayjs(params.bookedAt).tz(MSK_TZ);
	const dateLabel = msk.format('DD.MM.YYYY');
	const hourLabel = msk.format('HH:mm');

	// Create payment FIRST — if Robokassa is down, no booking row is created (no cleanup needed)
	const payment = await createPayment({
		outSum: params.outSum ?? CONSULTATION_PRICE,
		description: params.outSum === PACKAGE_PRICE ? 'Пакет консультаций' : 'Консультация',
		email: params.email,
		expiresInMinutes: 15,
		successUrl: `${params.originUrl}/booking/success`,
		failUrl: `${params.originUrl}/booking/fail`
	});

	const paymentId = parseInt(payment.fields.InvId);

	// Single INSERT — paymentId is set immediately, no separate UPDATE needed
	try {
		await db
			.insert(schema.booking)
			.values({
				availabilityId: params.availabilityId,
				bookedAt: params.bookedAt,
				email: params.email,
				clientName: params.clientName,
				status: 'pending_payment',
				lockedUntil,
				paymentId,
				updatedAt: now
			})
			.returning({ id: schema.booking.id });
	} catch {
		// Unique index violation — concurrent booking snuck in between our check and INSERT.
		// Eagerly mark the orphaned RobokassaPayment as failed instead of waiting for the cron.
		try {
			await db
				.update(schema.robokassaPayment)
				.set({ status: 'failed', updatedAt: nowIso() })
				.where(eq(schema.robokassaPayment.id, paymentId));
		} catch { /* ignore — cron will clean up in ~15 min */ }
		throw new Error('Слот уже занят');
	}

	return payment;
}

export async function confirmByPaymentId(
	paymentId: number
): Promise<'confirmed' | 'already_confirmed' | 'not_found' | 'slot_taken'> {
	return await db.transaction(async (tx) => {
		const [booking] = await tx
			.select()
			.from(schema.booking)
			.where(eq(schema.booking.paymentId, paymentId))
			.limit(1);

		if (!booking) return 'not_found';
		if (booking.status === 'confirmed') return 'already_confirmed';

		if (booking.status === 'cancelled') {
			// Lock expired before Robokassa confirmed — check if someone else took the slot
			const conflict = await tx
				.select({ id: schema.booking.id })
				.from(schema.booking)
				.where(
					and(
						eq(schema.booking.availabilityId, booking.availabilityId),
						eq(schema.booking.bookedAt, booking.bookedAt),
						activeBookingCondition()
					)
				)
				.limit(1);

			if (conflict.length > 0) {
				// Slot taken — flag for manual refund
				await tx
					.update(schema.booking)
					.set({ status: 'requires_refund', updatedAt: nowIso() })
					.where(eq(schema.booking.id, booking.id));
				return 'slot_taken';
			}
			// Slot is still free — confirm the late payment
		}

		let updated: { id: number }[];
		try {
			// Optimistic lock: include current status in WHERE so a concurrent webhook that
			// already confirmed the booking returns 0 rows instead of writing a second time.
			updated = await tx
				.update(schema.booking)
				.set({ status: 'confirmed', updatedAt: nowIso() })
				.where(
					and(
						eq(schema.booking.id, booking.id),
						eq(schema.booking.status, booking.status)
					)
				)
				.returning({ id: schema.booking.id });
		} catch {
			// Unique index fired: another booking was inserted between our SELECT and this UPDATE
			await tx
				.update(schema.booking)
				.set({ status: 'requires_refund', updatedAt: nowIso() })
				.where(eq(schema.booking.id, booking.id));
			return 'slot_taken';
		}

		// 0 rows updated → status changed since we read it; another webhook already processed this
		if (updated.length === 0) return 'already_confirmed';

		return 'confirmed';
	});
}

export async function releaseExpiredLocks(): Promise<number> {
	const now = nowIso();
	const result = await db
		.update(schema.booking)
		.set({ status: 'cancelled', updatedAt: now })
		.where(and(eq(schema.booking.status, 'pending_payment'), lt(schema.booking.lockedUntil, now)))
		.returning({ id: schema.booking.id });
	return result.length;
}

export async function getBookingByPaymentId(paymentId: number) {
	const [b] = await db
		.select()
		.from(schema.booking)
		.where(eq(schema.booking.paymentId, paymentId))
		.limit(1);
	return b ?? null;
}
