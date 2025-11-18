import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne } from '$lib/server/db.server';

// Helper function to check if user is authenticated (admin)
function isAuthenticated(locals: App.Locals): boolean {
	return !!locals.user;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;
	const isAdmin = isAuthenticated(locals);

	// Only admin can check canvas status
	if (!isAdmin) {
		throw error(403, 'Только администратор может проверять статус канвасов');
	}

	// Get canvas status
	const canvas = await queryOne<{ isPublic: boolean }>(
		'SELECT "isPublic" FROM "Canvas" WHERE id = $1',
		[id]
	);

	if (!canvas) {
		// Canvas doesn't exist yet - default is not public
		return json({ isPublic: false, exists: false });
	}

	return json({ isPublic: canvas.isPublic, exists: true });
};
