import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { generateHourlySlots } from './booking.server';

// ---------- generateHourlySlots ----------

describe('generateHourlySlots', () => {
	it('produces correct number of slots', () => {
		const slots = generateHourlySlots('2024-06-01T07:00:00.000Z', '2024-06-01T15:00:00.000Z');
		expect(slots).toHaveLength(8);
	});

	it('starts at startAt boundary', () => {
		const slots = generateHourlySlots('2024-06-01T07:00:00.000Z', '2024-06-01T10:00:00.000Z');
		expect(slots[0]).toBe('2024-06-01T07:00:00.000Z');
	});

	it('last slot is one hour before endAt', () => {
		const slots = generateHourlySlots('2024-06-01T07:00:00.000Z', '2024-06-01T10:00:00.000Z');
		expect(slots[slots.length - 1]).toBe('2024-06-01T09:00:00.000Z');
	});

	it('slots are exactly 1 hour apart', () => {
		const slots = generateHourlySlots('2024-06-01T07:00:00.000Z', '2024-06-01T10:00:00.000Z');
		for (let i = 1; i < slots.length; i++) {
			const diff = new Date(slots[i]).getTime() - new Date(slots[i - 1]).getTime();
			expect(diff).toBe(60 * 60 * 1000);
		}
	});

	it('returns empty array when startAt === endAt', () => {
		expect(
			generateHourlySlots('2024-06-01T10:00:00.000Z', '2024-06-01T10:00:00.000Z')
		).toHaveLength(0);
	});

	it('returns empty array when startAt > endAt', () => {
		expect(
			generateHourlySlots('2024-06-01T11:00:00.000Z', '2024-06-01T10:00:00.000Z')
		).toHaveLength(0);
	});

	it('rounds UP to next whole hour when startAt has sub-hour time (never generates slot before startAt)', () => {
		const slots = generateHourlySlots('2024-06-01T07:30:00.000Z', '2024-06-01T10:00:00.000Z');
		expect(slots[0]).toBe('2024-06-01T08:00:00.000Z'); // 08:00, not 07:00
		expect(slots).toHaveLength(2); // 08:00 and 09:00 (10:00 is exclusive)
	});

	it('works across midnight UTC', () => {
		const slots = generateHourlySlots('2024-06-01T23:00:00.000Z', '2024-06-02T02:00:00.000Z');
		expect(slots).toHaveLength(3);
		expect(slots[0]).toBe('2024-06-01T23:00:00.000Z');
		expect(slots[2]).toBe('2024-06-02T01:00:00.000Z');
	});

	it('narrow window: startAt=10:59, endAt=11:01 → exactly one slot at 11:00', () => {
		// 10:59 rounds UP to 11:00; next would be 12:00 which exceeds endAt 11:01 → 1 slot
		const slots = generateHourlySlots('2024-06-01T10:59:00.000Z', '2024-06-01T11:01:00.000Z');
		expect(slots).toHaveLength(1);
		expect(slots[0]).toBe('2024-06-01T11:00:00.000Z');
	});
});

// ---------- DB mocks ----------

vi.mock('../..', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db: any = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	};
	// Pass the same db object as tx so per-method mocks work inside transactions
	db.transaction = vi.fn(async (fn: (tx: typeof db) => unknown) => fn(db));
	return { db };
});

vi.mock('./robokassa.server', () => ({
	createPayment: vi.fn()
}));

import {
	createBooking,
	getAvailabilities,
	releaseExpiredLocks,
	confirmByPaymentId
} from './booking.server';
import { db } from '../..';
import { createPayment } from './robokassa.server';

// Helper: build a chainable drizzle-like mock that resolves with `rows`.
// The chain implements `then`/`catch` so `await chain` resolves to rows
// regardless of which terminal call the query ends with.
function selectMock(rows: unknown[]) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const chain: any = {};
	chain.from = vi.fn().mockReturnValue(chain);
	chain.where = vi.fn().mockReturnValue(chain);
	chain.limit = vi.fn().mockReturnValue(chain);
	chain.orderBy = vi.fn().mockReturnValue(chain);
	chain.then = (res: (v: unknown[]) => unknown, rej: (e: unknown) => unknown) =>
		Promise.resolve(rows).then(res, rej);
	chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
	return chain;
}

