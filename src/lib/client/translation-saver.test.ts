import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTranslationSaver, TRANSLATION_TIMEOUT_MS } from './translation-saver.svelte';
import {
	TRANSLATION_BATCH_BYTES,
	emptyTranslationEntry,
	type TranslationChange,
	type TranslationSaveResult
} from '../data/translation';

class MemoryStorage {
	data = new Map<string, string>();
	get length() {
		return this.data.size;
	}
	key(index: number) {
		return [...this.data.keys()][index] ?? null;
	}
	getItem(key: string) {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.data.set(key, value);
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
}

let storage: MemoryStorage;
let values: Map<string, { value: string; version: number }>;
let receipts: Map<string, TranslationSaveResult>;
const fieldId = (change: TranslationChange) => `${change.key}:${change.field}`;
const changesOf = (init?: RequestInit): TranslationChange[] =>
	JSON.parse(String(init?.body)).changes;

function server(init?: RequestInit) {
	const results = changesOf(init).map((change): TranslationSaveResult => {
		const previous = receipts.get(change.operationId);
		const current = values.get(fieldId(change)) ?? { value: '', version: 0 };
		if (previous)
			return previous.version === current.version
				? previous
				: { ...change, ...current, status: 'conflict' };
		if (current.version !== change.expectedVersion)
			return { ...change, ...current, status: 'conflict' };
		const receipt: TranslationSaveResult = {
			...change,
			status: 'saved',
			version: current.version + 1
		};
		values.set(fieldId(change), { value: receipt.value, version: receipt.version });
		receipts.set(change.operationId, receipt);
		return receipt;
	});
	const conflict = results.some((result) => result.status === 'conflict');
	return Response.json({ ok: !conflict, results }, { status: conflict ? 409 : 200 });
}

beforeEach(() => {
	vi.useFakeTimers();
	storage = new MemoryStorage();
	values = new Map();
	receipts = new Map();
	vi.stubGlobal('localStorage', storage);
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url, init) => server(init))
	);
});
afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('translation autosave recovery', () => {
	it('serializes pagehide and rebases typing made during a request', async () => {
		let finish!: () => void;
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockImplementationOnce(
			(_url, init) =>
				new Promise((resolve) => {
					finish = () => resolve(server(init));
				})
		);
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'old');
		const first = saver.flush();
		saver.queue('1', 'translation', 'new');
		saver.flushOnLeave();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		finish();
		await first;
		await saver.flush();
		expect(changesOf(fetchMock.mock.calls[1][1])[0].expectedVersion).toBe(1);
		expect(values.get('1:translation')?.value).toBe('new');
		expect(saver.unsyncedCount).toBe(0);
		expect(storage.length).toBe(0);
	});

	it('settles a successful pagehide save and does not leave a replayable draft', async () => {
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'text');
		saver.flushOnLeave();
		await vi.runAllTimersAsync();
		expect(saver.status).toBe('saved');
		expect(storage.length).toBe(0);
	});

	it('replays the same operation after a lost response without overwriting a newer edit', async () => {
		vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
			server(init);
			throw new TypeError('lost response');
		});
		const first = createTranslationSaver('/save', 'draft');
		first.queue('1', 'translation', 'A');
		await first.flush();
		first.dispose();
		values.set('1:translation', { value: 'newer B', version: 2 });
		const reopened = createTranslationSaver('/save', 'draft', {
			'1': { ...emptyTranslationEntry(), translation: 'newer B', translationVersion: 2 }
		});
		reopened.restore(() => true);
		await reopened.flush();
		expect(values.get('1:translation')).toEqual({ value: 'newer B', version: 2 });
		expect(reopened.conflicts[0]).toMatchObject({ localValue: 'A', serverValue: 'newer B' });
		reopened.resolveConflict(reopened.conflicts[0].operationId, 'server');
		expect(reopened.unsyncedCount).toBe(0);
		expect(storage.length).toBe(0);
	});

	it('keeps conflicting drafts from another tab and requires an explicit decision', async () => {
		const a = createTranslationSaver('/save', 'draft');
		const b = createTranslationSaver('/save', 'draft');
		a.queue('1', 'translation', 'A');
		b.queue('1', 'translation', 'B');
		expect(storage.length).toBe(2);
		await a.flush();
		await b.flush();
		expect(b.conflicts[0]).toMatchObject({ localValue: 'B', serverValue: 'A' });
		expect(b.unsyncedCount).toBe(1);
		b.resolveConflict(b.conflicts[0].operationId, 'local');
		await b.flush();
		expect(values.get('1:translation')?.value).toBe('B');
		expect(b.unsyncedCount).toBe(0);
	});

	it('keeps the newest typing when an in-flight save conflicts', async () => {
		values.set('1:translation', { value: 'server', version: 1 });
		let finish!: () => void;
		vi.mocked(fetch).mockImplementationOnce(
			(_url, init) =>
				new Promise((resolve) => {
					finish = () => resolve(server(init));
				})
		);
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'old local');
		const saving = saver.flush();
		saver.queue('1', 'translation', 'new local');
		finish();
		await saving;
		expect(saver.conflicts).toHaveLength(1);
		expect(saver.conflicts[0].localValue).toBe('new local');
		saver.resolveConflict(saver.conflicts[0].operationId, 'server');
		expect(saver.unsyncedCount).toBe(0);
		expect(storage.length).toBe(0);
	});

	it('never sends a legacy draft without a known version automatically', async () => {
		storage.setItem('draft', JSON.stringify([{ key: '1', field: 'translation', value: 'legacy' }]));
		const saver = createTranslationSaver('/save', 'draft', {
			'1': { ...emptyTranslationEntry(), translation: 'fresh', translationVersion: 3 }
		});
		saver.restore(() => true);
		await saver.flush();
		expect(fetch).not.toHaveBeenCalled();
		expect(saver.conflicts[0]).toMatchObject({ localValue: 'legacy', serverValue: 'fresh' });
		expect(storage.getItem('draft')).toBeNull();
		expect(storage.length).toBe(1);
	});

	it('restores an interrupted parent/child chain in order', async () => {
		vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
		const first = createTranslationSaver('/save', 'draft');
		first.queue('1', 'translation', 'parent');
		void first.flush();
		first.queue('1', 'translation', 'child');
		first.dispose();
		const reopened = createTranslationSaver('/save', 'draft');
		reopened.restore(() => true);
		await reopened.flush();
		await reopened.flush();
		expect(values.get('1:translation')?.value).toBe('child');
		expect(reopened.unsyncedCount).toBe(0);
	});
});

