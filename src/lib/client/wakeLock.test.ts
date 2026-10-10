import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from './wakeLock';

type Listener = () => void;

function setup() {
	const listeners = new Map<string, Listener>();
	const doc = {
		visibilityState: 'visible',
		addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
		removeEventListener: (type: string) => listeners.delete(type)
	};
	const request = vi.fn(async () => {
		const releaseListeners: Listener[] = [];
		return {
			release: vi.fn(async () => releaseListeners.forEach((fn) => fn())),
			addEventListener: (_: string, fn: Listener) => releaseListeners.push(fn)
		};
	});
	vi.stubGlobal('document', doc);
	vi.stubGlobal('navigator', { wakeLock: { request } });
	return { doc, request, listeners };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('createWakeLock', () => {
	beforeEach(() => vi.useRealTimers());
	afterEach(() => vi.unstubAllGlobals());

	it('запрашивает блокировку один раз, сколько ни вызывай hold', async () => {
		const { request } = setup();
		const lock = createWakeLock();
		lock.hold();
		lock.hold();
		await flush();
		expect(request).toHaveBeenCalledTimes(1);
	});

	it('запрашивает заново, когда вкладка снова видна', async () => {
		const { request, doc, listeners } = setup();
		const lock = createWakeLock();
		lock.hold();
		await flush();

		// браузер снял блокировку при сворачивании вкладки
		const first = await request.mock.results[0].value;
		await first.release();
		doc.visibilityState = 'visible';
		listeners.get('visibilitychange')?.();
		await flush();
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('после release больше не запрашивает', async () => {
		const { request, listeners } = setup();
		const lock = createWakeLock();
		lock.hold();
		await flush();
		lock.release();
		expect(listeners.has('visibilitychange')).toBe(false);
		await flush();
		expect(request).toHaveBeenCalledTimes(1);
	});

	it('не падает без поддержки API и при отказе браузера', async () => {
		vi.stubGlobal('document', {
			visibilityState: 'visible',
			addEventListener: () => {},
			removeEventListener: () => {}
		});
		vi.stubGlobal('navigator', {});
		expect(() => createWakeLock().hold()).not.toThrow();

		vi.stubGlobal('navigator', {
			wakeLock: { request: vi.fn().mockRejectedValue(new Error('denied')) }
		});
		const lock = createWakeLock();
		lock.hold();
		await flush();
		expect(() => lock.release()).not.toThrow();
	});
});