function insertMock(rows: unknown[]) {
	const chain = { values: vi.fn() };
	chain.values.mockReturnValue({ returning: vi.fn().mockResolvedValue(rows) });
	return chain;
}

function updateMock(rows: unknown[] = []) {
	// whereResult is both thenable (for `await .where()`) and has `.returning()`
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const whereResult: any = {
		returning: vi.fn().mockResolvedValue(rows)
	};
	whereResult.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
		Promise.resolve(rows).then(res, rej);
	whereResult.catch = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);

	const chain = { set: vi.fn() };
	chain.set.mockReturnValue({ where: vi.fn().mockReturnValue(whereResult) });
	return chain;
}

function deleteMock() {
	return { where: vi.fn().mockResolvedValue([]) };
}

const AVAIL = { id: 1, startAt: '2024-06-01T07:00:00.000Z', endAt: '2024-06-01T15:00:00.000Z' };
// A future slot (well past year 2024 from perspective of tests — we mock Date.now)
const SLOT_AT = '2024-06-01T10:00:00.000Z';

// ---------- createBooking — validation ----------

describe('createBooking — basic validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
	});
	afterEach(() => vi.useRealTimers());

	it('throws when availability not found', async () => {
		vi.mocked(db.select).mockReturnValue(selectMock([]) as never);

		await expect(
			createBooking({
				availabilityId: 999,
				bookedAt: SLOT_AT,
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Слот не найден');
	});

	it('throws when bookedAt is before availability startAt', async () => {
		vi.mocked(db.select).mockReturnValue(selectMock([AVAIL]) as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: '2024-06-01T06:00:00.000Z',
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Час вне диапазона доступности');
	});

	it('throws when bookedAt is at endAt (exclusive)', async () => {
		vi.mocked(db.select).mockReturnValue(selectMock([AVAIL]) as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: '2024-06-01T15:00:00.000Z',
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Час вне диапазона доступности');
	});

	it('throws when bookedAt has non-zero minutes', async () => {
		vi.mocked(db.select).mockReturnValue(selectMock([AVAIL]) as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: '2024-06-01T10:30:00.000Z',
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Некорректное время слота');
	});

	it('throws when slot is within the 10-hour booking buffer (9.5h away)', async () => {
		// SLOT_AT = 2024-06-01T10:00:00.000Z
		// Freeze to 9.5h before slot: 2024-06-01T00:30:00.000Z
		vi.setSystemTime(new Date('2024-06-01T00:30:00.000Z'));
		vi.mocked(db.select).mockReturnValue(selectMock([AVAIL]) as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: SLOT_AT,
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Забронировать можно минимум за 10 часов до начала');
	});
});

// ---------- createBooking — business flow ----------

describe('createBooking — business flow', () => {
	beforeEach(() => vi.clearAllMocks());

	// Pin Date.now() to the past so SLOT_AT is in the future
	const FROZEN_NOW = new Date('2024-01-01T00:00:00.000Z').getTime();

	function setupHappyPath() {
		vi.setSystemTime(FROZEN_NOW);

		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AVAIL]) as never) // get availability
			.mockReturnValueOnce(selectMock([]) as never); // check existing booking

		vi.mocked(db.update).mockReturnValue(updateMock() as never); // cancel expired
		vi.mocked(db.insert).mockReturnValue(insertMock([{ id: 42 }]) as never);
		vi.mocked(db.delete).mockReturnValue(deleteMock() as never);

		vi.mocked(createPayment).mockResolvedValue({
			url: 'https://robokassa.test',
			fields: { InvId: '99', MerchantLogin: 'test', OutSum: '4000.00', SignatureValue: 'abc' }
		} as never);
	}

	it('throws when slot already taken', async () => {
		vi.setSystemTime(FROZEN_NOW);

		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AVAIL]) as never)
			.mockReturnValueOnce(selectMock([{ id: 5, status: 'confirmed' }]) as never); // existing!

		vi.mocked(db.update).mockReturnValue(updateMock() as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: SLOT_AT,
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Слот уже занят');
	});

	it('calls insert and createPayment on success (single update for expired lock)', async () => {
		setupHappyPath();

		await createBooking({
			availabilityId: 1,
			bookedAt: SLOT_AT,
			email: 'a@b.com',
			clientName: 'A',
			originUrl: 'http://localhost'
		});

		expect(createPayment).toHaveBeenCalledTimes(1);
		expect(db.insert).toHaveBeenCalledTimes(1);
		// Only one update: cancelling expired locks. No second update for paymentId (set at INSERT time).
		expect(db.update).toHaveBeenCalledTimes(1);

		vi.useRealTimers();
	});

	it('rethrows when createPayment fails — no booking row is created', async () => {
		vi.setSystemTime(FROZEN_NOW);

		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AVAIL]) as never)
			.mockReturnValueOnce(selectMock([]) as never);

		vi.mocked(db.update).mockReturnValue(updateMock() as never);
		vi.mocked(createPayment).mockRejectedValue(new Error('Robokassa down'));

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: SLOT_AT,
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Robokassa down');

		// Payment failed before insert — no booking record, no need for cleanup
		expect(db.insert).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});

