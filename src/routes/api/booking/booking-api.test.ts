import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock createBooking before importing the server module
vi.mock('$lib/server/booking.server', () => ({
	createBooking: vi.fn(),
	CONSULTATION_PRICE: '4000.00',
	PACKAGE_PRICE: '14000.00'
}));

import { POST } from './+server';
import { isRateLimited, _clearIpWindowForTest } from '$lib/server/rate-limit.server';
import { createBooking } from '$lib/server/booking.server';

const mockCreateBooking = vi.mocked(createBooking);

// ---------- isRateLimited ----------

describe('isRateLimited', () => {
	beforeEach(() => _clearIpWindowForTest());

	it('allows first request from new IP', () => {
		expect(isRateLimited('1.2.3.4')).toBe(false);
	});

	it('allows up to 5 requests from same IP', () => {
		for (let i = 0; i < 5; i++) {
			expect(isRateLimited('10.0.0.1')).toBe(false);
		}
	});

	it('blocks 6th request from same IP', () => {
		for (let i = 0; i < 5; i++) isRateLimited('10.0.0.2');
		expect(isRateLimited('10.0.0.2')).toBe(true);
	});

	it('does not affect other IPs', () => {
		for (let i = 0; i < 5; i++) isRateLimited('10.0.0.3');
		// different IP — should still be allowed
		expect(isRateLimited('10.0.0.99')).toBe(false);
	});

	it('resets counter after window expires', () => {
		vi.useFakeTimers();
		for (let i = 0; i < 5; i++) isRateLimited('192.168.1.1');
		expect(isRateLimited('192.168.1.1')).toBe(true);

		// advance past the 60-second window
		vi.advanceTimersByTime(61_000);

		expect(isRateLimited('192.168.1.1')).toBe(false);
		vi.useRealTimers();
	});
});

// ---------- POST validation ----------

function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
	return POST({
		request: {
			json: async () => body
		},
		url: new URL('http://localhost/api/booking'),
		getClientAddress: () => ip
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any);
}

describe('POST /api/booking — validation', () => {
	beforeEach(() => {
		_clearIpWindowForTest();
		vi.clearAllMocks();
	});

	const validBody = {
		availabilityId: 1,
		bookedAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
		telegram: '@ivan',
		email: 'ivan@example.com'
	};

	it('returns 400 when availabilityId is missing', async () => {
		const res = await makeRequest({ ...validBody, availabilityId: undefined });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBeTruthy();
	});

	it('returns 400 when availabilityId is not a valid integer', async () => {
		const res = await makeRequest({ ...validBody, availabilityId: 'abc' });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBeTruthy();
	});

	it('returns 400 when bookedAt is missing', async () => {
		const res = await makeRequest({ ...validBody, bookedAt: undefined });
		expect(res.status).toBe(400);
	});

	it('returns 400 when telegram is blank', async () => {
		const res = await makeRequest({ ...validBody, telegram: '   ' });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/поля/i);
	});

	it('returns 400 when email is blank', async () => {
		const res = await makeRequest({ ...validBody, email: '   ' });
		expect(res.status).toBe(400);
	});

	it('returns 400 when telegram exceeds 64 characters', async () => {
		const res = await makeRequest({ ...validBody, telegram: 'a'.repeat(65) });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/telegram/i);
	});

	it('returns 400 when email exceeds 254 characters', async () => {
		const res = await makeRequest({ ...validBody, email: 'a'.repeat(250) + '@b.com' });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/email/i);
	});

	it('returns 400 when email has no @', async () => {
		const res = await makeRequest({ ...validBody, email: 'notanemail' });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/email/i);
	});

	it('returns 400 when bookedAt is not a valid date', async () => {
		const res = await makeRequest({ ...validBody, bookedAt: 'not-a-date' });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/время/i);
	});

	it('returns 429 when IP is rate-limited', async () => {
		const ip = '5.5.5.5';
		for (let i = 0; i < 5; i++) isRateLimited(ip); // exhaust quota
		const res = await makeRequest(validBody, ip);
		expect(res.status).toBe(429);
		const body = await res.json();
		expect(body.error).toMatch(/запросов/i);
	});
});

// ---------- POST — success and error forwarding ----------

describe('POST /api/booking — createBooking integration', () => {
	beforeEach(() => {
		_clearIpWindowForTest();
		vi.clearAllMocks();
	});

	const validBody = {
		availabilityId: 1,
		bookedAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
		telegram: '@ivan',
		email: 'ivan@example.com'
	};

	it('returns 200 with payment info on success', async () => {
		const fakePayment = { url: 'https://robokassa.ru', fields: { InvId: '42' } };
		mockCreateBooking.mockResolvedValueOnce(fakePayment);

		const res = await makeRequest(validBody);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.url).toBe('https://robokassa.ru');
	});

	it('returns 400 with error message when createBooking throws', async () => {
		mockCreateBooking.mockRejectedValueOnce(new Error('Слот уже занят'));

		const res = await makeRequest(validBody);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe('Слот уже занят');
	});

	it('maps and trims telegram and email before passing to createBooking', async () => {
		const fakePayment = { url: 'https://robokassa.ru', fields: { InvId: '1' } };
		mockCreateBooking.mockResolvedValueOnce(fakePayment);

		await makeRequest({
			...validBody,
			telegram: '  @ivan  ',
			email: '  ivan@example.com  ',
			type: 'package'
		});

		expect(mockCreateBooking).toHaveBeenCalledWith(
			expect.objectContaining({
				clientName: '@ivan',
				email: 'ivan@example.com',
				outSum: '14000.00'
			})
		);
	});

	it('keeps accepting clientName from older clients', async () => {
		const fakePayment = { url: 'https://robokassa.ru', fields: { InvId: '2' } };
		mockCreateBooking.mockResolvedValueOnce(fakePayment);

		await makeRequest({ ...validBody, telegram: undefined, clientName: '  Иван  ' });

		expect(mockCreateBooking).toHaveBeenCalledWith(expect.objectContaining({ clientName: 'Иван' }));
	});
});
