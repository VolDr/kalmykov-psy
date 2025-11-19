import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query, queryOne } from '$lib/server/db.server';

// Helper function to check if user is authenticated (admin)
function isAuthenticated(locals: App.Locals): boolean {
	return !!locals.user;
}

// Helper function to check canvas access rights
async function canAccessCanvas(canvasId: string, isAdmin: boolean): Promise<boolean> {
	const canvas = await queryOne<{ isPublic: boolean }>(
		'SELECT "isPublic" FROM "Canvas" WHERE id = $1',
		[canvasId]
	);

	if (!canvas) {
		// Canvas doesn't exist yet - only admin can create/access
		return isAdmin;
	}

	// Access allowed if admin OR canvas is public
	return isAdmin || canvas.isPublic;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;
	const isAdmin = isAuthenticated(locals);

	// Check access rights
	const hasAccess = await canAccessCanvas(id, isAdmin);
	if (!hasAccess) {
		throw error(403, 'Доступ запрещен');
	}

	// Try to get canvas from database
	const canvas = await queryOne<{ data: any }>(
		'SELECT data FROM "Canvas" WHERE id = $1',
		[id]
	);

	if (!canvas) {
		// Return empty canvas for new canvases
		return json({ elements: [], appState: {} });
	}

	return json(canvas.data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { id } = params;
	const isAdmin = isAuthenticated(locals);

	// Only admin can save canvases
	if (!isAdmin) {
		throw error(403, 'Только администратор может сохранять канвасы');
	}

	const data = await request.json();

	// Check if canvas already exists
	const existing = await queryOne<{ id: string }>(
		'SELECT id FROM "Canvas" WHERE id = $1',
		[id]
	);

	if (existing) {
		// Update existing canvas
		await query(
			'UPDATE "Canvas" SET data = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
			[JSON.stringify(data), id]
		);
	} else {
		// Create new canvas (default is not public)
		await query(
			'INSERT INTO "Canvas" (id, "userId", data, "isPublic") VALUES ($1, $2, $3, $4)',
			[id, id, JSON.stringify(data), false]
		);
	}

	return json({ success: true });
};
