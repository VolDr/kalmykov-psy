export const INSTAGRAM_BUTTON_TITLE_LIMIT = 20;
export const INSTAGRAM_BUTTON_TEXT_LIMIT = 640;

export type InstagramLinkButton = { title: string; url: string };

/** Used by both the rule editor and the sender. Never truncate a private reply. */
export function instagramMessageError(
	text: string,
	buttonTitle?: string | null,
	buttonUrl?: string | null
): string | null {
	const title = buttonTitle?.trim() ?? '';
	const url = buttonUrl?.trim() ?? '';
	if (!title && !url) return null;
	if (!title || !url) return 'Для кнопки заполните и название, и ссылку.';
	if (!text.trim()) return 'Добавьте текст сообщения над кнопкой.';
	if (Array.from(title).length > INSTAGRAM_BUTTON_TITLE_LIMIT) {
		return 'Название кнопки должно содержать не больше 20 символов.';
	}
	if (Array.from(text.trim()).length > INSTAGRAM_BUTTON_TEXT_LIMIT) {
		return 'Сообщение с кнопкой должно содержать не больше 640 символов.';
	}
	try {
		const parsed = new URL(url);
		if (
			!['https:', 'http:'].includes(parsed.protocol) ||
			parsed.username ||
			parsed.password ||
			url.length > 2048
		) {
			return 'Укажите полную ссылку http:// или https:// без логина и пароля.';
		}
	} catch {
		return 'Укажите полную ссылку, например https://kalmykov-psy.ru/useful/focus-attention.';
	}
	return null;
}

/** One API message, including for the one-private-reply-per-comment flow. */
export function instagramMessage(text: string, button?: InstagramLinkButton) {
	if (button && (!button.title.trim() || !button.url.trim())) {
		throw new Error('Для кнопки заполните и название, и ссылку.');
	}
	const error = instagramMessageError(text, button?.title, button?.url);
	if (error) throw new Error(error);
	if (!button) return { text };
	return {
		attachment: {
			type: 'template',
			payload: {
				template_type: 'button',
				text: text.trim(),
				buttons: [{ type: 'web_url', title: button.title.trim(), url: button.url.trim() }]
			}
		}
	};
}
