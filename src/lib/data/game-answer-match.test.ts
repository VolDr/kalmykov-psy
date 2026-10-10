import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, normalizeAnswer } from './game-answer-match';

describe('isAnswerCorrect', () => {
	it('не различает регистр, ё/е, знаки и пробелы', () => {
		expect(normalizeAnswer('  Ёлка,  НОВОГОДНЯЯ! ')).toBe('елка новогодняя');
		expect(isAnswerCorrect('канберра', ['Канберра'])).toBe(true);
		expect(isAnswerCorrect('Санкт - Петербург', ['Санкт-Петербург'])).toBe(true);
	});

	it('засчитывает любое из написаний', () => {
		expect(isAnswerCorrect('Canberra', ['Канберра', 'Canberra'])).toBe(true);
	});

	it('прощает одну опечатку только в длинных ответах', () => {
		expect(isAnswerCorrect('Канбера', ['Канберра'])).toBe(true);
		expect(isAnswerCorrect('Канберрра', ['Канберра'])).toBe(true);
		expect(isAnswerCorrect('Канборра', ['Канберра'])).toBe(true);
		expect(isAnswerCorrect('Канбрра', ['Канберра'])).toBe(true);
		expect(isAnswerCorrect('Крым', ['Рим'])).toBe(false);
		expect(isAnswerCorrect('Рин', ['Рим'])).toBe(false);
		expect(isAnswerCorrect('Кабера', ['Канберра'])).toBe(false);
	});

	it('пустой ввод не засчитывается', () => {
		expect(isAnswerCorrect('  !! ', ['Рим'])).toBe(false);
	});

	it('не путает ответы, где знаки меняют смысл', () => {
		expect(isAnswerCorrect('C#', ['C++'])).toBe(false);
		expect(isAnswerCorrect('c++', ['C++'])).toBe(true);
		expect(isAnswerCorrect('5', ['-5'])).toBe(false);
		expect(isAnswerCorrect('-5', ['-5'])).toBe(true);
		expect(isAnswerCorrect('Санкт - Петербург', ['Санкт-Петербург'])).toBe(true);
	});

	it('не прощает опечатки в числах', () => {
		expect(isAnswerCorrect('1000001', ['1000000'])).toBe(false);
		expect(isAnswerCorrect('1 000 000', ['1000000'])).toBe(false);
		expect(isAnswerCorrect('1000000', ['1000000'])).toBe(true);
		expect(isAnswerCorrect('Апполо 11', ['Аполло 11'])).toBe(false);
	});
});
