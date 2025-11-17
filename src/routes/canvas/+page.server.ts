import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { query } from '$lib/server/db.server';

export const load: PageServerLoad = async ({ url }) => {
	const sceneId = url.searchParams.get('id');

	// If no ID provided, this is demo mode
	if (!sceneId) {
		return {
			mode: 'demo' as const,
			sceneId: '550e8400-e29b-41d4-a716-446655440000' // Demo scene UUID
		};
	}

	// If ID provided, check if it's a shared canvas
	try {
		const result = await query<{
			is_canvas_shared: boolean;
			nick: string | null;
			name: string;
		}>(
			'SELECT is_canvas_shared, nick, name FROM clients WHERE canvas_scene_id = $1',
			[sceneId]
		);

		if (!result.length) {
			throw error(404, 'Canvas not found');
		}

		const row = result[0];

		if (!row.is_canvas_shared) {
			throw error(403, 'This canvas is not shared');
		}

		return {
			mode: 'shared' as const,
			sceneId,
			clientName: row.nick || row.name
		};
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Error loading shared canvas:', err);
		throw error(500, 'Failed to load canvas');
	}
};
