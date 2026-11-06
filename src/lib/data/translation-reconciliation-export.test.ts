import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyTranslationEntry, type TranslationItem } from './translation';
import { parseSecondTranslation, type AdminReconciliation } from './translation-reconciliation';
import { exportReconciledMarkdown } from './translation-reconciliation-export';
import { reviewOptionOrder } from './translation-review-order';

const sql = readFileSync('drizzle/0024_translation_docs.sql', 'utf8');
const items: TranslationItem[] = JSON.parse(sql.match(/\$tr\$(\[[\s\S]*?\])\$tr\$/)![1]);
const markdown = readFileSync('src/lib/data/translation-second.md', 'utf8');
const variant = parseSecondTranslation(markdown, items);

function review(): AdminReconciliation {
	return {
		id: 1,
		title: 'Общий перевод',
		finalDocId: 4,
		items,
		variantA: variant,
		variantB: variant,
		finalEntries: {},
		comments: [],
		participants: [1, 2].map((slot) => ({
			slot,
			docId: slot + 1,
			token: 'test',
			profile: { name: `Участник ${slot}`, avatar: '' },
			entries: Object.fromEntries(
				items.map((item) => [item.key, { ...emptyTranslationEntry(), translation: 'a' }])
			)
		}))
	};
}

describe('reconciled Markdown export and import', () => {
	it('exports the visible variant number while resolving the stored choice to its original text', () => {
		const source = review();
		const key = items.find((item) => reviewOptionOrder(source.id, item.key)[0] === 'b')!.key;
		source.comments = [
			{ id: '00000000-0000-4000-8000-000000000001', slot: 1, itemKey: key, body: 'Слева лучше' }
		];
		source.participants[0].entries[key].translation = 'b';
		source.participants[1].entries[key].translation = 'b';
		source.variantB = { ...variant, [key]: 'Текст второго исходного перевода' };
		const exported = exportReconciledMarkdown(source, {});
		expect(exported).toContain('Вариант 1: Слева лучше');
		expect(parseSecondTranslation(exported, items)[key]).toBe('Текст второго исходного перевода');
	});
	it('round-trips all 37 translations and includes both participant comments and final comments', () => {
		const source = review();
		source.comments = [
			{
				id: '00000000-0000-4000-8000-000000000001',
				slot: 1,
				itemKey: '1',
				body: 'Первый комментарий | с разделителем'
			},
			{
				id: '00000000-0000-4000-8000-000000000002',
				slot: 2,
				itemKey: '1',
				body: 'Второй комментарий\nС новой строки'
			},
			{
				id: '00000000-0000-4000-8000-000000000003',
				slot: 1,
				itemKey: '1',
				body: 'Ещё одно уточнение'
			}
		];
		const finalText = 'Общая формулировка | с переносом\n<b>буквальный текст</b> & символ';
		const final = {
			'1': {
				...emptyTranslationEntry(),
				translation: finalText,
				comment: 'Комментарий к итогу </script>'
			}
		};
		const exported = exportReconciledMarkdown(source, final);
		expect(exported).toContain('Первый комментарий');
		expect(exported).toContain('Второй комментарий');
		// Несколько комментариев участника в одной ячейке, по порядку добавления
		expect(exported).toContain('Первый комментарий \\| с разделителем<br>Ещё одно уточнение');
		expect(exported).toContain('Комментарий к итогу &lt;/script&gt;');
		expect(exported).not.toContain('<b>');
		expect(parseSecondTranslation(exported, items)).toEqual({ ...variant, '1': finalText });
	});
	it('does not export a partial result', () => {
		const source = review();
		source.participants[1].entries = {};
		expect(() => exportReconciledMarkdown(source, {})).toThrow('все пункты');
	});
	it('reports extra prose instead of silently discarding it during Markdown import', () => {
		expect(() =>
			parseSecondTranslation(markdown + '\n\nВажная сноска после таблицы', items)
		).toThrow('Текст после таблицы');
	});
	it('rejects unsupported three-column translation tables explicitly', () => {
		expect(() =>
			parseSecondTranslation(
				markdown.replace('| № | Утверждение |', '| № | Утверждение | Примечание |'),
				items
			)
		).toThrow('две колонки');
	});
});
