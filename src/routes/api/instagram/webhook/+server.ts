import crypto from 'node:crypto';
import { text } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { processInstagramWebhook } from '$lib/server/instagram.server';
import type { RequestHandler } from './$types';

// Верификация подписки: Meta делает GET с hub.challenge при настройке вебхука
// в приложении (Webhooks → Instagram → Callback URL + Verify Token).
export const GET: RequestHandler = ({ url }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	if (mode === 'subscribe' && token && token === env.INSTAGRAM_VERIFY_TOKEN && challenge) {
		return text(challenge);
	}
	return new Response('Forbidden', { status: 403 });
};

/** Подпись Meta: sha256=HMAC(app secret, raw body). Сравнение — constant-time. */
function signatureValid(rawBody: string, header: string | null): boolean {
	if (!env.INSTAGRAM_APP_SECRET) return true; // секрет не настроен — проверку не включаем
	if (!header?.startsWith('sha256=')) return false;
	const expected = crypto
		.createHmac('sha256', env.INSTAGRAM_APP_SECRET)
		.update(rawBody)
		.digest('hex');
	const received = header.slice('sha256='.length);
	if (received.length !== expected.length) return false;
	return crypto.timingSafeEqual(Buffer.from(received, 'utf8'), Buffer.from(expected, 'utf8'));
}

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();

	if (!signatureValid(rawBody, request.headers.get('x-hub-signature-256'))) {
		return new Response('Invalid signature', { status: 401 });
	}

	// Всегда 200: при не-2xx Meta ретраит доставку, а свои ошибки мы логируем сами
	try {
		await processInstagramWebhook(JSON.parse(rawBody));
	} catch (err) {
		console.error('[instagram] Ошибка вебхука:', err);
	}
	return text('OK');
};
