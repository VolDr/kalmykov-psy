import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveMeetingCode } from '#lib/server/meeting-invites.server.js';
import { galeneAdminConfigured } from '#lib/server/galene-admin.server.js';

const headers = {
	'Cache-Control': 'private, no-store',
	'Vary': 'Cookie',
	'Referrer-Policy': 'no-referrer'
};

export const POST: RequestHandler = async ({ request, url, locals }) => {
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) {
		return json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
	}
	if (!request.headers.get('content-type')?.startsWith('application/json')) {
		return json({ error: 'Неверный формат запроса.' }, { status: 415, headers });
	}
	const length = Number(request.headers.get('content-length'));
	if (Number.isFinite(length) && length > 256) {
		return json({ error: 'Слишком большой запрос.' }, { status: 413, headers });
	}
	let body: unknown;
	try {
		if (!request.body) throw new Error('Empty request');
		const reader = request.body.getReader();
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > 256) {
					await reader.cancel();
					throw new Error('Too long');
				}
				chunks.push(value);
			}
		} finally {
			reader.releaseLock();
		}
		body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		return json({ error: 'Некорректный код встречи.' }, { status: 400, headers });
	}
	const code = (body as { code?: unknown })?.code;
	if (typeof code !== 'string') {
		return json({ error: 'Некорректный код встречи.' }, { status: 400, headers });
	}
	const link = await resolveMeetingCode(code);
	if (!link) {
		return json({ error: 'Ссылка недействительна. Перевыпустите ее в админке.' }, { status: 404, headers });
	}
	// The site's existing login is the only authority for Galene operator
	// privileges. Guests receive only the regular presentation token.
	if (locals.user && !galeneAdminConfigured()) {
		return json({ error: 'Настройки Galene недоступны. Обратитесь к администратору.' }, { status: 503, headers });
	}
	const isAdmin = Boolean(locals.user);
	return json({
		room: link.group,
		token: isAdmin ? link.hostToken : link.guestToken,
		role: isAdmin ? 'host' : 'guest'
	}, { headers });
};
