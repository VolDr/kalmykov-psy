import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { query } from '$lib/server/db.server';

// SQL to get or create canvas ID for client
const GET_OR_CREATE_CANVAS_SQL = `
	WITH existing_canvas AS (
		SELECT canvas_scene_id, is_canvas_shared, nick, name
		FROM clients
		WHERE id = $1 AND canvas_scene_id IS NOT NULL
	),
	new_canvas AS (
		UPDATE clients
		SET canvas_scene_id = gen_random_uuid()
		WHERE id = $1 AND canvas_scene_id IS NULL
		RETURNING canvas_scene_id, is_canvas_shared, nick, name
	)
	SELECT * FROM existing_canvas
	UNION ALL
	SELECT * FROM new_canvas
	LIMIT 1
`;

export const load: PageServerLoad = async ({ url, locals }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const clientId = url.searchParams.get('clientId');
	if (!clientId) {
		throw error(400, 'Client ID is required');
	}

	try {
		// Get or create canvas scene ID for the client
		const result = await query<{
			canvas_scene_id: string;
			is_canvas_shared: boolean;
			nick: string | null;
			name: string;
		}>(GET_OR_CREATE_CANVAS_SQL, [clientId]);

		if (!result.length) {
			throw error(404, 'Client not found');
		}

		const row = result[0];

		return {
			sceneId: row.canvas_scene_id,
			clientId,
			isShared: row.is_canvas_shared ?? false,
			clientName: row.nick || row.name
		};
	} catch (err) {
		console.error('Error loading canvas:', err);
		throw error(500, 'Failed to load canvas');
	}
};
