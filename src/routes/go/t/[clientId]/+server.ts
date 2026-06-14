import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const clientId = parseInt(params.clientId, 10);
	if (Number.isSafeInteger(clientId) && clientId > 0) {
		cookies.set('sb_client_id', String(clientId), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 дней
		});
	}
	redirect(302, '/useful/organized-burnout');
};