// ---------- getAvailabilities — slot statuses ----------

describe('getAvailabilities — slot statuses', () => {
	beforeEach(() => vi.clearAllMocks());

	// Availability from 10:00 to 13:00 UTC (3 slots)
	const AV = { id: 1, startAt: '2030-06-01T10:00:00.000Z', endAt: '2030-06-01T13:00:00.000Z' };
	const S1 = '2030-06-01T10:00:00.000Z';
	const S2 = '2030-06-01T11:00:00.000Z';
	const S3 = '2030-06-01T12:00:00.000Z';

	function setupAvailabilities(bookings: unknown[]) {
		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AV]) as never) // getAvailabilities avails query
			.mockReturnValueOnce(selectMock(bookings) as never); // activeBookings query
	}

	it('all slots available when no bookings', async () => {
		setupAvailabilities([]);
		const result = await getAvailabilities();
		expect(result[0].slots.map((s) => s.status)).toEqual(['available', 'available', 'available']);
	});

	it('slot is booked when confirmed booking exists', async () => {
		setupAvailabilities([
			{ availabilityId: 1, bookedAt: S2, status: 'confirmed', lockedUntil: null }
		]);
		const result = await getAvailabilities();
		const statuses = Object.fromEntries(result[0].slots.map((s) => [s.startAt, s.status]));
		expect(statuses[S1]).toBe('available');
		expect(statuses[S2]).toBe('booked');
		expect(statuses[S3]).toBe('available');
	});

	it('slot is locked when pending_payment with future lockedUntil', async () => {
		const futureLockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
		setupAvailabilities([
			{ availabilityId: 1, bookedAt: S1, status: 'pending_payment', lockedUntil: futureLockedUntil }
		]);
		const result = await getAvailabilities();
		expect(result[0].slots.find((s) => s.startAt === S1)?.status).toBe('locked');
	});

	it('excludes past slots and slots within 10-hour booking buffer', async () => {
		// Wide availability: June 1 09:00 → June 3 14:00 UTC
		const WIDE_AV = {
			id: 1,
			startAt: '2030-06-01T09:00:00.000Z',
			endAt: '2030-06-03T14:00:00.000Z'
		};
		// Freeze to 2030-06-01T11:30 UTC
		vi.setSystemTime(new Date('2030-06-01T11:30:00.000Z').getTime());
		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([WIDE_AV]) as never)
			.mockReturnValueOnce(selectMock([]) as never);

		const result = await getAvailabilities();
		const startTimes = result[0].slots.map((s) => s.startAt);

		// Past → excluded
		expect(startTimes).not.toContain('2030-06-01T10:00:00.000Z');
		expect(startTimes).not.toContain('2030-06-01T11:00:00.000Z');
		// Within 10h buffer (< 10h from 11:30 June 1) → excluded
		expect(startTimes).not.toContain('2030-06-01T21:00:00.000Z'); // 9.5h away
		// Outside buffer (> 10h from 11:30 June 1) → included
		expect(startTimes).toContain('2030-06-01T22:00:00.000Z'); // 10.5h away ✓

		vi.useRealTimers();
	});

	it('excludes a slot at exactly the 10-hour boundary (filter is strictly >)', async () => {
		// Freeze to 2030-06-01T10:00:00.000Z
		// Slot at exactly now + 10h = 2030-06-01T20:00:00.000Z → NOT strictly greater → excluded
		// Slot at now + 11h = 2030-06-01T21:00:00.000Z → strictly greater → included
		const BOUNDARY_AV = {
			id: 1,
			startAt: '2030-06-01T10:00:00.000Z',
			endAt: '2030-06-04T10:00:00.000Z'
		};
		vi.setSystemTime(new Date('2030-06-01T10:00:00.000Z').getTime());
		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([BOUNDARY_AV]) as never)
			.mockReturnValueOnce(selectMock([]) as never);

		const result = await getAvailabilities();
		const startTimes = result[0].slots.map((s) => s.startAt);

		expect(startTimes).not.toContain('2030-06-01T20:00:00.000Z'); // exactly 10h → excluded
		expect(startTimes).toContain('2030-06-01T21:00:00.000Z'); // 11h → included ✓

		vi.useRealTimers();
	});
});

