import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrammyError } from 'grammy';

const mocks = vi.hoisted(() => ({
	contacts: [] as Array<{ id: number; telegramUserId: number; botBlocked: boolean }>,
	sendChatAction: vi.fn(),
	setBotBlocked: vi.fn(async () => {})
}));

vi.mock('../..', () => ({
	db: {
		select: () => ({
			from: () => ({
				orderBy: async () => mocks.contacts
			})
		})
	}
}));

vi.mock('./telegram-client-bot.server', () => ({
	clientBotApi: { sendChatAction: mocks.sendChatAction },
	apiDeadline: () => undefined
}));

vi.mock('./bot-contacts.server', () => ({ setBotBlocked: mocks.setBotBlocked }));

import { getBotAccessCheckState, startBotAccessCheck } from './bot-contact-access.server';

describe('массовая проверка доступности контактов', () => {
	beforeEach(() => {
		mocks.contacts.length = 0;
		mocks.sendChatAction.mockReset();
		mocks.setBotBlocked.mockClear();
	});

	it('помечает 403 как блокировку и снимает устаревшую блокировку при успехе', async () => {
		mocks.contacts.push(
			{ id: 1, telegramUserId: 101, botBlocked: false },
			{ id: 2, telegramUserId: 102, botBlocked: true }
		);
		mocks.sendChatAction
			.mockRejectedValueOnce(
				new GrammyError(
					'blocked',
					{ ok: false, error_code: 403, description: 'bot was blocked by the user' },
					'sendChatAction',
					{}
				)
			)
			.mockResolvedValueOnce(true);

		await startBotAccessCheck();
		await vi.waitFor(() => expect(getBotAccessCheckState().status).toBe('completed'));

		expect(mocks.setBotBlocked).toHaveBeenCalledWith(1, true);
		expect(mocks.setBotBlocked).toHaveBeenCalledWith(2, false);
		expect(getBotAccessCheckState()).toMatchObject({
			total: 2,
			checked: 2,
			blockedFound: 1,
			errors: 0
		});
	});
});
