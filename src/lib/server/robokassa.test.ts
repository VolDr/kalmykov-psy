import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// vi.hoisted ensures mockDb is created before vi.mock factory runs (both are hoisted)
const mockDb = vi.hoisted(() => ({
	insert: vi.fn(() => ({
		values: vi.fn(() => ({
			returning: vi.fn(async () => [{ id: 1, description: 'test', outSum: '4000.00' }])
		}))
	})),
	select: vi.fn(),
	update: vi.fn()
}));

vi.mock('../..', () => ({ db: mockDb }));

beforeAll(() => {
	process.env.ROBOKASSA_LOGIN = 'testlogin';
	process.env.ROBOKASSA_PASS1 = 'testpass1';
	process.env.ROBOKASSA_PASS2 = 'testpass2';
	process.env.ROBOKASSA_IS_TEST = '1';
});

// Chainable thenable mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectMock(rows: unknown[]): any {
	const chain: Record<string, unknown> = {};
	chain.from = vi.fn().mockReturnValue(chain);
	chain.where = vi.fn().mockReturnValue(chain);
	chain.limit = vi.fn().mockReturnValue(chain);
	chain.orderBy = vi.fn().mockReturnValue(chain);
	chain.then = (res: (v: unknown[]) => unknown, rej: (e: unknown) => unknown) =>
		Promise.resolve(rows).then(res, rej);
	chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
	return chain;
}

import { validateResultSig, isTestMode, markPaid, createPayment, releaseExpiredPayments } from './robokassa.server';

function makeSig(outSum: string, invId: number, pass2: string): string {
	return createHash('md5').update(`${outSum}:${invId}:${pass2}`).digest('hex');
}

function makePaymentSig(login: string, outSum: string, invId: number, pass1: string): string {
	return createHash('md5').update(`${login}:${outSum}:${invId}:${pass1}`).digest('hex');
}

// ---------- validateResultSig ----------

describe('validateResultSig', () => {
	it('returns true for correct signature', () => {
		const sig = makeSig('4000.00', 1, 'testpass2');
		expect(validateResultSig('4000.00', 1, sig)).toBe(true);
	});

	it('is case-insensitive', () => {
		const sig = makeSig('4000.00', 1, 'testpass2').toUpperCase();
		expect(validateResultSig('4000.00', 1, sig)).toBe(true);
	});

	it('returns false for wrong outSum', () => {
		const sig = makeSig('4000.00', 1, 'testpass2');
		expect(validateResultSig('9999.00', 1, sig)).toBe(false);
	});

	it('returns false for wrong invId', () => {
		const sig = makeSig('4000.00', 1, 'testpass2');
		expect(validateResultSig('4000.00', 999, sig)).toBe(false);
	});

	it('returns false for wrong password', () => {
		const sig = makeSig('4000.00', 1, 'wrongpass');
		expect(validateResultSig('4000.00', 1, sig)).toBe(false);
	});

	it('returns false for empty signature', () => {
		expect(validateResultSig('4000.00', 1, '')).toBe(false);
	});
});

// ---------- isTestMode ----------

describe('isTestMode', () => {
	it('returns true when ROBOKASSA_IS_TEST=1', () => {
		expect(isTestMode()).toBe(true);
	});
});

// ---------- markPaid ----------

