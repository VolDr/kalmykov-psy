import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and, ne, sql } from 'drizzle-orm';
import { db } from '../../..';
import { leadMagnetEvents } from '../../../db/schema';
import { sendSaleBotCallback } from '$lib/server/salebot.server';

const ALLOWED_LEAD_MAGNETS = ['otpusk'] as const;
const ALLOWED_EVENTS = ['opened', 'read75'] as const;

type LeadMagnet = (typeof ALLOWED_LEAD_MAGNETS)[number];
type EventName = (typeof ALLOWED_EVENTS)[number];

function buildPayload(clientId: number, leadMagnet: LeadMagnet, event: EventName) {
	if (event === 'read75') {
		return {
			client_id: clientId,
			message: 'lm_otpusk_read75',
			lm_otpusk_read75: 1,
			lm_otpusk_stage: 'after_read',
			lm_otpusk_progress: 75
		};
	}
	return {
		client_id: clientId,
		message: 'lm_otpusk_opened',
		lm_otpusk_opened: 1,
		lm_otpusk_stage: 'opened'
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { clientId: rawClientId, leadMagnet, event, progress } = body as Record<string, unknown>;

	// Validate clientId — must be a positive safe integer
	const clientIdNum = Number(rawClientId);
	if (!Number.isSafeInteger(clientIdNum) || clientIdNum <= 0) {
		return json({ error: 'Invalid clientId' }, { status: 400 });
	}

	// Validate leadMagnet
	if (!(ALLOWED_LEAD_MAGNETS as readonly unknown[]).includes(leadMagnet)) {
		return json({ error: 'Invalid leadMagnet' }, { status: 400 });
	}

	// Validate event
	if (!(ALLOWED_EVENTS as readonly unknown[]).includes(event)) {
		return json({ error: 'Invalid event' }, { status: 400 });
	}

	// Validate progress for read75
	if (event === 'read75') {
		const progressNum = Number(progress);
		if (!Number.isFinite(progressNum) || progressNum < 75) {
			return json({ error: 'progress must be >= 75 for read75' }, { status: 400 });
		}
	}

	try {
		// Atomically create the event record if it doesn't exist yet,
		// or return the existing one unchanged (no-op update forces RETURNING on conflict).
		const [record] = await db
			.insert(leadMagnetEvents)
			.values({
				clientId: clientIdNum,
				leadMagnet: leadMagnet as string,
				eventName: event as string,
				status: 'pending',
				attempts: 0
			})
			.onConflictDoUpdate({
				target: [leadMagnetEvents.clientId, leadMagnetEvents.leadMagnet, leadMagnetEvents.eventName],
				// No-op SET — preserves existing row, forces RETURNING to work on conflict
				set: { status: sql`lead_magnet_events.status` }
			})
			.returning();

		if (record.status === 'sent') {
			return json({ success: true, duplicate: true });
		}

		// Atomically increment attempts.
		// If 0 rows returned, the status became 'sent' in a concurrent request.
		const acquired = await db
			.update(leadMagnetEvents)
			.set({ attempts: sql`${leadMagnetEvents.attempts} + 1` })
			.where(
				and(eq(leadMagnetEvents.id, record.id), ne(leadMagnetEvents.status, 'sent'))
			)
			.returning({ id: leadMagnetEvents.id });

		if (acquired.length === 0) {
			return json({ success: true, processing: true });
		}

		const payload = buildPayload(clientIdNum, leadMagnet as LeadMagnet, event as EventName);

		try {
			await sendSaleBotCallback(payload);

			await db
				.update(leadMagnetEvents)
				.set({ status: 'sent', sentAt: sql`NOW()` })
				.where(eq(leadMagnetEvents.id, record.id));

			return json({ success: true });
		} catch (saleBotErr) {
			const errMsg = saleBotErr instanceof Error ? saleBotErr.message : String(saleBotErr);

			await db
				.update(leadMagnetEvents)
				.set({ status: 'failed', lastError: errMsg })
				.where(eq(leadMagnetEvents.id, record.id));

			return json({ error: 'SaleBot callback failed' }, { status: 502 });
		}
	} catch (dbErr) {
		console.error('[lm-progress] DB error:', dbErr);
		return json({ error: 'Database error' }, { status: 500 });
	}
};
