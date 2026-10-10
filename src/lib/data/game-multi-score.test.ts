import { describe, expect, it } from 'vitest';
import { multiFraction } from './game-multi-score';

describe('multiFraction', () => {
	it('считает долю верных отмеченных', () => {
		expect(multiFraction([0, 2], [0, 2])).toBe(1);
		expect(multiFraction([2, 0], [0, 2])).toBe(1);
		expect(multiFraction([0], [0, 2])).toBe(0.5);
		expect(multiFraction([1], [1, 2, 3, 4])).toBe(0.25);
	});

	it('каждый неверный вариант снимает один верный', () => {
		expect(multiFraction([0, 1], [0, 2])).toBe(0); // 1 из 2 + 1 неверный
		expect(multiFraction([0, 1, 3], [0, 2])).toBe(0); // 1 из 2 + 2 неверных: ниже нуля не уходит
		expect(multiFraction([0, 1, 4], [0, 1, 2, 3])).toBe(0.25); // 2 из 4 + 1 неверный
		expect(multiFraction([0, 1, 2, 3, 4], [0, 1, 2, 3])).toBe(0.75); // 4 из 4 + 1 неверный
	});

	it('только неверные и пустой выбор — ноль', () => {
		expect(multiFraction([1], [0, 2])).toBe(0);
		expect(multiFraction([], [0, 2])).toBe(0);
	});
});
