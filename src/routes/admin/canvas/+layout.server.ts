import { requireAuth } from '$lib/server/protected';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Require authentication for admin canvas
	requireAuth(event);

	return {
		user: event.locals.user
	};
};