// ---------- releaseExpiredLocks ----------

describe('releaseExpiredLocks', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns number of released locks', async () => {
		const returnChain = {
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
			})
		};
		vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue(returnChain) } as never);

		const count = await releaseExpiredLocks();
		expect(count).toBe(2);
	});

	it('returns 0 when no expired locks', async () => {
		const returnChain = {
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([])
			})
		};
		vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue(returnChain) } as never);

		const count = await releaseExpiredLocks();
		expect(count).toBe(0);
	});
});

// ---------- confirmByPaymentId ----------

describe('confirmByPaymentId', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Non-empty rows → optimistic UPDATE returns 1 row → 'confirmed' (not 'already_confirmed')
		vi.mocked(db.update).mockReturnValue(updateMock([{ id: 1 }]) as never);
	});

	it('returns not_found when no booking exists', async () => {
		vi.mocked(db.select).mockReturnValue(selectMock([]) as never);
		expect(await confirmByPaymentId(1)).toBe('not_found');
	});

	it('returns already_confirmed when booking is already confirmed', async () => {
		vi.mocked(db.select).mockReturnValue(
			selectMock([{ id: 1, status: 'confirmed', availabilityId: 1, bookedAt: SLOT_AT }]) as never
		);
		expect(await confirmByPaymentId(1)).toBe('already_confirmed');
	});

	it('confirms a pending_payment booking', async () => {
		vi.mocked(db.select).mockReturnValue(
			selectMock([
				{ id: 5, status: 'pending_payment', availabilityId: 1, bookedAt: SLOT_AT }
			]) as never
		);
		const result = await confirmByPaymentId(1);
		expect(result).toBe('confirmed');
		expect(db.update).toHaveBeenCalledTimes(1);
	});

	it('confirms a cancelled booking if slot is still free', async () => {
		vi.mocked(db.select)
			.mockReturnValueOnce(
				selectMock([{ id: 5, status: 'cancelled', availabilityId: 1, bookedAt: SLOT_AT }]) as never
			)
			.mockReturnValueOnce(selectMock([]) as never); // no conflict
		const result = await confirmByPaymentId(1);
		expect(result).toBe('confirmed');
	});

	it('returns slot_taken and sets requires_refund if cancelled and slot confirmed by someone else', async () => {
		vi.mocked(db.select)
			.mockReturnValueOnce(
				selectMock([{ id: 5, status: 'cancelled', availabilityId: 1, bookedAt: SLOT_AT }]) as never
			)
			.mockReturnValueOnce(selectMock([{ id: 9, status: 'confirmed' }]) as never); // conflict!

		const updateSpy = vi.mocked(db.update) as Mock;
		let capturedStatus: string | undefined;
		updateSpy.mockImplementation(() => {
			const chain = updateMock();
			// Capture the status passed to .set()
			const origSet = chain.set.bind(chain);
			chain.set = vi.fn((vals: Record<string, unknown>) => {
				capturedStatus = vals.status as string;
				return origSet(vals);
			});
			return chain as never;
		});

		const result = await confirmByPaymentId(1);
		expect(result).toBe('slot_taken');
		expect(capturedStatus).toBe('requires_refund');
	});

	it('returns already_confirmed when concurrent webhook already processed the payment', async () => {
		// Booking is still pending_payment when we read it, but the UPDATE returns 0 rows
		// (another webhook confirmed it between our SELECT and UPDATE)
		vi.mocked(db.select).mockReturnValue(
			selectMock([
				{ id: 5, status: 'pending_payment', availabilityId: 1, bookedAt: SLOT_AT }
			]) as never
		);
		// Optimistic UPDATE returns 0 rows → already_confirmed
		vi.mocked(db.update).mockReturnValue(updateMock([]) as never);

		const result = await confirmByPaymentId(1);
		expect(result).toBe('already_confirmed');
	});

	it('returns slot_taken when conflict is a pending_payment with active lock', async () => {
		vi.mocked(db.select)
			.mockReturnValueOnce(
				selectMock([{ id: 5, status: 'cancelled', availabilityId: 1, bookedAt: SLOT_AT }]) as never
			)
			.mockReturnValueOnce(
				selectMock([
					{ id: 9, status: 'pending_payment', lockedUntil: '3000-01-01T00:00:00.000Z' }
				]) as never
			);

		const updateSpy = vi.mocked(db.update) as Mock;
		let capturedStatus: string | undefined;
		updateSpy.mockImplementation(() => {
			const chain = updateMock();
			const origSet = chain.set.bind(chain);
			chain.set = vi.fn((vals: Record<string, unknown>) => {
				capturedStatus = vals.status as string;
				return origSet(vals);
			});
			return chain as never;
		});

		const result = await confirmByPaymentId(1);
		expect(result).toBe('slot_taken');
		expect(capturedStatus).toBe('requires_refund');
	});
});

