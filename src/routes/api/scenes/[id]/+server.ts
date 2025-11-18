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
	const startTime = Date.now();

	console.log(`[GET /api/scenes/${id}] Request started`);

	// Validate UUID format
	if (!validateUUID(id)) {
		console.log(`[GET /api/scenes/${id}] Invalid UUID format`);
		throw error(400, 'Invalid scene ID format');
	}

	// Rate limiting
	const clientId = getClientAddress();
	if (!checkRateLimit(clientId)) {
		console.log(`[GET /api/scenes/${id}] Rate limit exceeded for ${clientId}`);
		throw error(429, 'Too many requests. Please try again later.');
	}

	// Optional: Auth check (uncomment when auth is implemented)
	// if (!locals.user) {
	// 	throw error(401, 'Authentication required');
	// }

	try {
		console.log(`[GET /api/scenes/${id}] Querying database...`);
		const rows = await query<{ data: SceneData }>('SELECT data FROM scenes WHERE id = $1', [id]);
		const queryTime = Date.now() - startTime;
		console.log(`[GET /api/scenes/${id}] Database query completed in ${queryTime}ms`);

		if (!rows.length) {
			console.log(`[GET /api/scenes/${id}] Scene not found in database`);
			throw error(404, 'Scene not found');
		}

		console.log(
			`[GET /api/scenes/${id}] Success, returning data (${JSON.stringify(rows[0].data).length} bytes)`
		);
		return json(rows[0].data);
	} catch (err) {
		// Check if it's a SvelteKit HttpError (has status property)
		if (err && typeof err === 'object' && 'status' in err) {
			console.log(`[GET /api/scenes/${id}] SvelteKit error:`, err);
			throw err; // Re-throw SvelteKit errors (including 404)
		}
		console.error(`[GET /api/scenes/${id}] Database error:`, err);
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
		console.log(`[${id}] Step 1: Parsing JSON body...`);
		body = await request.json();
		console.log(
			`[${id}] Step 2: JSON parsed successfully:`,
			JSON.stringify(body).substring(0, 200)
		);
	} catch (err) {
		console.error(`[${id}] Step 2 FAILED: JSON parse error:`, err);
		throw error(400, 'Invalid JSON body');
	}

	// Validate input with Zod
	console.log(`[${id}] Step 3: Starting Zod validation...`);
	console.log(`[${id}] Step 3a: Body type:`, typeof body);
	console.log(
		`[${id}] Step 3b: Body keys:`,
		body && typeof body === 'object' ? Object.keys(body) : 'N/A'
	);

	let validation;
	try {
		validation = safeValidateSceneData(body);
		console.log(`[${id}] Step 4: Validation completed, success:`, validation.success);
	} catch (err) {
		console.error(`[${id}] Step 4 FAILED: Validation threw error:`, err);
		console.error(`[${id}] Error stack:`, err instanceof Error ? err.stack : 'No stack');
		throw error(500, `Validation crashed: ${err instanceof Error ? err.message : String(err)}`);
	}

	if (!validation.success) {
		console.error(
			`[${id}] Step 5: Validation failed with issues:`,
			JSON.stringify(validation.error.issues, null, 2)
		);
		const errorMessage = validation.error.issues.map((e) => e.message).join(', ');
		throw error(400, `Validation error: ${errorMessage}`);
	}

	console.log(`[${id}] Step 5: Validation successful`);
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
