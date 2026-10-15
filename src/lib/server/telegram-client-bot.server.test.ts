import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getChannelPost: vi.fn(),
	incrementChannelPostClicks: vi.fn(async () => {}),
	markBotStarted: vi.fn(async () => {}),
	getContactByTelegramId: vi.fn(),
	setBotBlocked: vi.fn(async () => {}),
	triggerScenarioForContact: vi.fn(async () => {}),
	findTriggeredScenarios: vi.fn(async () => [] as unknown[])
}));

vi.mock('$env/static/private', () => ({ TELEGRAM_CLIENT_BOT_TOKEN: '123:abc' }));
vi.mock('../..', () => ({ db: {} }));
vi.mock('./bot-contacts.server', () => ({
	upsertContactFromTelegramUser: async () => ({ id: 5, metrikaClientId: null }),
	logInboundMessage: async () => {},
	attachMetrikaClientId: async () => null,
	getContactByTelegramId: mocks.getContactByTelegramId,
	setBotBlocked: mocks.setBotBlocked
}));
vi.mock('./bot-scenarios.server', () => ({
	SUBSCRIPTION_CALLBACK_PREFIX: 'sub:',
	parseStartPayload: (payload: string) => ({ key: payload.split('__')[0], metrikaClientId: null }),
	findTriggeredScenarios: mocks.findTriggeredScenarios,
	triggerScenarioForContact: mocks.triggerScenarioForContact
}));
vi.mock('./bot-funnel.server', () => ({ markBotStarted: mocks.markBotStarted }));
vi.mock('./bot-channel-posts.server', async (importOriginal) => ({
	...(await importOriginal<typeof import('./bot-channel-posts.server')>()),
	getChannelPost: mocks.getChannelPost,
	incrementChannelPostClicks: mocks.incrementChannelPostClicks
}));
vi.mock('./quiz-bot.server', () => ({
	QUIZ_CALLBACK_PREFIX: 'qz:',
	QUIZ_START_PREFIX: 'qr_',
	QUIZ_RESULT_START_KEY: 'quiz_result',
	handleQuizDeeplink: async () => false,
	handleQuizResultReminder: async () => false
}));
vi.mock('./log-error.server', () => ({ logSafeError: () => {} }));

import { clientBot } from './telegram-client-bot.server';

// Без botInfo grammy пошёл бы за ним в Telegram (getMe)
clientBot.botInfo = { id: 1, is_bot: true, first_name: 'bot', username: 'bot' } as never;

async function sendText(text: string) {
	const from = { id: 42, is_bot: false, first_name: 'user' };
	await clientBot.handleUpdate({
		update_id: 1,
		message: { message_id: 1, date: 0, chat: { ...from, type: 'private' }, from, text }
	} as never);
}

async function sendBotStatus(status: 'member' | 'kicked') {
	const user = { id: 42, is_bot: false, first_name: 'user' };
	await clientBot.handleUpdate({
		update_id: 2,
		my_chat_member: {
			chat: { ...user, type: 'private' },
			from: user,
			date: 0,
			old_chat_member: {
				status: status === 'member' ? 'kicked' : 'member',
				user: clientBot.botInfo
			},
			new_chat_member: { status, user: clientBot.botInfo }
		}
	} as never);
}

describe('блокировка и разблокировка бота', () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) mock.mockClear();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		mocks.getContactByTelegramId.mockResolvedValue({ id: 5 });
	});

	it('помечает контакт отписавшимся по my_chat_member', async () => {
		await sendBotStatus('kicked');

		expect(mocks.getContactByTelegramId).toHaveBeenCalledWith(42);
		expect(mocks.setBotBlocked).toHaveBeenCalledWith(5, true);
	});

	it('возвращает контакт при разблокировке', async () => {
		await sendBotStatus('member');

		expect(mocks.setBotBlocked).toHaveBeenCalledWith(5, false);
	});
});

describe('/start cp_<id> — кнопка поста канала', () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) mock.mockClear();
		// Итог по апдейту пишется в лог на каждый апдейт
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('запускает цепочку поста, считает клик и пишет источник cp_<id>', async () => {
		const scenario = { id: 3, enabled: true };
		mocks.getChannelPost.mockResolvedValue({ post: { id: 7 }, scenario });

		await sendText('/start cp_7');

		expect(mocks.getChannelPost).toHaveBeenCalledWith(7);
		expect(mocks.markBotStarted).toHaveBeenCalledWith(5, 'cp_7');
		expect(mocks.incrementChannelPostClicks).toHaveBeenCalledWith(7);
		expect(mocks.triggerScenarioForContact).toHaveBeenCalledWith(
			scenario,
			expect.objectContaining({ id: 5 })
		);
		expect(mocks.findTriggeredScenarios).not.toHaveBeenCalled();
	});

	it('пост сняли — срабатывает обычный /start', async () => {
		mocks.getChannelPost.mockResolvedValue(null);

		await sendText('/start cp_7');

		expect(mocks.incrementChannelPostClicks).not.toHaveBeenCalled();
		expect(mocks.findTriggeredScenarios).toHaveBeenCalledWith('/start cp_7');
	});

	it('цепочка поста выключена — срабатывает обычный /start', async () => {
		mocks.getChannelPost.mockResolvedValue({
			post: { id: 7 },
			scenario: { id: 3, enabled: false }
		});

		await sendText('/start cp_7');

		expect(mocks.triggerScenarioForContact).not.toHaveBeenCalled();
		expect(mocks.findTriggeredScenarios).toHaveBeenCalled();
	});

	it('обычный диплинк пост не ищет', async () => {
		await sendText('/start otpusk_ad');

		expect(mocks.getChannelPost).not.toHaveBeenCalled();
		expect(mocks.findTriggeredScenarios).toHaveBeenCalledWith('/start otpusk_ad');
	});
});
