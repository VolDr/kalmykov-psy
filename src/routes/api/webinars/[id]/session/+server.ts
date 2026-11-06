import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebinar, isValidViewerKey, publicWebinar } from '#lib/server/webinars.server.js';

export const POST: RequestHandler = async ({ params, request, cookies, url }) => {
	if (!/^[a-f0-9]{16}$/.test(params.id)) return json({ error: 'Вебинар не найден.' }, { status: 404 });
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) return json({ error: 'Неверный источник запроса.' }, { status: 403 });
	if (!request.body) return json({ error: 'Нужна ссылка-приглашение.' }, { status: 400 });

	let input = '';
	let bytes = 0;
	const reader = request.body.getReader();
	try {
		while (true) {
			const part = await reader.read();
			if (part.done) break;
			bytes += part.value.byteLength;
			if (bytes > 512) return json({ error: 'Неверное приглашение.' }, { status: 413 });
			input += new TextDecoder().decode(part.value);
		}
	} finally {
		reader.releaseLock();
	}
	let key: unknown;
	try {
		key = (JSON.parse(input) as { key?: unknown }).key;
	} catch {
		return json({ error: 'Неверный формат ссылки.' }, { status: 400 });
	}
	const webinar = await getWebinar(params.id);
	if (!webinar || !webinar.ready || !isValidViewerKey(webinar, key as string)) {
		return json({ error: 'Ссылка недействительна или видео еще не загружено.' }, { status: 403 });
	}
	cookies.set('webinar_access', key as string, {
		path: '/api/webinars/' + webinar.id,
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 6 * 3600
	});
	return json({ ...publicWebinar(webinar), serverNow: Date.now() }, {
		headers: { 'Cache-Control': 'private, no-store' }
	});
};
