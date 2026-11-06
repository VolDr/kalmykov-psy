import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import ReconciliationWorkspace from './ReconciliationWorkspace.svelte';
import TranslationWorkspace from './TranslationWorkspace.svelte';
import { emptyTranslationEntry, type TranslationItem } from '#lib/data/translation.js';
import type { ReviewerReconciliation } from '#lib/data/translation-reconciliation.js';
import { reviewOptionOrder } from '#lib/data/translation-review-order.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), replaceState: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('https://example.test/translate/own-link'), state: {} }
}));

const items: TranslationItem[] = ['1', '2', '3'].map((key) => ({
	key,
	label: `Пункт ${key}`,
	short: key,
	group: 'Утверждения',
	source: `Source ${key}`
}));
const own = {
	'1': { ...emptyTranslationEntry(), translation: 'a' },
	'2': { ...emptyTranslationEntry(), translation: 'b' }
};
const review: ReviewerReconciliation = {
	id: 7,
	title: 'Согласование',
	slot: 1,
	profile: { name: 'Анна', avatar: '/own.png' },
	variantA: { '1': 'Первый A', '2': 'Второй A', '3': 'Третий A' },
	variantB: { '1': 'Первый B', '2': 'Второй B', '3': 'Третий B' },
	participants: [
		{ slot: 1, profile: { name: 'Анна', avatar: '/own.png' }, entries: own },
		{
			slot: 2,
			profile: { name: 'Михаил', avatar: '/peer.png' },
			entries: {
				'1': { ...emptyTranslationEntry(), translation: 'a' },
				'2': { ...emptyTranslationEntry(), translation: 'a' }
			}
		}
	],
	comments: [
		{
			id: '00000000-0000-4000-8000-000000000001',
			slot: 2,
			itemKey: '1',
			body: 'Комментарий коллеги'
		},
		{ id: '00000000-0000-4000-8000-000000000002', slot: 1, itemKey: '1', body: 'Мой комментарий' }
	]
};

describe('translation directions use the same editor', () => {
	it('shows Russian source and English input for the back translator', () => {
		const { body } = render(TranslationWorkspace, { props: {
			data: { kind: 'backtranslation', title: 'Обратный перевод', items: [{ ...items[0], source: 'Итоговая русская формулировка' }], guide: '', entries: {} }, token: 'own-link'
		} });
		expect(body).toContain('Итоговая русская формулировка');
		expect(body).toContain('Перевод на английский');
		expect(body).toMatch(/<p[^>]*lang="ru"/);
		expect(body).toMatch(/<textarea[^>]*id="tr-translation"[^>]*lang="en"/);
	});
	it('keeps English source and Russian input for the direct translator', () => {
		const { body } = render(TranslationWorkspace, { props: {
			data: { kind: 'translation', title: 'Прямой перевод', items, guide: '', entries: {} }, token: 'own-link'
		} });
		expect(body).not.toContain('Перевод на английский');
		expect(body).toMatch(/<p[^>]*lang="en"/);
		expect(body).toMatch(/<textarea[^>]*id="tr-translation"[^>]*lang="ru"/);
	});
});

describe('continuous reconciliation page', () => {
	it('numbers cards left to right rather than revealing the source after shuffling', () => {
		const { body } = render(ReconciliationWorkspace, {
			props: {
				data: { title: review.title, items, entries: own },
				review,
				token: 'own-link'
			}
		});
		const labels = [...body.matchAll(/<label class="flex flex-1[\s\S]*?<\/label>/g)].map(
			(match) => match[0]
		);
		expect(labels).toHaveLength(6);
		items.forEach((item, index) => {
			const order = reviewOptionOrder(review.id, item.key);
			for (let position = 0; position < 2; position++) {
				const label = labels[index * 2 + position];
				expect(label).toContain(`Вариант ${position + 1}`);
				expect(label).toContain(`value="${order[position]}"`);
				expect(label).toContain(
					(order[position] === 'a' ? review.variantA : review.variantB)[item.key]
				);
			}
		});
	});
	it('renders all items with independent radio groups and both comments but only own edit controls', () => {
		const { body } = render(ReconciliationWorkspace, {
			props: {
				data: { title: review.title, items, entries: own },
				review,
				token: 'own-link'
			}
		});
		for (let index = 1; index <= 3; index++) {
			expect(body).toContain(`id="review-item-${index}"`);
			expect(body.match(new RegExp(`name="review-choice-${index}"`, 'g'))).toHaveLength(2);
		}
		expect(body).toContain('Первый A');
		expect(body).toContain('Третий B');
		expect(body).toContain('Мой комментарий');
		expect(body).toContain('Комментарий коллеги');
		// Порядок добавления: сначала коллега, затем свой; удалить можно только свой
		expect(body.indexOf('Комментарий коллеги')).toBeLessThan(body.indexOf('Мой комментарий'));
		expect(body.match(/aria-label="Удалить комментарий"/g)).toHaveLength(1);
		expect(body.match(/Написать комментарий/g)).toHaveLength(3);
		expect(body).not.toContain('У второго участника своя ссылка');
		expect(body).toContain('aria-current="location"');
	});
	it('places both avatars on an agreed choice and one on each when participants disagree', () => {
		const { body } = render(ReconciliationWorkspace, {
			props: {
				data: { title: review.title, items, entries: own },
				review,
				token: 'own-link'
			}
		});
		const first = body.split('id="review-item-1"')[1].split('id="review-item-2"')[0];
		const second = body.split('id="review-item-2"')[1].split('id="review-item-3"')[0];
		expect(first.match(/aria-label="Выбрали этот вариант"/g)).toHaveLength(1);
		expect(first).toContain('title="Анна (вы)"');
		expect(first).toContain('title="Михаил"');
		expect(second.match(/aria-label="Выбрали этот вариант"/g)).toHaveLength(2);
	});
});
