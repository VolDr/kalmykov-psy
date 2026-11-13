import { describe, expect, it } from 'vitest';
import { mzq15Domains, mzq15Questions, scoreMzq15 } from './mzq15.js';

describe('MZQ-15 — agreed translation and scores', () => {
	it('preserves all 15 statements and the four original subscale sizes', () => {
		expect(mzq15Questions).toHaveLength(15);
		expect(mzq15Domains.map((group) => group.questionIds.length)).toEqual([4, 4, 4, 3]);
		expect(new Set(mzq15Domains.flatMap((group) => group.questionIds)).size).toBe(15);
		expect(mzq15Questions[0].text).toBe('Большую часть времени мне не хочется делиться с другими людьми своими мыслями и чувствами.');
		expect(mzq15Questions[14].text).toBe('Иногда мои чувства представляют для меня опасность.');
	});

	it('does not score unanswered or invalid questionnaires', () => {
		expect(scoreMzq15({})).toBeNull();
		expect(scoreMzq15(Object.fromEntries(mzq15Questions.map((q) => [q.id, 0])))).toBeNull();
		expect(scoreMzq15(Object.fromEntries(mzq15Questions.map((q) => [q.id, 6])))).toBeNull();
	});

	it('scores raw agreement 1 to 5 without hidden inversion', () => {
		const low = scoreMzq15(Object.fromEntries(mzq15Questions.map((q) => [q.id, 1])));
		const high = scoreMzq15(Object.fromEntries(mzq15Questions.map((q) => [q.id, 5])));
		expect(low?.total).toBe(15);
		expect(low?.mean).toBe(1);
		expect(high?.total).toBe(75);
		expect(high?.mean).toBe(5);
		expect(high?.subscales.map((scale) => scale.value)).toEqual([5, 5, 5, 5]);
	});

	it('calculates four subscale means from the assigned items', () => {
		const answers = Object.fromEntries(mzq15Questions.map((q) => [q.id, 1]));
		for (const id of ['q1', 'q2', 'q3', 'q4']) answers[id] = 4;
		for (const id of ['q5', 'q6', 'q7', 'q8']) answers[id] = 3;
		for (const id of ['q9', 'q10', 'q11', 'q12']) answers[id] = 2;
		const score = scoreMzq15(answers);
		expect(score?.subscales.map((scale) => scale.value)).toEqual([4, 3, 2, 1]);
		expect(score?.total).toBe(39);
	});
});
