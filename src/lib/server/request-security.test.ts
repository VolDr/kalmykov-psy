import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ consume: vi.fn(), session: vi.fn(), cleanup: vi.fn() }));
vi.mock('$app/env', () => ({ dev: true, building: false }));
vi.mock('#lib/server/auth.server.js', () => ({ getSession: mocks.session }));
vi.mock('#lib/server/booking.server.js', () => ({ releaseExpiredLocks: mocks.cleanup }));
vi.mock('#lib/server/robokassa.server.js', () => ({ releaseExpiredPayments: mocks.cleanup }));
vi.mock('./request-limits.server', async (load) => {
	const actual = await load<typeof import('./request-limits.server')>();
	return { ...actual, consumeLimit: mocks.consume };
});
vi.mock('../../index', () => ({ db: {} }));

import { handle } from '../../hooks.server';
import { protectRequest } from './request-security.server';

function event(path: string, method = 'GET', body?: string, route = path) {
	const url = new URL(path, 'https://kalmykov-psy.ru');
	return {
		url,
		route: { id: route },
		locals: { user: null },
		cookies: { get: () => undefined },
		request: new Request(url, { method, ...(body === undefined ? {} : { body }) }),
		getClientAddress: () => '192.0.2.1'
	} as any;
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.session.mockReturnValue(null);
	mocks.cleanup.mockResolvedValue(0);
	mocks.consume.mockResolvedValue({ allowed: true, retryAfter: 60 });
});

describe('central administrative guard', () => {
	it.each([
		['/admin', 'GET', '/admin'],
		['/admin/articles?/save', 'POST', '/admin/articles'],
		[
			'/admin/manage-records/__data.json?x-sveltekit-invalidated=001',
			'GET',
			'/admin/manage-records'
		],
		['/%61dmin/edit-profile?/deleteContact', 'POST', '/admin/edit-profile']
	])('rejects %s before resolving or starting cleanup', async (path, method, route) => {
		const resolve = vi.fn();
		await expect(
			handle({
				event: event(path, method, method === 'POST' ? 'id=fake' : undefined, route),
				resolve
			} as any)
		).rejects.toMatchObject({ status: 404 });
		expect(resolve).not.toHaveBeenCalled();
		expect(mocks.cleanup).not.toHaveBeenCalled();
	});
	it('allows an authenticated administrator and disables caching even for a file-like path', async () => {
		mocks.session.mockReturnValue({ username: 'admin' });
		const resolve = vi.fn(async () => new Response('private'));
		const result = await handle({ event: event('/admin/report.svg'), resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(result.headers.get('cache-control')).toBe('private, no-store');
		expect(result.headers.get('vary')).toContain('Cookie');
	});
	it('does not mistake an unrelated /administrator path for the admin segment', async () => {
		const resolve = vi.fn(async () => new Response('public'));
		expect((await handle({ event: event('/administrator'), resolve } as any)).status).toBe(200);
	});
});

describe('public request budgets', () => {
	it.each([
		'/api/subscribe',
		'/api/analytics',
		'/api/quiz-results',
		'/api/lm-progress',
		'/api/booking',
		'/api/booking/acquaintance',
		'/api/pay',
		'/useful/burnout-questionnaire'
	])('blocks %s before the handler', async (path) => {
		mocks.consume.mockResolvedValue({ allowed: false, retryAfter: 37 });
		const resolve = vi.fn();
		const response = await handle({ event: event(path, 'POST', '{}'), resolve } as any);
		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('37');
		expect(resolve).not.toHaveBeenCalled();
	});
	it('preserves the body for an allowed request', async () => {
		const e = event('/api/analytics', 'POST', '{"goal":"opened"}');
		expect(await protectRequest(e)).toBeNull();
		expect(await e.request.json()).toEqual({ goal: 'opened' });
	});
	it('fails closed if shared storage is unavailable', async () => {
		mocks.consume.mockRejectedValue(new Error('database unavailable'));
		expect((await protectRequest(event('/api/subscribe', 'POST', '{}')))?.status).toBe(503);
	});
	it('uses the resolved route for encoded public paths too', async () => {
		mocks.consume.mockResolvedValue({ allowed: false, retryAfter: 60 });
		const e = event('/api/%73ubscribe', 'POST', '{}', '/api/subscribe');
		expect((await protectRequest(e))?.status).toBe(429);
	});
	it('does not require the framework request property to be writable', async () => {
		const e = event('/api/analytics', 'POST', '{"goal":"opened"}');
		const request = e.request;
		Object.defineProperty(e, 'request', { get: () => request });
		expect(await protectRequest(e)).toBeNull();
		expect(await e.request.json()).toEqual({ goal: 'opened' });
	});
	it('rejects an oversized streamed request without a Content-Length', async () => {
		const e = event('/api/subscribe', 'POST');
		e.request = new Request(e.url, {
			method: 'POST',
			duplex: 'half',
			body: new ReadableStream({
				start(controller) {
					controller.enqueue(new Uint8Array(3000));
					controller.close();
				}
			})
		} as any);
		expect((await protectRequest(e))?.status).toBe(413);
		expect(mocks.consume).not.toHaveBeenCalled();
	});
	it('does not consume, rate-limit or reject external webhook bodies', async () => {
		for (const path of [
			'/api/telegram/webhook',
			'/api/instagram/webhook',
			'/api/payments/robokassa/result'
		]) {
			const e = event(path, 'POST', 'signed raw body');
			const original = e.request;
			expect(await protectRequest(e)).toBeNull();
			expect(e.request).toBe(original);
			expect(await e.request.text()).toBe('signed raw body');
		}
		expect(mocks.consume).not.toHaveBeenCalled();
	});
});