// ---------- createBooking — MSK timezone in description ----------

describe('createBooking — MSK timezone in description', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
	});
	afterEach(() => vi.useRealTimers());

	it('formats description with MSK time (UTC+3)', async () => {
		// SLOT_AT = '2024-06-01T10:00:00.000Z' = 13:00 MSK
		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AVAIL]) as never)
			.mockReturnValueOnce(selectMock([]) as never);

		vi.mocked(db.update).mockReturnValue(updateMock() as never);
		vi.mocked(db.insert).mockReturnValue(insertMock([{ id: 42 }]) as never);

		const mockCreate = vi.mocked(createPayment).mockResolvedValue({
			url: 'https://robokassa.test',
			fields: { InvId: '99', MerchantLogin: 'test', OutSum: '4000.00', SignatureValue: 'abc' }
		} as never);

		await createBooking({
			availabilityId: 1,
			bookedAt: SLOT_AT,
			email: 'a@b.com',
			clientName: 'A',
			originUrl: 'http://localhost'
		});

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({ description: 'Консультация' })
		);
	});
});

// ---------- createBooking — race condition via unique index ----------

describe('createBooking — race condition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
		// Needed for cancel-expired-locks UPDATE and orphan-payment cleanup UPDATE
		vi.mocked(db.update).mockReturnValue(updateMock() as never);
	});
	afterEach(() => vi.useRealTimers());

	it('throws "Слот уже занят" when db.insert fails due to unique constraint', async () => {
		vi.mocked(db.select)
			.mockReturnValueOnce(selectMock([AVAIL]) as never)
			.mockReturnValueOnce(selectMock([]) as never); // select says slot free...

		vi.mocked(db.update).mockReturnValue(updateMock() as never);

		// createPayment succeeds (called before INSERT in new flow)
		vi.mocked(createPayment).mockResolvedValueOnce({
			url: 'https://robokassa.test',
			fields: { InvId: '77', MerchantLogin: 'test', OutSum: '4000.00', SignatureValue: 'abc' }
		} as never);

		// ...but insert throws unique constraint violation (concurrent request snuck in)
		vi.mocked(db.insert).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi
					.fn()
					.mockRejectedValue(new Error('duplicate key value violates unique constraint'))
			})
		} as never);

		await expect(
			createBooking({
				availabilityId: 1,
				bookedAt: SLOT_AT,
				email: 'a@b.com',
				clientName: 'A',
				originUrl: 'http://localhost'
			})
		).rejects.toThrow('Слот уже занят');
	});
});
