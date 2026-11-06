import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import ReconciliationWorkspace from './ReconciliationWorkspace.svelte';
import type { TranslationItem } from '#lib/data/translation.js';
import type { ReviewerReconciliation } from '#lib/data/translation-reconciliation.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), replaceState: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('https://example.test/translate/own-link'), state: {} }
}));

const item = (key: string, group: string): TranslationItem => ({
	key,
	label: `Пункт ${key}`,
	short: key,
	group,
	source: `Source ${key}`
});
const items = [
	item('instruction', 'Инструкция'),
	...Array.from({ length: 6 }, (_, i) => item(`option${i + 1}`, 'Ответы')),
	...Array.from({ length: 30 }, (_, i) => item(String(i + 1), 'Утверждения'))
];
const variant = Object.fromEntries(items.map((it) => [it.key, `Перевод ${it.key}`]));
const review: ReviewerReconciliation = {
	id: 3,
	title: 'Согласование',
	slot: 1,
	profile: { name: 'Анна', avatar: '' },
	variantA: variant,
	variantB: variant,
	participants: [{ slot: 1, profile: { name: 'Анна', avatar: '' }, entries: {} }],
	comments: []
};

describe('reconciliation page grouped by MEAQ-30 scales', () => {
	const { body } = render(ReconciliationWorkspace, {
		props: { data: { title: review.title, items, entries: {} }, review, token: 'own-link' }
	});

	it('shows the construct and each scale definition before its items', () => {
		expect(body).toContain('Избегание переживаний');
		const scale = body.indexOf('Поведенческое избегание');
		const definition = body.indexOf('Явное, ситуативное избегание');
		const firstItem = body.indexOf('Source 7');
		expect(scale).toBeGreaterThan(0);
		expect(definition).toBeGreaterThan(scale);
		expect(firstItem).toBeGreaterThan(definition);
		expect(firstItem).toBeLessThan(body.indexOf('Неприятие дистресса</h2>'));
	});

	it('orders items by scale and numbers them in that order', () => {
		const order = [...body.matchAll(/<p lang="en"[^>]*>Source (\w+)<\/p>/g)].map((m) => m[1]);
		expect(order.slice(0, 7)).toEqual([
			'instruction',
			...[1, 2, 3, 4, 5, 6].map((n) => `option${n}`)
		]);
		expect(order.slice(7, 12)).toEqual(['1', '7', '13', '19', '25']);
		expect(order.slice(-5)).toEqual(['6', '12', '18', '24', '30']);
		expect(body).toContain('id="review-item-37"');
		expect(body).toContain('<optgroup label="Выносливость к дистрессу">');
	});
});
