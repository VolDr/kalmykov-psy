import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '#lib/server/protected.js';
import { MAX_VIDEO_BYTES, receiveHlsZip } from '#lib/server/webinars.server.js';

export const PUT: RequestHandler = async (event) => {
	requireAuth(event);
	const { request, url, params } = event;
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) return json({ error: 'Неверный источник запроса.' }, { status: 403 });
	if (!/^[a-f0-9]{16}$/.test(params.id)) return json({ error: 'Неверный идентификатор.' }, { status: 400 });
	if (request.headers.get('content-type')?.split(';')[0] !== 'application/zip') {
		return json({ error: 'Загрузите ZIP с HLS-плейлистом index.m3u8 и сегментами .ts.' }, { status: 415 });
	}
	const len = Number(request.headers.get('content-length'));
	if (Number.isFinite(len) && len > MAX_VIDEO_BYTES) {
		return json({ error: 'Размер видео превышает 1 ГБ.' }, { status: 413 });
	}
	if (!request.body) return json({ error: 'Файл не передан.' }, { status: 400 });
	try {
		await receiveHlsZip(params.id, request.body);
		return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Ошибка загрузки видео.' },
			{ status: 400, headers: { 'Cache-Control': 'no-store' } }
		);
	}
};
