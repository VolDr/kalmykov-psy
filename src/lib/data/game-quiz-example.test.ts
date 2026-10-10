import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseQuizJson } from './game-quiz-json';

/**
 * Пример из docs/game-quiz-example.json отдаётся как образец для генерации викторин,
 * поэтому он обязан проходить настоящий разбор и показывать все возможности.
 */
describe('docs/game-quiz-example.json', () => {
	const result = parseQuizJson(readFileSync('docs/game-quiz-example.json', 'utf-8'));

	it('проходит разбор без ошибок', () => {
		expect(result.ok, result.ok ? '' : result.error).toBe(true);
	});

	it('показывает все типы вопросов и необязательные поля', () => {
		const questions = result.ok ? result.questions : [];
		const types = new Set(questions.map((q) => q.type ?? 'choice'));
		expect(types).toEqual(new Set(['choice', 'multi', 'text']));
		expect(questions.some((q) => q.image?.startsWith('https://'))).toBe(true);
		expect(questions.some((q) => q.image?.startsWith('/'))).toBe(true);
		expect(questions.some((q) => q.explanation)).toBe(true);
		expect(questions.some((q) => !q.image && !q.explanation)).toBe(true);
	});
});
