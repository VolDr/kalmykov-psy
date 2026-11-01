import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { InstagramTokenStore } from './instagram-token.server';

const DAY = 86_400_000;
let directory: string;
let filePath: string;
let now: number;

beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), 'instagram-token-test-'));
	filePath = join(directory, 'token.json');
	now = Date.UTC(2026, 9, 27);
});
afterEach(async () => {
	await rm(directory, { recursive: true, force: true });
});

function store(
	refresh = vi.fn(async (): Promise<unknown> => ({
		access_token: 'renewed-token',
		expires_in: (60 * DAY) / 1000
	})),
	seedToken = 'initial-token'
) {
	return new InstagramTokenStore({ seedToken, filePath, refresh, now: () => now });
}

describe('automatic token renewal', () => {
	it('persists refreshed credentials and uses them after a restart', async () => {
		const refresh = vi.fn(async () => ({
			access_token: 'renewed-token',
			expires_in: (60 * DAY) / 1000
		}));
		const first = store(refresh);
		expect(await first.getToken()).toBe('initial-token');
		expect(await first.check()).toBe('refreshed');
		expect(await first.getToken()).toBe('renewed-token');
		expect(await store().getToken()).toBe('renewed-token');
		expect(refresh).toHaveBeenCalledWith('initial-token');
		const status = await first.getStatus();
		expect(status.expiresAt).toBe(now + 60 * DAY);
		expect(JSON.stringify(status)).not.toContain('renewed-token');
		if (process.platform !== 'win32') expect((await stat(filePath)).mode & 0o777).toBe(0o600);
	});

	it('refreshes at 30 days, using the most recently saved token', async () => {
		const refresh = vi.fn(async () => ({
			access_token: 'renewed-token',
			expires_in: (60 * DAY) / 1000
		}));
		const manager = store(refresh);
		await manager.check();
		now += 29 * DAY;
		expect(await manager.check()).toBe('skipped');
		now += DAY;
		expect(await manager.check()).toBe('refreshed');
		expect(refresh).toHaveBeenLastCalledWith('renewed-token');
	});

	it('keeps the old token on failure and retries the next day even after a restart', async () => {
		const failure = vi.fn(async (): Promise<unknown> => {
			throw new Error('provider failure');
		});
		const manager = store(failure);
		expect(await manager.check()).toBe('failed');
		expect(await manager.getToken()).toBe('initial-token');
		const refresh = vi.fn(async () => ({
			access_token: 'renewed-token',
			expires_in: (60 * DAY) / 1000
		}));
		const restarted = store(refresh);
		now += 23 * 60 * 60 * 1000;
		expect(await restarted.check()).toBe('skipped');
		expect(refresh).not.toHaveBeenCalled();
		now += 60 * 60 * 1000;
		expect(await restarted.check()).toBe('refreshed');
		expect((await restarted.getStatus()).refreshFailed).toBe(false);
	});

	it.each([
		{},
		{ access_token: 'bad', expires_in: 0 },
		{ access_token: '', expires_in: 5_184_000 }
	])('does not replace a working token with a malformed response', async (result) => {
		const manager = store(vi.fn(async () => result));
		expect(await manager.check()).toBe('failed');
		expect(await manager.getToken()).toBe('initial-token');
	});

	it('uses a manually replaced .env token instead of a saved connection', async () => {
		await store().check();
		expect(await store(undefined, 'manually-replaced-token').getToken()).toBe(
			'manually-replaced-token'
		);
	});

	it('does not contact Meta or create a credential file when not configured', async () => {
		const refresh = vi.fn();
		const manager = store(refresh, '');
		expect(await manager.check()).toBe('skipped');
		expect(await manager.getToken()).toBe('');
		expect(refresh).not.toHaveBeenCalled();
		await expect(readFile(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('coalesces concurrent checks into a single provider request', async () => {
		let finish!: (value: unknown) => void;
		const refresh = vi.fn(
			() =>
				new Promise<unknown>((resolve) => {
					finish = resolve;
				})
		);
		const manager = store(refresh);
		await manager.getToken();
		const first = manager.check();
		const second = manager.check();
		await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
		finish({ access_token: 'new-token', expires_in: 5_184_000 });
		expect(await Promise.all([first, second])).toEqual(['refreshed', 'refreshed']);
	});

	it('fails visibly for a corrupt token file instead of silently reverting to the old seed', async () => {
		await writeFile(filePath, 'broken json');
		await expect(store().getToken()).rejects.toThrow('Не удалось прочитать');
	});

	it('does not activate a new token when durable storage fails', async () => {
		const manager = new InstagramTokenStore({
			seedToken: 'seed',
			filePath: join(directory, 'blocker', 'token.json'),
			refresh: vi.fn(async () => ({ access_token: 'new', expires_in: 5_184_000 })),
			now: () => now
		});
		expect(await manager.getToken()).toBe('seed');
		await writeFile(join(directory, 'blocker'), 'file');
		await expect(manager.check()).rejects.toThrow();
		expect(await manager.getToken()).toBe('seed');
	});
});
