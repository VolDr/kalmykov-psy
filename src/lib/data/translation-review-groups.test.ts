import { describe, expect, it } from 'vitest';
import { groupReviewItems, meaqScales, reviewConstructFor } from './translation-review-groups';
import type { TranslationItem } from './translation';

const item = (key: string): TranslationItem => ({
	key,
	label: key,
	short: key,
	group: 'Пункты',
	source: key
});
const meaqItems = [
	item('instruction'),
	...Array.from({ length: 6 }, (_, i) => item(`option${i + 1}`)),
	...Array.from({ length: 30 }, (_, i) => item(String(i + 1)))
];

describe('groupReviewItems', () => {
	it('ставит инструкцию и ответы первыми, затем шесть шкал по пять пунктов', () => {
		const groups = groupReviewItems(meaqItems);
		expect(groups).toHaveLength(7);
		expect(groups[0].scale).toBeNull();
		expect(groups[0].items.map((e) => e.item.key)).toEqual([
			'instruction',
			'option1',
			'option2',
			'option3',
			'option4',
			'option5',
			'option6'
		]);
		expect(groups[1].items.map((e) => e.item.key)).toEqual(['1', '7', '13', '19', '25']);
		expect(groups[3].items.map((e) => e.item.key)).toEqual(['3', '9', '15', '21', '27']);
		expect(groups[6].items.map((e) => e.item.key)).toEqual(['6', '12', '18', '24', '30']);
		expect(reviewConstructFor(groups)?.title).toBe('Избегание переживаний');
	});

	it('сохраняет исходный номер пункта в документе', () => {
		const groups = groupReviewItems(meaqItems);
		const seven = groups[1].items[1];
		expect(seven.item.key).toBe('7');
		expect(seven.index).toBe(meaqItems.findIndex((it) => it.key === '7'));
	});

	it('каждый пункт попадает ровно в одну группу', () => {
		const keys = groupReviewItems(meaqItems).flatMap((g) => g.items.map((e) => e.item.key));
		expect(keys).toHaveLength(meaqItems.length);
		expect(new Set(keys).size).toBe(meaqItems.length);
		expect(meaqScales.flatMap((s) => s.itemKeys)).toHaveLength(30);
	});

	it('для другого опросника оставляет один список без определений', () => {
		const other = [item('instruction'), item('1'), item('2')];
		const groups = groupReviewItems(other);
		expect(groups).toEqual([
			{ scale: null, items: other.map((it, index) => ({ item: it, index })) }
		]);
		expect(reviewConstructFor(groups)).toBeNull();
	});
});
