import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebinar, isValidViewerKey, publicWebinar, webinarState } from '#lib/server/webinars.server.js';

export const GET: RequestHandler = async ({ params, cookies }) => {
	if (!/^[a-f0-9]{16}$/.test(params.id)) return json({ error: 'Не найден.' }, { status: 404 });
	const webinar = await getWebinar(params.id);
	if (!webinar || !isValidViewerKey(webinar, cookies.get('webinar_access') || '')) {
		return json({ error: 'Ссылка недействительна.' }, { status: 403 });
	}
	return json({
		...publicWebinar(webinar),
		state: webinarState(webinar),
		serverNow: Date.now()
	}, { headers: { 'Cache-Control': 'private, no-store' } });
};
