import { afterEach, describe, expect, it, vi } from 'vitest';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { instagramRequest } from './instagram-http.server';

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

function connection(status: number, body: unknown, respond = true) {
	const req = Object.assign(new EventEmitter(), {
		write: vi.fn(),
		end: vi.fn(() => {
			if (!respond) return;
			const callback = mocked.mock.calls[0][2] as (response: IncomingMessage) => void;
			const response = Object.assign(new EventEmitter(), { statusCode: status });
			callback(response as IncomingMessage);
			response.emit('data', Buffer.from(JSON.stringify(body)));
			response.emit('end');
			req.emit('close');
		}),
		destroy: vi.fn((_error: Error) => {
			req.emit('error', _error);
			req.emit('close');
			return req;
		})
	});
	const mocked = vi.spyOn(https, 'request').mockReturnValue(req as unknown as ClientRequest);
	return { req, mocked };
}

describe('Instagram HTTP requests', () => {
	it('supports the unversioned token refresh GET endpoint', async () => {
		const { mocked } = connection(200, { access_token: 'renewed', expires_in: 5_184_000 });
		const url = new URL(
			'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token'
		);
		await expect(instagramRequest(url, 'secret', '')).resolves.toMatchObject({
			access_token: 'renewed'
		});
		expect(mocked.mock.calls[0][1]).toMatchObject({ method: 'GET' });
		expect(url.searchParams.get('access_token')).toBe('secret');
	});

	it('does not leak access tokens, provider response content or customer messages in errors', async () => {
		connection(400, {
			error: { code: 190, message: 'Invalid token VERY-SECRET; private user message' }
		});
		await expect(
			instagramRequest(new URL('https://graph.instagram.com/me/messages'), 'VERY-SECRET', '', {
				message: { text: 'private user message' }
			})
		).rejects.toMatchObject({ message: 'Instagram API: HTTP 400, code 190' });
	});

	it('rejects a provider error even inside a successful HTTP response', async () => {
		connection(200, { error: { code: 10 } });
		await expect(
			instagramRequest(new URL('https://graph.instagram.com/me/messages'), 'secret', '')
		).rejects.toThrow('code 10');
	});

	it('times out an unresponsive connection including proxy/DNS negotiation', async () => {
		vi.useFakeTimers();
		const { req } = connection(200, {}, false);
		const result = instagramRequest(
			new URL('https://graph.instagram.com/refresh_access_token'),
			'secret',
			''
		);
		const assertion = expect(result).rejects.toThrow('network or timeout');
		await vi.advanceTimersByTimeAsync(30_000);
		await assertion;
		expect(req.destroy).toHaveBeenCalledOnce();
	});
});
