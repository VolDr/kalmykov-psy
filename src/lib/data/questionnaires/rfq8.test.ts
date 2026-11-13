import { describe, expect, it } from 'vitest';
import { rfq8Questions, scoreRfq8 } from './rfq8.js';

describe('RFQ-8 agreed wording and original two-scale recoding', () => {
	it('contains exactly the approved 8 items', () => {
		expect(rfq8Questions).toHaveLength(8);
		expect(rfq8Questions[0].text).toBe('Мысли других людей для меня — загадка.');
		expect(rfq8Questions[4].text).toBe('Когда я чувствую себя неуверенно, я могу вести себя так, что это вызывает у окружающих раздражение или защитную реакцию.');
		expect(rfq8Questions[7].text).toBe('Сильные чувства часто мешают мне ясно мыслить.');
	});

	it('requires all answers in the valid 1–7 interval', () => {
		expect(scoreRfq8({})).toBeNull();
		expect(scoreRfq8(Object.fromEntries(rfq8Questions.map((q) => [q.id, 0])))).toBeNull();
		expect(scoreRfq8(Object.fromEntries(rfq8Questions.map((q) => [q.id, 8])))).toBeNull();
	});

	it('uses the 6 C items and 6 U items with reverse-scored item 7', () => {
		const allOne = scoreRfq8(Object.fromEntries(rfq8Questions.map((q) => [q.id, 1])));
		const allSeven = scoreRfq8(Object.fromEntries(rfq8Questions.map((q) => [q.id, 7])));
		expect(allOne?.certainty).toBe(3);
		expect(allOne?.uncertainty).toBe(0.5);
		expect(allSeven?.certainty).toBe(0);
		expect(allSeven?.uncertainty).toBe(2.5);
	});

	it('maps neutral answers to zero for both subscales', () => {
		const neutral = scoreRfq8(Object.fromEntries(rfq8Questions.map((q) => [q.id, 4])));
		expect(neutral).toEqual({ certainty: 0, uncertainty: 0 });
	});

	it('C only draws from 1–6; U only draws from 2,4,5,6,7,8', () => {
		const baseline = Object.fromEntries(rfq8Questions.map((q) => [q.id, 4]));
		const cOnly = scoreRfq8({ ...baseline, q1: 1, q3: 1 });
		const uOnly = scoreRfq8({ ...baseline, q7: 1, q8: 7 });
		expect(cOnly).toEqual({ certainty: 1, uncertainty: 0 });
		expect(uOnly).toEqual({ certainty: 0, uncertainty: 1 });
	});
});
