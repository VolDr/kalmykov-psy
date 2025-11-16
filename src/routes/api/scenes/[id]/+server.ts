// src/routes/api/scenes/[id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { query } from '$lib/server/db.server';
import type { SceneData } from '$lib/canvas/model/shapes';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;

	const rows = await query<{ data: SceneData }>('SELECT data FROM scenes WHERE id = $1', [id]);

	if (!rows.length) {
		throw error(404, 'Scene not found');
	}

	return json(rows[0].data);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = params.id;
	const body = (await request.json()) as SceneData;

	await query(
		`
      INSERT INTO scenes (id, data)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `,
		[id, body]
	);

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = params.id;

	const result = await query('DELETE FROM scenes WHERE id = $1 RETURNING id', [id]);

	if (!result.length) {
		throw error(404, 'Scene not found');
	}

	return json({ ok: true });
};
