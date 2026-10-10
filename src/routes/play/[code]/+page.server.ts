import { getRoomPreview, normalizeCode } from '$lib/server/game-rooms.server';
import { readPlayerToken } from '$lib/server/game-cookie.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, cookies }) => {
	const code = normalizeCode(params.code);
	const preview = getRoomPreview(code, readPlayerToken(cookies, code));
	return { code, preview };
};
