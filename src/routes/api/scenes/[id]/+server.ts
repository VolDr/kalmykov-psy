// src/routes/api/scenes/[id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { query } from '$lib/server/db.server';
import type { SceneData } from '$lib/canvas/model/shapes';
import { safeValidateSceneData } from '$lib/canvas/validation';
import { z } from 'zod';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function checkRateLimit(clientId: string): boolean {
	const now = Date.now();
	const record = rateLimitMap.get(clientId);

	if (!record || now > record.resetTime) {
		rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return true;
	}

	if (record.count >= RATE_LIMIT_MAX) {
		return false;
	}

	record.count++;
	return true;
}

// Validate UUID format
const uuidSchema = z.string().uuid();

function validateUUID(id: string): boolean {
	return uuidSchema.safeParse(id).success;
}

export const GET: RequestHandler = async ({ params, getClientAddress, cookies, locals }) => {
	const id = params.id;

	// Validate UUID format
	if (!validateUUID(id)) {
		throw error(400, 'Invalid scene ID format');
	}

	// Rate limiting
	const clientId = getClientAddress();
	if (!checkRateLimit(clientId)) {
		throw error(429, 'Too many requests. Please try again later.');
	}

	// Optional: Auth check (uncomment when auth is implemented)
	// if (!locals.user) {
	// 	throw error(401, 'Authentication required');
	// }

	try {
		const rows = await query<{ data: SceneData }>('SELECT data FROM scenes WHERE id = $1', [id]);

		if (!rows.length) {
			throw error(404, 'Scene not found');
		}

		return json(rows[0].data);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Database error in GET /api/scenes:', err);
		throw error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({
	params,
	request,
	getClientAddress,
	cookies,
	locals
}) => {
	const id = params.id;

	// Validate UUID format
	if (!validateUUID(id)) {
		throw error(400, 'Invalid scene ID format');
	}

	// Rate limiting
	const clientId = getClientAddress();
	if (!checkRateLimit(clientId)) {
		throw error(429, 'Too many requests. Please try again later.');
	}

	// CSRF protection - check origin header
	const origin = request.headers.get('origin');
	const host = request.headers.get('host');
	if (origin && host && !origin.includes(host)) {
		throw error(403, 'CSRF validation failed');
	}

	// Optional: Auth check (uncomment when auth is implemented)
	// if (!locals.user) {
	// 	throw error(401, 'Authentication required');
	// }

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	// Validate input with Zod
	const validation = safeValidateSceneData(body);
	if (!validation.success) {
		const errorMessage = validation.error.issues.map((e) => e.message).join(', ');
		throw error(400, `Validation error: ${errorMessage}`);
	}

	const sceneData = validation.data;

	// Ensure URL param matches body ID
	if (sceneData.id !== id) {
		throw error(400, 'Scene ID in URL must match ID in body');
	}

	try {
		await query(
			`
      INSERT INTO scenes (id, data)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `,
			[id, sceneData]
		);

		return json({ ok: true });
	} catch (err) {
		console.error('Database error in PUT /api/scenes:', err);
		throw error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, request, getClientAddress, locals }) => {
	const id = params.id;

	// Validate UUID format
	if (!validateUUID(id)) {
		throw error(400, 'Invalid scene ID format');
	}

	// Rate limiting
	const clientId = getClientAddress();
	if (!checkRateLimit(clientId)) {
		throw error(429, 'Too many requests. Please try again later.');
	}

	// CSRF protection
	const origin = request.headers.get('origin');
	const host = request.headers.get('host');
	if (origin && host && !origin.includes(host)) {
		throw error(403, 'CSRF validation failed');
	}

	// Optional: Auth check (uncomment when auth is implemented)
	// if (!locals.user) {
	// 	throw error(401, 'Authentication required');
	// }

	try {
		const result = await query('DELETE FROM scenes WHERE id = $1 RETURNING id', [id]);

		if (!result.length) {
			throw error(404, 'Scene not found');
		}

		return json({ ok: true });
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Database error in DELETE /api/scenes:', err);
		throw error(500, 'Internal server error');
	}
};
