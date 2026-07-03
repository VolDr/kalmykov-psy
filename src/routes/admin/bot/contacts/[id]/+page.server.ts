import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getContact,
	listMessages,
	logOutboundMessage,
	setBotBlocked,
	updateCrm
} from '$lib/server/bot-contacts.server';
import {
	clientBotApi,
	tgFormat,
	TELEGRAM_MESSAGE_LIMIT
} from '$lib/server/telegram-client-bot.server';
import { GrammyError } from 'grammy';

async function loadContactOr404(id: number) {
	const contact = await getContact(id);
	if (!contact) throw error(404, 'Контакт не найден');
	return contact;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) throw error(404, 'Контакт не найден');

	const contact = await loadContactOr404(id);
	const messages = await listMessages(id);

	return { contact, messages };
};

export const actions = {
	updateCrm: async ({ request, params }) => {
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		const form = await request.formData();
		const stage = (form.get('stage') as string)?.trim() || 'new';
		const tagsRaw = (form.get('tags') as string) ?? '';
		const notes = (form.get('notes') as string)?.trim() || null;

		const tags = tagsRaw
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		await updateCrm(id, { stage, tags, notes });

		return { crmSuccess: true };
	},

	reply: async ({ request, params, locals }) => {
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400, { error: 'Некорректный ID' });

		const form = await request.formData();
		const text = (form.get('text') as string)?.trim();
		if (!text) return fail(400, { replyError: 'Введите текст сообщения' });

		const formatted = tgFormat(text);
		if (formatted.length > TELEGRAM_MESSAGE_LIMIT) {
			return fail(400, {
				replyError: `Сообщение слишком длинное: ${formatted.length} из ${TELEGRAM_MESSAGE_LIMIT} символов (спецсимволы считаются с запасом)`
			});
		}

		const contact = await loadContactOr404(id);

		let sentMessageId: number;
		try {
			const sent = await clientBotApi.sendMessage(contact.telegramUserId, formatted, {
				parse_mode: 'HTML'
			});
			sentMessageId = sent.message_id;
		} catch (err) {
			if (err instanceof GrammyError) {
				// botBlocked ставим только по 403 (юзер заблокировал бота) — 400-е ошибки
				// (слишком длинное сообщение и т.п.) блокировкой не являются
				if (err.error_code === 403) await setBotBlocked(id, true);
				return fail(400, { replyError: `Telegram: ${err.description}` });
			}
			console.error('[bot-inbox] Ошибка отправки ответа:', err);
			return fail(500, { replyError: 'Не удалось отправить сообщение, попробуйте ещё раз' });
		}

		// Сообщение уже доставлено — ошибка записи в историю не должна выглядеть
		// как ошибка отправки, иначе админ отправит клиенту дубль
		try {
			await logOutboundMessage({
				contactId: id,
				text,
				telegramMessageId: sentMessageId,
				sentByAccountId: locals.user?.username
			});
		} catch (err) {
			console.error('[bot-inbox] Сообщение отправлено, но не записано в историю:', err);
		}

		return { replySuccess: true };
	}
} satisfies Actions;
