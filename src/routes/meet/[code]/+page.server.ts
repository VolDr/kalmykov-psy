import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolveMeetingCode } from '#lib/server/meeting-invites.server.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'private, no-store',
		'Referrer-Policy': 'no-referrer',
		'X-Robots-Tag': 'noindex, nofollow'
	});
	const invite = await resolveMeetingCode(params.code);
	if (!invite) throw error(404, 'Приглашение не найдено или срок действия истек.');
	return { room: invite.group, token: invite.token };
};
