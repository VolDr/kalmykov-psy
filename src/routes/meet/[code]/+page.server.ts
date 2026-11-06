import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolveMeetingCode } from '#lib/server/meeting-invites.server.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'private, no-store',
		'Vary': 'Cookie',
		'Referrer-Policy': 'no-referrer',
		'X-Robots-Tag': 'noindex, nofollow'
	});
	const link = await resolveMeetingCode(params.code);
	if (!link) throw error(404, 'Приглашение не найдено или срок его действия истек.');
	// Never serialize moderator or guest tokens into SvelteKit page data.
	// The client exchanges its short link on join, after checking the admin session.
	return { code: link.code, room: link.group };
};
