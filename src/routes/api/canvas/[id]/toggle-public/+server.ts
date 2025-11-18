import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query, queryOne } from '$lib/server/db.server';

// Helper function to check if user is authenticated (admin)
function isAuthenticated(locals: App.Locals): boolean {
	return !!locals.user;
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { id } = params;
	const isAdmin = isAuthenticated(locals);

	// Only admin can toggle canvas visibility
	if (!isAdmin) {
		throw error(403, 'Только администратор может изменять видимость канвасов');
	}

	const { isPublic } = await request.json();

	// Check if canvas exists
	const existing = await queryOne<{ id: string; isPublic: boolean }>(
		'SELECT id, "isPublic" FROM "Canvas" WHERE id = $1',
		[id]
	);

	if (!existing) {
		// Create canvas if it doesn't exist
		await query(
			'INSERT INTO "Canvas" (id, "userId", data, "isPublic") VALUES ($1, $2, $3, $4)',
			[id, id, JSON.stringify({ elements: [], appState: {} }), isPublic]
		);
	} else {
		// Update existing canvas
		await query(
			'UPDATE "Canvas" SET "isPublic" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
			[isPublic, id]
		);
	}

	return json({ success: true, isPublic });
};
