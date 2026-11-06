import { describe, expect, it } from 'vitest';
import { withFinalPeriod } from './translation-review-text';

describe('withFinalPeriod', () => {
	it('adds a period to an unfinished phrase', () => {
		expect(withFinalPeriod('Совершенно не согласен')).toBe('Совершенно не согласен.');
		expect(withFinalPeriod('Мне сложно понять, что я чувствую  ')).toBe(
			'Мне сложно понять, что я чувствую.'
		);
	});
	it('puts the period after closing quotes and brackets', () => {
		expect(withFinalPeriod('Я «не пускаю» их в сознание»')).toBe('Я «не пускаю» их в сознание».');
		expect(withFinalPeriod('Ответ (иногда)')).toBe('Ответ (иногда).');
	});
	it('keeps text that already ends a sentence', () => {
		for (const text of [
			'Готово.',
			'Правда?',
			'Да!',
			'И так далее…',
			'Ответьте:',
			'Он сказал «нет».',
			'Он спросил: «Почему?»',
			'(см. выше.)'
		])
			expect(withFinalPeriod(text)).toBe(text);
	});
	it('leaves empty text alone', () => {
		expect(withFinalPeriod('')).toBe('');
		expect(withFinalPeriod('   ')).toBe('   ');
	});
});
