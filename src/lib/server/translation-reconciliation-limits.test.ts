import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
vi.mock('../../index', () => ({ db: {} }));
import { protectRequest } from './request-security.server';

describe('authenticated reconciliation request limits', () => {
	it.each([
		['/admin/translations', '/admin/translations', 2_097_153],
		['/admin/translations/review/1/save', '/admin/translations/review/[id]/save', 131_073]
	])('caps %s before the action reads the body', async (path, route, size) => {
		const url = new URL(path, 'https://example.test');
		const event = {
			url,
			route: { id: route },
			locals: { user: { username: 'admin' } },
			request: new Request(url, { method: 'POST', body: 'x'.repeat(size) }),
			getClientAddress: () => '192.0.2.1'
		} as unknown as RequestEvent;
		expect((await protectRequest(event))?.status).toBe(413);
	});
});
