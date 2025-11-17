import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { query } from '$lib/server/db.server';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	let body: { clientId: string; isShared: boolean };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { clientId, isShared } = body;

	if (!clientId || typeof isShared !== 'boolean') {
		throw error(400, 'clientId and isShared are required');
	}

	try {
		await query('UPDATE clients SET is_canvas_shared = $1 WHERE id = $2', [isShared, clientId]);

		return json({ ok: true });
	} catch (err) {
		console.error('Error updating canvas sharing:', err);
		throw error(500, 'Failed to update sharing settings');
	}
};
