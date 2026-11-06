import { describe, expect, it } from 'vitest';
import { reviewChoiceLabel, reviewOptionOrder } from './translation-review-order';

describe('review option order', () => {
	it('labels by visible position even when original B is on the left', () => {
		for (let key = 0; key < 37; key++) {
			const [left, right] = reviewOptionOrder(12, String(key));
			expect(reviewChoiceLabel(12, String(key), left)).toBe('Вариант 1');
			expect(reviewChoiceLabel(12, String(key), right)).toBe('Вариант 2');
			expect(reviewChoiceLabel(12, String(key), '')).toBe('Не выбран');
		}
	});
	it('remains identical for both people and reloads without depending on visit order', () => {
		const first = Array.from({ length: 37 }, (_, i) => reviewOptionOrder(12, String(i)));
		for (let i = 36; i >= 0; i--) expect(reviewOptionOrder(12, String(i))).toEqual(first[i]);
		expect(first.every((order) => [...order].sort().join('') === 'ab')).toBe(true);
		expect(new Set(first.map((order) => order.join('')))).toEqual(new Set(['ab', 'ba']));
		expect(first).not.toEqual(Array.from({ length: 37 }, (_, i) => reviewOptionOrder(13, String(i))));
	});
});
