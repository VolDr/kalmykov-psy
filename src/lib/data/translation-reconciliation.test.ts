import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	parseSecondTranslation,
	reconciliationText,
	validateVariant
} from './translation-reconciliation';
import { emptyTranslationEntry, type TranslationItem } from './translation';

const sql = readFileSync('drizzle/0024_translation_docs.sql', 'utf8');
const items: TranslationItem[] = JSON.parse(sql.match(/\$tr\$(\[[\s\S]*?\])\$tr\$/)![1]);
const markdown = readFileSync('src/lib/data/translation-second.md', 'utf8');

describe('second translation import', () => {
	it('maps all 37 parts from the supplied Markdown to their exact source keys', () => {
		const variant = parseSecondTranslation(markdown, items);
		expect(Object.keys(variant)).toHaveLength(37);
		expect(variant.instruction).toBe(
			'Отметьте, насколько вы согласны или не согласны с каждым из следующих утверждений.'
		);
		expect(variant.option1).toBe('Совершенно не согласен');
		expect(variant.option6).toBe('Полностью согласен');
		expect(variant['1']).toContain('Я обычно не берусь');
		expect(variant['30']).toContain('Когда я занимаюсь важным делом');
	});
	it('preserves punctuation and accepts BOM and Windows line endings', () => {
		expect(
			parseSecondTranslation('\uFEFF' + markdown.replace(/\r?\n/g, '\r\n'), items)['8']
		).toContain('Счастье –');
	});
	it('rejects duplicates, missing rows, unknown keys and empty translations', () => {
		expect(() => parseSecondTranslation(markdown + '\n| 1 | duplicate |', items)).toThrow('дважды');
		expect(() => parseSecondTranslation(markdown.replace(/^\| 30 \|.*$/m, ''), items)).toThrow(
			'Пункт 30'
		);
		expect(() => parseSecondTranslation(markdown + '\n| 31 | unexpected |', items)).toThrow('31');
		expect(() =>
			parseSecondTranslation(markdown.replace(/^\| 30 \|.*$/m, '| 30 | |'), items)
		).toThrow('непустой');
	});
	it('accepts a keyed JSON import and rejects inherited or oversized values', () => {
		const variant = parseSecondTranslation(markdown, items);
		expect(parseSecondTranslation(JSON.stringify(variant), items)).toEqual(variant);
		expect(() => validateVariant({ ...variant, '1': 'a'.repeat(5001) }, items)).toThrow('5000');
		const inherited = Object.create(variant);
		expect(() => validateVariant(inherited, items)).toThrow('Не хватает');
	});
	it('does not treat Markdown HTML as markup', () => {
		const variant = parseSecondTranslation(
			markdown.replace('Полностью согласен', '<img src=x onerror=alert(1)>'),
			items
		);
		expect(variant.option6).toBe('<img src=x onerror=alert(1)>');
	});
});

describe('unified translation', () => {
	const a = { '1': 'First' },
		b = { '1': 'Second' };
	const vote = (choice: string) => ({ '1': { ...emptyTranslationEntry(), translation: choice } });
	it('agrees only when both participants made the same choice', () => {
		expect(reconciliationText('1', a, b, vote('a'), vote('a'), {})).toEqual({
			text: 'First',
			status: 'agreed'
		});
		expect(reconciliationText('1', a, b, vote('b'), vote('b'), {})).toEqual({
			text: 'Second',
			status: 'agreed'
		});
		expect(reconciliationText('1', a, b, vote('a'), {}, {}).status).toBe('pending');
		expect(reconciliationText('1', a, b, vote('a'), vote('b'), {}).status).toBe('disagreed');
	});
	it('keeps an explicit administrator decision and allows returning to automatic agreement', () => {
		expect(reconciliationText('1', a, b, vote('a'), vote('b'), vote('Custom'))).toEqual({
			text: 'Custom',
			status: 'manual'
		});
		expect(reconciliationText('1', a, b, vote('b'), vote('b'), vote(''))).toEqual({
			text: 'Second',
			status: 'agreed'
		});
	});
	it('treats identical wording as agreement even if participants chose different variant labels', () => {
		expect(reconciliationText('1', a, a, vote('a'), vote('b'), {})).toEqual({
			text: 'First',
			status: 'agreed'
		});
	});
});
