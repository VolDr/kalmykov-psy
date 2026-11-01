import { error } from '@sveltejs/kit';
import { getDocByToken, getEntries, logVisit } from '#lib/server/translations.server.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, getClientAddress, request, setHeaders }) => {
	const doc = await getDocByToken(params.token);
	if (!doc) error(404, 'Страница не найдена');

	setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	await logVisit(doc.id, {
		ip: getClientAddress(),
		userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null
	});

	return {
		title: doc.title,
		items: doc.items,
		guide: doc.guide,
		entries: await getEntries(doc.id)
	};
};