describe('markPaid', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns false for invalid signature', async () => {
		const result = await markPaid(1, '4000.00', 'badsig');
		expect(result).toBe(false);
		expect(mockDb.select).not.toHaveBeenCalled();
	});

	it('returns false when payment not found in DB', async () => {
		mockDb.select.mockReturnValue(selectMock([]));
		const sig = makeSig('4000.00', 1, 'testpass2');
		const result = await markPaid(1, '4000.00', sig);
		expect(result).toBe(false);
	});

	it('returns false when outSum does not match DB (amount tampering)', async () => {
		// DB has 4000.00, attacker sends 1.00 with valid signature for 1.00
		mockDb.select.mockReturnValue(selectMock([{ id: 1, outSum: '4000.00', status: 'pending' }]));
		const sig = makeSig('1.00', 1, 'testpass2'); // valid sig for 1 ruble
		const result = await markPaid(1, '1.00', sig);
		expect(result).toBe(false);
	});

	it('returns true and updates status when everything matches', async () => {
		mockDb.select.mockReturnValue(selectMock([{ id: 1, outSum: '4000.00', status: 'pending' }]));
		const updateChain = { set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) };
		mockDb.update.mockReturnValue(updateChain);

		const sig = makeSig('4000.00', 1, 'testpass2');
		const result = await markPaid(1, '4000.00', sig);
		expect(result).toBe(true);
		expect(mockDb.update).toHaveBeenCalledTimes(1);
	});

	it('returns true when DB has "4000" and webhook sends "4000.00" (parseFloat normalises both)', async () => {
		// Robokassa sometimes omits trailing zeros; parseFloat('4000') === parseFloat('4000.00')
		mockDb.select.mockReturnValue(selectMock([{ id: 1, outSum: '4000', status: 'pending' }]));
		const updateChain = { set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) };
		mockDb.update.mockReturnValue(updateChain);

		const sig = makeSig('4000.00', 1, 'testpass2');
		const result = await markPaid(1, '4000.00', sig);
		expect(result).toBe(true);
	});

	it('returns false for negative outSum (amount manipulation)', async () => {
		// Even if attacker forges a valid signature for a negative amount, the DB amount won't match
		mockDb.select.mockReturnValue(selectMock([{ id: 1, outSum: '4000.00', status: 'pending' }]));
		const sig = makeSig('-4000.00', 1, 'testpass2');
		const result = await markPaid(1, '-4000.00', sig);
		expect(result).toBe(false);
	});

	it('returns false for non-numeric outSum ("abc") — parseFloat("abc") is NaN, never equals stored amount', async () => {
		// A valid signature is constructed for 'abc' to bypass sig check and reach the amount guard.
		// parseFloat(payment.outSum) !== parseFloat('abc') → 4000 !== NaN → returns false.
		mockDb.select.mockReturnValue(selectMock([{ id: 1, outSum: '4000.00', status: 'pending' }]));
		const sig = makeSig('abc', 1, 'testpass2'); // valid sig for 'abc' (worst-case bypass attempt)
		const result = await markPaid(1, 'abc', sig);
		expect(result).toBe(false);
	});
});

// ---------- createPayment ----------

describe('createPayment', () => {
	it('generates correct SignatureValue using pass1', async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 7, description: 'Тест', outSum: '4000.00' }])
			})
		});

		const result = await createPayment({ outSum: '4000.00', description: 'Тест' });
		const expectedSig = makePaymentSig('testlogin', '4000.00', 7, 'testpass1');
		expect(result.fields.SignatureValue).toBe(expectedSig);
	});

	it('sets IsTest=1 in test mode', async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 8, description: 'Тест', outSum: '4000.00' }])
			})
		});

		const result = await createPayment({ outSum: '4000.00', description: 'Тест' });
		expect(result.fields.IsTest).toBe('1');
	});

	it('ExpirationDate has no milliseconds and ends with +00:00', async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 9, description: 'Тест', outSum: '4000.00' }])
			})
		});

		const result = await createPayment({ outSum: '4000.00', description: 'Тест', expiresInMinutes: 15 });
		expect(result.fields.ExpirationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
	});

	it('includes optional fields only when provided', async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 10, description: 'Тест', outSum: '4000.00' }])
			})
		});

		const withEmail = await createPayment({
			outSum: '4000.00',
			description: 'Тест',
			email: 'a@b.com',
			successUrl: 'https://example.com/success'
		});
		expect(withEmail.fields.Email).toBe('a@b.com');
		expect(withEmail.fields.SuccessURL).toBe('https://example.com/success');
		expect(withEmail.fields.FailURL).toBeUndefined();

		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 11, description: 'Тест', outSum: '4000.00' }])
			})
		});

		const noEmail = await createPayment({ outSum: '4000.00', description: 'Тест' });
		expect(noEmail.fields.Email).toBeUndefined();
		expect(noEmail.fields.SuccessURL).toBeUndefined();
	});
});

// ---------- releaseExpiredPayments ----------

describe('releaseExpiredPayments', () => {
	beforeEach(() => vi.clearAllMocks());

	function updateReturning(rows: unknown[]) {
		return {
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue(rows)
				})
			})
		};
	}

	it('returns number of expired payments released', async () => {
		mockDb.update.mockReturnValue(updateReturning([{ id: 3 }, { id: 7 }]));

		const count = await releaseExpiredPayments();
		expect(count).toBe(2);
		expect(mockDb.update).toHaveBeenCalledTimes(1);
	});

	it('returns 0 when no expired payments', async () => {
		mockDb.update.mockReturnValue(updateReturning([]));

		const count = await releaseExpiredPayments();
		expect(count).toBe(0);
	});

	it('sets status to failed for expired pending payments', async () => {
		const setMock = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ id: 1 }])
			})
		});
		mockDb.update.mockReturnValue({ set: setMock });

		await releaseExpiredPayments();

		expect(setMock).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'failed' })
		);
	});
});
