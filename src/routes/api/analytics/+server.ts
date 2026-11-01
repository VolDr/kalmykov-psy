import { z } from 'zod';
import { db } from '../../../index';
import { analyticsEvents } from '../../../db/schema';
import type { RequestHandler } from './$types';

const scalar = z.union([z.string().max(512), z.number().finite(), z.boolean(), z.null()]);
const eventSchema = z
	.object({
		goal: z
			.string()
			.min(1)
			.max(100)
			.regex(/^[a-zA-Z0-9_-]+$/),
		sessionId: z.string().max(128).nullish(),
		page: z.string().max(2048).startsWith('/').nullish(),
		params: z
			.record(z.string().max(64), scalar)
			.refine((p) => Object.keys(p).length <= 20)
			.nullish()
	})
	.strict();
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const parsed = eventSchema.safeParse(body);
	if (!parsed.success) return Response.json({ error: 'Invalid event' }, { status: 400 });
	const { goal, sessionId, page, params } = parsed.data;
	await db
		.insert(analyticsEvents)
		.values({ goal, sessionId: sessionId ?? null, page: page ?? null, params: params ?? null });
	return Response.json({ ok: true });
};
