import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '../../index';

export const limits = {
	loginIp: { name: 'login-ip', count: 20, seconds: 900 },
	loginAccount: { name: 'login-account', count: 10, seconds: 900 },
	mailIp: { name: 'mail-ip', count: 5, seconds: 600 },
	mailRecipient: { name: 'mail-recipient', count: 1, seconds: 600 },
	analytics: { name: 'analytics', count: 120, seconds: 60 },
	quiz: { name: 'quiz', count: 10, seconds: 600 },
	progress: { name: 'progress', count: 30, seconds: 60 },
	booking: { name: 'booking', count: 5, seconds: 60 },
	bookingStatus: { name: 'booking-status', count: 60, seconds: 60 },
	surveyRead: { name: 'survey-read', count: 60, seconds: 60 },
	surveyWrite: { name: 'survey-write', count: 10, seconds: 60 },
	// Страница перевода: заходы + автосохранение (не чаще раза в ~1 с при наборе)
	translation: { name: 'translation', count: 120, seconds: 60 }
} as const;

export type LimitPolicy = {
	readonly name: string;
	readonly count: number;
	readonly seconds: number;
};
export type LimitResult = { allowed: boolean; retryAfter: number };
let nextCleanup = 0;

/** Atomic shared counters: every worker and restart uses the same database clock. */
export async function consumeLimit(policy: LimitPolicy, subject: string): Promise<LimitResult> {
	const key = createHash('sha256').update(`${policy.name}\0${subject}`).digest('hex');
	const result = await db.execute<{ allowed: boolean; retry_after: number }>(sql`
		INSERT INTO security_rate_limits (key_hash, hits, reset_at)
		VALUES (${key}, 1, now() + ${policy.seconds} * interval '1 second')
		ON CONFLICT (key_hash) DO UPDATE SET
			hits = CASE WHEN security_rate_limits.reset_at <= now() THEN 1
				ELSE LEAST(security_rate_limits.hits + 1, ${policy.count + 1}) END,
			reset_at = CASE WHEN security_rate_limits.reset_at <= now()
				THEN now() + ${policy.seconds} * interval '1 second'
				ELSE security_rate_limits.reset_at END
		RETURNING hits <= ${policy.count} AS allowed,
			GREATEST(1, CEIL(EXTRACT(EPOCH FROM reset_at - now())))::integer AS retry_after
	`);
	const row = result.rows[0];
	if (!row) throw new Error('Rate limit counter unavailable');

	// A failed cleanup never weakens enforcement. Keep live counters across restarts.
	if (Date.now() >= nextCleanup) {
		nextCleanup = Date.now() + 60_000;
		void db
			.execute(sql`DELETE FROM security_rate_limits WHERE reset_at < now() - interval '1 day'`)
			.catch(() => console.error('[rate-limit] cleanup failed'));
	}
	return { allowed: row.allowed, retryAfter: row.retry_after };
}

export function limitResponse(result: LimitResult): Response {
	return Response.json(
		{ error: 'Слишком много запросов. Попробуйте позже.' },
		{
			status: 429,
			headers: { 'Retry-After': String(result.retryAfter), 'Cache-Control': 'no-store' }
		}
	);
}
