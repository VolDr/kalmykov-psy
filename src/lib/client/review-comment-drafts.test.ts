import { describe, expect, it } from 'vitest';
import {
	createReviewDraftStore,
	draftAfterSend,
	latestLegacyComments
} from './review-comment-drafts';

function memoryStorage(): Storage {
	const data = new Map<string, string>();
	return {
		get length() {
			return data.size;
		},
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (index) => [...data.keys()][index] ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => void data.set(key, String(value))
	};
}

describe('review comment drafts', () => {
	it('keeps drafts of two tabs for different items instead of overwriting each other', () => {
		const storage = memoryStorage();
		const firstTab = createReviewDraftStore('d:1:1:', () => storage);
		const secondTab = createReviewDraftStore('d:1:1:', () => storage);
		expect(firstTab.save('1', { text: 'из первой вкладки', id: 'id-1' })).toBe(true);
		secondTab.save('7', { text: 'из второй вкладки' });
		expect(firstTab.loadAll()).toEqual({
			'1': { text: 'из первой вкладки', id: 'id-1' },
			'7': { text: 'из второй вкладки' }
		});
	});

	it('reports a change of one item from another tab and its removal', () => {
		const store = createReviewDraftStore('d:1:1:', memoryStorage);
		expect(store.fromEvent({ key: 'd:1:1:7', newValue: '{"text":"новый","id":"x"}' })).toEqual({
			itemKey: '7',
			draft: { text: 'новый', id: 'x' }
		});
		expect(store.fromEvent({ key: 'd:1:1:7', newValue: null })).toEqual({
			itemKey: '7',
			draft: null
		});
		// Чужой раунд, чужой участник и посторонние ключи не затрагиваются
		expect(store.fromEvent({ key: 'd:1:2:7', newValue: '{"text":"x"}' })).toBeNull();
		expect(store.fromEvent({ key: null, newValue: null })).toBeNull();
	});

	it('removes an emptied draft and ignores damaged records', () => {
		const storage = memoryStorage();
		const store = createReviewDraftStore('d:1:1:', () => storage);
		store.save('1', { text: 'текст' });
		store.save('1', { text: '   ' });
		storage.setItem('d:1:1:2', '{broken');
		expect(store.loadAll()).toEqual({});
		expect(storage.getItem('d:1:1:1')).toBeNull();
	});

	it('says when the browser does not let it store a draft', () => {
		const broken = () => {
			throw new Error('blocked');
		};
		const store = createReviewDraftStore('d:1:1:', broken);
		expect(store.save('1', { text: 'текст' })).toBe(false);
		expect(store.loadAll()).toBeNull();
	});
});

describe('legacy comment hand-over', () => {
	it('keeps the latest edit of each comment, not the first one', () => {
		expect(
			latestLegacyComments([
				{ key: '1', field: 'comment', value: 'ранний' },
				{ key: '2', field: 'translation', value: 'a' },
				{ key: '1', field: 'comment', value: 'последний' },
				{ key: '3', field: 'comment', value: 'был' },
				{ key: '3', field: 'comment', value: '' }
			])
		).toEqual({ '1': 'последний' });
	});
});

describe('draft after a successful send', () => {
	it('clears only the text that was actually sent', () => {
		expect(draftAfterSend('Текст', 'Текст', 'Текст')).toBe('');
		expect(draftAfterSend('Текст', ' Текст ', '')).toBe('');
	});
	it('keeps text added in this tab while the request was in flight', () => {
		expect(draftAfterSend('Текст', 'Текст и ещё', 'Текст')).toBe('Текст и ещё');
	});
	it('keeps text added in another tab while this tab was sending', () => {
		expect(draftAfterSend('Текст', 'Текст', 'Текст, дописанный рядом')).toBe(
			'Текст, дописанный рядом'
		);
	});
	it('reads the latest text of the other tab from the shared storage', () => {
		const storage = memoryStorage();
		const sendingTab = createReviewDraftStore('d:1:1:', () => storage);
		const otherTab = createReviewDraftStore('d:1:1:', () => storage);
		sendingTab.save('1', { text: 'Текст', id: 'id-1' });
		otherTab.save('1', { text: 'Текст и ещё', id: 'id-1' });
		expect(draftAfterSend('Текст', 'Текст', sendingTab.load('1')?.text ?? '')).toBe('Текст и ещё');
	});
});