describe('translation request failures', () => {
	it('settles accepted fields even when another field in the same request conflicts', async () => {
		values.set('1:translation', { value: 'fresh', version: 1 });
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'stale');
		saver.queue('2', 'comment', 'accepted');
		await saver.flush();
		expect(values.get('2:comment')?.value).toBe('accepted');
		expect(saver.unsyncedCount).toBe(1);
		expect(saver.conflicts).toHaveLength(1);
		expect(storage.length).toBe(1);
	});

	it('times out reading an unfinished response body as well as waiting for headers', async () => {
		const saver = createTranslationSaver('/save', 'draft');
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(new ReadableStream({ start() {} }), { status: 200 })
		);
		saver.queue('1', 'translation', 'text');
		const saving = saver.flush();
		await vi.advanceTimersByTimeAsync(TRANSLATION_TIMEOUT_MS);
		await saving;
		expect(saver.status).toBe('error');
		expect(saver.unsyncedCount).toBe(1);
		await saver.flush();
		expect(saver.status).toBe('saved');
	});

	it('stops automatic retries for a revoked link and keeps the draft', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: 'gone' }, { status: 404 }));
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'text');
		await saver.flush();
		await vi.runAllTimersAsync();
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(saver.linkGone).toBe(true);
		expect(storage.length).toBe(1);
	});

	it('preserves a damaged legacy backup for manual recovery', () => {
		storage.setItem('draft', '[broken json');
		const saver = createTranslationSaver('/save', 'draft');
		saver.restore(() => true);
		expect(storage.getItem('draft')).toBe('[broken json');
	});
	it('times out a hung fetch and retries the same operation before newer changes', async () => {
		vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'first');
		const hung = saver.flush();
		saver.queue('1', 'translation', 'second');
		await vi.advanceTimersByTimeAsync(TRANSLATION_TIMEOUT_MS);
		await hung;
		expect(saver.status).toBe('error');
		expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
		await saver.flush();
		expect(changesOf(vi.mocked(fetch).mock.calls[1][1])[0].operationId).toBe(
			changesOf(vi.mocked(fetch).mock.calls[0][1])[0].operationId
		);
		await saver.flush();
		expect(values.get('1:translation')?.value).toBe('second');
	});

	it('batches Unicode by encoded size and keeps every request below the keepalive budget', async () => {
		const saver = createTranslationSaver('/save', 'draft');
		for (let i = 0; i < 10; i++) saver.queue(String(i), 'translation', '漢'.repeat(5000));
		await vi.runAllTimersAsync();
		for (const [, init] of vi.mocked(fetch).mock.calls) {
			expect(new Blob([String(init?.body)]).size).toBeLessThanOrEqual(TRANSLATION_BATCH_BYTES);
			expect(changesOf(init).length).toBeLessThanOrEqual(10);
		}
		expect(values.size).toBe(10);
		expect(storage.length).toBe(0);
	});

	it('splits 413 batches and retains a singleton rejected by the server', async () => {
		vi.mocked(fetch).mockImplementation(async (_url, init) =>
			changesOf(init).length > 2
				? Response.json({ error: 'too large' }, { status: 413 })
				: server(init)
		);
		const saver = createTranslationSaver('/save', 'draft');
		for (let i = 0; i < 10; i++) saver.queue(String(i), 'translation', 'text');
		await vi.runAllTimersAsync();
		expect(values.size).toBe(10);
		expect(saver.unsyncedCount).toBe(0);
		vi.mocked(fetch).mockResolvedValue(Response.json({ error: 'too large' }, { status: 413 }));
		saver.queue('11', 'translation', 'keep this');
		await saver.flush();
		expect(saver.unsyncedCount).toBe(1);
		expect(storage.length).toBe(1);
		expect(saver.paused).toBe(true);
	});

	it('preserves 400 drafts, pauses retries, and resumes after the user corrects the text', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			Response.json({ error: 'invalid text' }, { status: 400 })
		);
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'bad');
		await saver.flush();
		await vi.runAllTimersAsync();
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(saver.unsyncedCount).toBe(1);
		expect(storage.length).toBe(1);
		saver.queue('1', 'translation', 'corrected');
		await saver.flush();
		expect(values.get('1:translation')?.value).toBe('corrected');
		expect(storage.length).toBe(0);
	});

	it('warns when browser storage fails, while still allowing server saves', async () => {
		vi.spyOn(storage, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'text');
		expect(saver.atRisk).toBe(true);
		await saver.flush();
		expect(saver.unsyncedCount).toBe(0);
		expect(saver.atRisk).toBe(false);
	});

	it('coalesces typing when storage fills up and retains the last successful backup', async () => {
		const saver = createTranslationSaver('/save', 'draft');
		saver.queue('1', 'translation', 'backed up');
		vi.spyOn(storage, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});
		saver.queue('1', 'translation', 'intermediate');
		saver.queue('1', 'translation', 'newest');
		expect(saver.unsyncedCount).toBe(1);
		expect(saver.atRisk).toBe(true);
		expect(storage.length).toBe(1);
		await saver.flush();
		expect(changesOf(vi.mocked(fetch).mock.calls[0][1])[0].value).toBe('newest');
		expect(values.get('1:translation')?.value).toBe('newest');
		expect(storage.length).toBe(0);
		expect(saver.conflicts).toHaveLength(0);
	});
});
