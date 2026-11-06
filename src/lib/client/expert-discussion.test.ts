import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExpertDiscussion } from './expert-discussion.svelte';
import type { ExpertDiscussion } from '#lib/data/translation-expert.js';

function storage(): Storage {
	const rows = new Map<string, string>();
	return { get length() { return rows.size; }, clear: () => rows.clear(), key: (index) => [...rows.keys()][index] ?? null,
		getItem: (key) => rows.get(key) ?? null, setItem: (key, value) => { rows.set(key, value); }, removeItem: (key) => { rows.delete(key); } };
}
const initial = (): ExpertDiscussion => ({ id: 42, slot: 2, profiles: { 1: { name: 'Андрей', avatar: '/admin.png' }, 2: { name: 'Елена', avatar: '' } }, comments: [] });
const make = (data = initial()) => createExpertDiscussion(data, '/translate/own', new Set(['1', '2']), vi.fn());
beforeEach(() => {
	vi.stubGlobal('localStorage', storage());
	vi.stubGlobal('document', { visibilityState: 'visible' });
	vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
		const body = JSON.parse(String(init?.body));
		return Response.json({ ok: true, comment: { id: body.id, slot: 2, itemKey: body.itemKey, body: body.body } });
	}));
});
afterEach(() => vi.unstubAllGlobals());

describe('expert discussion drafts and requests', () => {
	it('preserves text typed while sending instead of clearing the newer draft', async () => {
		let finish!: (response: Response) => void;
		vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
		const chat = make();
		chat.setDraft('1', 'Начало');
		const sending = chat.send('1');
		const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
		chat.setDraft('1', 'Начало и дополнение');
		finish(Response.json({ ok: true, comment: { ...request, slot: 2 } }));
		await sending;
		expect(chat.drafts['1']).toBe('Начало и дополнение');
		expect(chat.comments[0].body).toBe('Начало');
		expect(localStorage.getItem('translate-expert-draft:42:2:1')).toContain('дополнение');
	});
	it('retries a failed send with the same identifier and preserves the text until confirmation', async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
		const chat = make();
		chat.setDraft('1', 'Текст');
		await chat.send('1');
		expect(chat.drafts['1']).toBe('Текст');
		expect(chat.errors['1']).toBeTruthy();
		await chat.send('1');
		const requests = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
		expect(requests[0].id).toBe(requests[1].id);
		expect(chat.drafts['1']).toBe('');
		expect(chat.comments).toHaveLength(1);
	});
	it('keeps a storage failure of one item visible after successfully backing up another', () => {
		const original = localStorage.setItem.bind(localStorage);
		vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => { if (key.endsWith(':1')) throw new Error('quota'); original(key, value); });
		const chat = make();
		chat.setDraft('1', 'Без копии');
		chat.setDraft('2', 'С копией');
		expect(chat.atRisk).toBe(true);
		chat.setDraft('1', '');
		expect(chat.atRisk).toBe(false);
	});
	it('does not restore an old state response over a comment that was just sent', async () => {
		let finish!: (response: Response) => void;
		vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
		const chat = make();
		const refreshing = chat.refresh();
		chat.setDraft('1', 'Новое сообщение');
		await chat.send('1');
		finish(Response.json({ discussion: initial(), entries: {} }));
		await refreshing;
		expect(chat.comments.map((comment) => comment.body)).toEqual(['Новое сообщение']);
	});
	it('allows deletion of your own messages through confirmation only', async () => {
		const data = initial();
		data.comments = [{ id: 'a', slot: 1, itemKey: '1', body: 'Чужой' }, { id: 'b', slot: 2, itemKey: '1', body: 'Свой' }];
		const chat = make(data);
		chat.askDelete(data.comments[0]);
		expect(chat.pendingDelete).toBeNull();
		chat.askDelete(data.comments[1]);
		expect(chat.comments).toHaveLength(2);
		await chat.confirmDelete();
		expect(chat.comments.map((comment) => comment.body)).toEqual(['Чужой']);
	});
});
