import { describe, expect, it, vi } from 'vitest';

vi.mock('../..', () => ({ db: {} }));

import {
	parsePostLink,
	parsePostStartKey,
	postButtonMarkup,
	postStartKey
} from './bot-channel-posts.server';

describe('ключ диплинка кнопки поста', () => {
	it('туда и обратно', () => {
		expect(postStartKey(42)).toBe('cp_42');
		expect(parsePostStartKey(postStartKey(42))).toBe(42);
	});

	it('чужие ключи — не посты', () => {
		expect(parsePostStartKey('')).toBeNull();
		expect(parsePostStartKey('otpusk_ad')).toBeNull();
		expect(parsePostStartKey('cp_')).toBeNull();
		expect(parsePostStartKey('cp_12x')).toBeNull();
		expect(parsePostStartKey('qr_abc')).toBeNull();
	});
});

describe('postButtonMarkup', () => {
	it('кнопка — прямая ссылка в бота, без callback', () => {
		expect(postButtonMarkup('Забрать', 'kalmykov_bot', 7)).toEqual({
			inline_keyboard: [[{ text: 'Забрать', url: 'https://t.me/kalmykov_bot?start=cp_7' }]]
		});
	});
});

describe('parsePostLink', () => {
	it('публичный и приватный канал', () => {
		expect(parsePostLink('https://t.me/kalmykov_psy/123')).toEqual({
			chatId: '@kalmykov_psy',
			messageId: 123
		});
		expect(parsePostLink('https://t.me/c/2223334445/9')).toEqual({
			chatId: '-1002223334445',
			messageId: 9
		});
	});
});
