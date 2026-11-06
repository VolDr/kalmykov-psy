import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import ReconciliationResults from './ReconciliationResults.svelte';
import type { TranslationItem } from '#lib/data/translation.js';
import type { AdminReconciliation } from '#lib/data/translation-reconciliation.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn() }));

const item = (key: string): TranslationItem => ({
	key,
	label: `Пункт ${key}`,
	short: key,
	group: 'Пункты',
	source: `Source ${key}`
});
const items = [
	item('instruction'),
	...Array.from({ length: 6 }, (_, i) => item(`option${i + 1}`)),
	...Array.from({ length: 30 }, (_, i) => item(String(i + 1)))
];
const variant = Object.fromEntries(items.map((it) => [it.key, `Перевод ${it.key}`]));
const participant = (slot: number) => ({
	slot,
	docId: slot,
	token: `token-${slot}`,
	profile: { name: `Участник ${slot}`, avatar: '' },
	entries: {}
});
const review: AdminReconciliation = {
	id: 5,
	title: 'Согласование',
	finalDocId: 9,
	items,
	variantA: variant,
	variantB: variant,
	participants: [participant(1), participant(2)],
	finalEntries: {},
	comments: []
};

describe('admin reconciliation table grouped by scales', () => {
	const { body } = render(ReconciliationResults, { props: { review, sourceId: 1 } });

	it('puts a scale header row before the rows of its items', () => {
		const rowKeys = [...body.matchAll(/<th class="p-3 font-medium">Пункт (\w+)<\/th>/g)].map(
			(m) => m[1]
		);
		expect(rowKeys).toHaveLength(37);
		expect(rowKeys.slice(7, 12)).toEqual(['1', '7', '13', '19', '25']);
		const header = body.indexOf('Шкала 1. Поведенческое избегание');
		expect(header).toBeGreaterThan(body.indexOf('Пункт option6'));
		expect(header).toBeLessThan(body.indexOf('Пункт 1<'));
		expect(body).toContain('Шкала 6. Выносливость к дистрессу');
		expect(body.match(/<tbody/g)).toHaveLength(7);
	});
});
