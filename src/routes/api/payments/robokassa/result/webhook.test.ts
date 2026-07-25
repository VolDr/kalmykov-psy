import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/robokassa.server', () => ({
	markPaid: vi.fn(),
	getPaymentById: vi.fn()
}));

vi.mock('$lib/server/booking.server', () => ({
	confirmByPaymentId: vi.fn(),
	getBookingByPaymentId: vi.fn()
}));

import { POST } from './+server';
import { markPaid } from '$lib/server/robokassa.server';
import { confirmByPaymentId } from '$lib/server/booking.server';

const mockMarkPaid = vi.mocked(markPaid);
const mockConfirm = vi.mocked(confirmByPaymentId);

// ---------- helpers ----------

function makeFormRequest(fields: Record<string, string | undefined>) {
	const form = new FormData();
	for (const [k, v] of Object.entries(fields)) {
		if (v !== undefined) form.set(k, v);
	}
	return { request: { formData: async () => form } } as Parameters<typeof POST>[0];
}

// ---------- tests ----------

describe('POST /api/payments/robokassa/result', () => {
	beforeEach(() => vi.clearAllMocks());

	// ── 400 validation ─────────────────────────────────────────────────────────

	it('returns 400 when InvId is missing', async () => {
		const res = await POST(makeFormRequest({ OutSum: '4000.00', SignatureValue: 'abc' }));
		expect(res.status).toBe(400);
	});

	it('returns 400 when OutSum is missing', async () => {
		const res = await POST(makeFormRequest({ InvId: '1', SignatureValue: 'abc' }));
		expect(res.status).toBe(400);
	});

	it('returns 400 when SignatureValue is missing', async () => {
		const res = await POST(makeFormRequest({ InvId: '1', OutSum: '4000.00' }));
		expect(res.status).toBe(400);
	});

	it('returns 400 when InvId is not a valid integer ("abc")', async () => {
		const res = await POST(makeFormRequest({ InvId: 'abc', OutSum: '4000.00', SignatureValue: 'sig' }));
		expect(res.status).toBe(400);
	});

	// ── 400 bad signature ──────────────────────────────────────────────────────

	it('returns 400 when markPaid rejects the signature', async () => {
		mockMarkPaid.mockResolvedValueOnce(false);
		const res = await POST(makeFormRequest({ InvId: '42', OutSum: '4000.00', SignatureValue: 'badsig' }));
		expect(res.status).toBe(400);
	});

	// ── 200 success — Robokassa contract ──────────────────────────────────────

	it('returns exactly "OK<InvId>" body with status 200 on success', async () => {
		mockMarkPaid.mockResolvedValueOnce(true);
		mockConfirm.mockResolvedValueOnce('confirmed');

		const res = await POST(makeFormRequest({ InvId: '42', OutSum: '4000.00', SignatureValue: 'sig' }));
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('OK42');
	});

	it('still returns OK<InvId> when slot_taken (so Robokassa does not retry)', async () => {
		mockMarkPaid.mockResolvedValueOnce(true);
		mockConfirm.mockResolvedValueOnce('slot_taken');

		const res = await POST(makeFormRequest({ InvId: '7', OutSum: '4000.00', SignatureValue: 'sig' }));
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('OK7');
	});

	it('still returns OK<InvId> when booking not_found (prevents Robokassa retry storm)', async () => {
		mockMarkPaid.mockResolvedValueOnce(true);
		mockConfirm.mockResolvedValueOnce('not_found');

		const res = await POST(makeFormRequest({ InvId: '99', OutSum: '4000.00', SignatureValue: 'sig' }));
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('OK99');
	});
});
