import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Room identifiers created through /admin/meetings. No user-controlled host,
// path traversal or arbitrary URLs can reach the local Galene service.
const ROOM_ID = /^meet-[a-f0-9]{16}$/;
const noStore = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ url }) => {
	const room = url.searchParams.get('room') || '';
	if (!ROOM_ID.test(room)) {
		return json({ error: 'Неверный идентификатор комнаты.' }, { status: 400, headers: noStore });
	}

	try {
		// The Galene group status endpoint does not emit CORS headers. Fetching
		// through SvelteKit keeps the browser request same-origin. Administrative
		// credentials are neither needed nor forwarded for this public endpoint.
		const response = await fetch(
			'http://127.0.0.1:8443/group/' + encodeURIComponent(room) + '/.status',
			{ signal: AbortSignal.timeout(5000), cache: 'no-store' }
		);
		if (!response.ok) {
			return json(
				{ error: response.status === 404 ? 'Комната не найдена.' : 'Сервер видеовстреч недоступен.' },
				{ status: response.status === 404 ? 404 : 502, headers: noStore }
			);
		}
		const info: unknown = await response.json();
		if (
			!info || typeof info !== 'object' ||
			typeof (info as Record<string, unknown>).name !== 'string' ||
			typeof (info as Record<string, unknown>).endpoint !== 'string'
		) {
			return json({ error: 'Galene вернул неполные данные комнаты.' }, { status: 502, headers: noStore });
		}
		// Preserve the exact websocket endpoint returned by Galene, including
		// proxyURL (wss://meet.kalmykov-psy.ru/ws).
		return json(info, { headers: noStore });
	} catch {
		return json(
			{ error: 'Не удалось получить статус комнаты от Galene.' },
			{ status: 502, headers: noStore }
		);
	}
};
