import { describe, expect, it } from 'vitest';
import { expertPublicEntries, expertResultsCsv, type ExpertResult } from './translation-expert';
import { emptyTranslationEntry } from './translation';

describe('expert discussion export and legacy privacy', () => {
	it('exports the discussion and protects text beginning with spreadsheet formulas', () => {
		const expert: ExpertResult = { id: 1, personId: 1, docId: 2, token: 'private', name: 'Елена', createdAt: '', items: [{ key: '1', label: 'Пункт 1', short: '1', group: 'Пункты', source: 'Итог' }], entries: {}, comments: [{ id: '1', slot: 2, itemKey: '1', body: '=1+1' }] };
		const csv = expertResultsCsv([expert]);
		expect(csv).toContain('Елена: =1+1');
		expert.name = '=1+1';
		expect(expertResultsCsv([expert])).toContain("'=1+1");
		expect(csv).not.toContain('Как переписать');
		expect(csv).not.toContain('private');
	});
	it('does not expose the old scalar comment or rewrite alongside a deleted discussion message', () => {
		const entries = expertPublicEntries({ '1': { ...emptyTranslationEntry(), translation: 'clear', comment: 'Удалённый текст' }, '1/rewrite': { ...emptyTranslationEntry(), translation: 'Старая правка' }, '1/relevance': { ...emptyTranslationEntry(), translation: '4' } });
		expect(entries['1'].translation).toBe('clear');
		expect(entries['1/relevance'].translation).toBe('4');
		expect(JSON.stringify(entries)).not.toContain('Удалённый');
		expect(entries['1/rewrite']).toBeUndefined();
	});
});
