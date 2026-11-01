import { describe, expect, it } from 'vitest';
import { instagramMessage, instagramMessageError } from './instagram-message';

describe('Instagram URL button', () => {
	it('keeps existing plain-text replies unchanged', () => {
		expect(instagramMessage('Привет!\nhttps://example.com')).toEqual({
			text: 'Привет!\nhttps://example.com'
		});
	});

	it('sends text and the URL button in one message', () => {
		expect(
			instagramMessage('Вот гайд 👇', {
				title: ' Открыть гайд ',
				url: ' https://example.com/guide?a=1&b=2 '
			})
		).toEqual({
			attachment: {
				type: 'template',
				payload: {
					template_type: 'button',
					text: 'Вот гайд 👇',
					buttons: [
						{ type: 'web_url', title: 'Открыть гайд', url: 'https://example.com/guide?a=1&b=2' }
					]
				}
			}
		});
	});

	it.each([
		'javascript:alert(1)',
		'data:text/html,test',
		'/relative',
		'https://user:secret@example.com'
	])('rejects unsafe/incomplete URL %s', (url) => {
		expect(instagramMessageError('Гайд', 'Открыть', url)).toBeTruthy();
	});

	it('requires both fields and message text', () => {
		expect(instagramMessageError('Гайд', 'Открыть', '')).toBeTruthy();
		expect(instagramMessageError('Гайд', '', 'https://example.com')).toBeTruthy();
		expect(instagramMessageError('', 'Открыть', 'https://example.com')).toBeTruthy();
		expect(() => instagramMessage('Гайд', { title: '', url: '' })).toThrow();
	});

	it('rejects oversized button text without silently truncating a private reply', () => {
		expect(
			instagramMessageError('я'.repeat(640), '🙂'.repeat(20), 'https://example.com')
		).toBeNull();
		expect(instagramMessageError('я'.repeat(641), 'Открыть', 'https://example.com')).toBeTruthy();
		expect(instagramMessageError('Гайд', 'я'.repeat(21), 'https://example.com')).toBeTruthy();
		expect(() =>
			instagramMessage('я'.repeat(641), { title: 'Гайд', url: 'https://example.com' })
		).toThrow();
	});

	it('allows removing both button fields from an existing rule', () => {
		expect(instagramMessageError('Обычный ответ', '', '')).toBeNull();
	});
});
