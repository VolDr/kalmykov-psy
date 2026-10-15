import { describe, it, expect } from 'vitest';
import { formatRubles, toPaymentAmount } from './pricing';

describe('money helpers', () => {
	it('formats prices in rubles', () => {
		expect(formatRubles(4000)).toContain('4');
		expect(formatRubles(4000)).toContain('000');
		expect(formatRubles(4000)).toContain('₽');
	});
	it('preserves the two decimal places required by Robokassa', () => {
		expect(toPaymentAmount(4000)).toBe('4000.00');
		expect(toPaymentAmount(14000)).toBe('14000.00');
	});
});
