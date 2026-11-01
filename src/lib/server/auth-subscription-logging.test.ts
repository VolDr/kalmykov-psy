import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock('../../index', () => ({ db: mocks }));
vi.mock('bcrypt', () => ({ compare: vi.fn(async () => false), hash: vi.fn() }));
vi.mock('$app/env/private', () => ({ MAILOPOST_API_TOKEN: 'PRIVATE_MAIL_TOKEN' }));

import { verifyUser } from './auth.server';
import { subscriberService } from './subscriber.server';
import { load as confirm } from '../../routes/confirm/+page.server';

function select(rows: unknown[]) {
	const chain: any = {};
	chain.from = chain.where = () => chain;
	chain.limit = async () => rows;
	return chain;
}
const record = {
	email: 'private@example.invalid',
	token: 'PRIVATE_CONFIRM_TOKEN',
	status: 'pending'
};
beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	mocks.insert.mockReturnValue({ values: () => ({ returning: async () => [record] }) });
	mocks.update.mockReturnValue({
		set: () => ({ where: () => ({ returning: async () => [record] }) })
	});
});

describe('credentials and subscription data stay out of logs', () => {
	it('does not log an account or password hash on a failed login', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		mocks.select.mockReturnValueOnce(
			select([{ username: 'admin', password: 'PRIVATE_PASSWORD_HASH' }])
		);
		expect(await verifyUser('admin', 'fake-password')).toBe(false);
		expect(log).not.toHaveBeenCalled();
		log.mockRestore();
	});
	it('does not log an email, token or subscriber object while creating a subscription', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		mocks.select.mockReturnValueOnce(select([]));
		await subscriberService.upsertPending(record.email);
		expect(log).not.toHaveBeenCalled();
		log.mockRestore();
	});
	it('confirms without logging the URL token or provider payload', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		mocks.select.mockReturnValueOnce(select([record]));
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('PRIVATE_PROVIDER_BODY', { status: 500 }))
		);
		const result = await confirm({
			url: new URL('https://kalmykov-psy.ru/confirm?token=PRIVATE_CONFIRM_TOKEN')
		} as any);
		const output = JSON.stringify([log.mock.calls, error.mock.calls, result]);
		for (const secret of [
			record.email,
			record.token,
			'PRIVATE_PROVIDER_BODY',
			'PRIVATE_MAIL_TOKEN'
		])
			expect(output).not.toContain(secret);
		expect(result.success).toBe(false);
		log.mockRestore();
		error.mockRestore();
	});
});
