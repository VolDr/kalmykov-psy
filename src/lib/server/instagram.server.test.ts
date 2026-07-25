import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { INSTAGRAM_ACCESS_TOKEN: 'test-token' } }));
vi.mock('../..', () => ({ db: {} }));

import { findMatchingRule, ruleMatchesText, type InstagramRule } from './instagram.server';

function makeRule(overrides: Partial<InstagramRule> = {}): InstagramRule {
	return {
		id: 1,
		name: 'Тест',
		triggerType: 'comment',
		keywords: ['фокус'],
		matchExact: false,
		mediaId: null,
		commentReplyText: 'Ответил в директ!',
		dmText: 'Держи гайд',
		enabled: true,
		hits: 0,
		lastHitAt: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides
	};
}

describe('ruleMatchesText', () => {
	it('находит ключевое слово внутри текста без учёта регистра', () => {
		const rule = makeRule({ keywords: ['Фокус'] });
		expect(ruleMatchesText(rule, 'Хочу ФОКУС, пришлите!')).toBe(true);
	});

	it('не срабатывает, если слова нет', () => {
		expect(ruleMatchesText(makeRule(), 'Просто красивый пост')).toBe(false);
	});

	it('точное совпадение: только текст целиком (с trim и без учёта регистра)', () => {
		const rule = makeRule({ matchExact: true });
		expect(ruleMatchesText(rule, '  Фокус ')).toBe(true);
		expect(ruleMatchesText(rule, 'хочу фокус')).toBe(false);
	});

	it('срабатывает на любое из нескольких слов', () => {
		const rule = makeRule({ keywords: ['гайд', 'фокус'] });
		expect(ruleMatchesText(rule, 'пришлите гайд')).toBe(true);
	});

	it('пустой текст и пустые ключевые слова не матчатся', () => {
		expect(ruleMatchesText(makeRule(), '')).toBe(false);
		expect(ruleMatchesText(makeRule({ keywords: [] }), 'фокус')).toBe(false);
		expect(ruleMatchesText(makeRule({ keywords: [' '] }), 'фокус')).toBe(false);
	});
});

describe('findMatchingRule', () => {
	it('возвращает первое подходящее правило', () => {
		const rules = [
			makeRule({ id: 1, keywords: ['гайд'] }),
			makeRule({ id: 2, keywords: ['фокус'] }),
			makeRule({ id: 3, keywords: ['фокус'] })
		];
		expect(findMatchingRule(rules, 'хочу фокус')?.id).toBe(2);
	});

	it('правило с mediaId срабатывает только на своём посте', () => {
		const rules = [makeRule({ mediaId: 'media-1' })];
		expect(findMatchingRule(rules, 'фокус', 'media-2')).toBeNull();
		expect(findMatchingRule(rules, 'фокус', 'media-1')?.id).toBe(1);
		// Комментарий без media id (нет в payload) не должен матчить пост-специфичное правило
		expect(findMatchingRule(rules, 'фокус', null)).toBeNull();
	});

	it('правило без mediaId срабатывает на любом посте', () => {
		const rules = [makeRule()];
		expect(findMatchingRule(rules, 'фокус', 'media-2')?.id).toBe(1);
	});
});
