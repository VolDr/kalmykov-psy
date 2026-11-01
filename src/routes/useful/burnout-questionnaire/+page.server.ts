import { fail } from '@sveltejs/kit';
import { MAILOPOST_API_TOKEN } from '$app/env/private';
import type { PageServerLoad } from './$types';
import { z } from 'zod';
import { scoreBat23 } from '#lib/server/quiz-scoring.server.js';
import { consumeLimit, limits } from '#lib/server/request-limits.server.js';

// Сначала cookie (установлен /go/q/[clientId]), фоллбэк — URL-параметр
export const load: PageServerLoad = async ({ cookies, url }) => {
	const raw = cookies.get('sb_client_id') ?? url.searchParams.get('sb_client_id');
	const parsed = raw ? parseInt(raw, 10) : null;
	const sbClientId = parsed && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
	// ?to=acquaintance — ссылка из бота, ведёт в блок «Что делать дальше» под результатами
	const toAcquaintance = url.searchParams.get('to') === 'acquaintance';
	return { sbClientId, toAcquaintance };
};

export const actions = {
	sendResults: async ({ request, setHeaders }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim();
		if (!z.email().max(254).safeParse(email).success || !email)
			return fail(400, { success: false });
		let answers: unknown;
		try {
			answers = JSON.parse(String(data.get('answers') ?? ''));
		} catch {
			return fail(400, { success: false });
		}
		const score = scoreBat23(answers);
		if (!score) return fail(400, { success: false });
		try {
			const limit = await consumeLimit(limits.mailRecipient, email.toLowerCase());
			if (!limit.allowed) {
				setHeaders({ 'Retry-After': String(limit.retryAfter) });
				return fail(429, { success: false });
			}
			const colors: Record<string, string> = {
				green: '#10b981',
				orange: '#f59e0b',
				red: '#ef4444'
			};
			const params: Record<string, string> = {
				score: score.averageScore?.toFixed(2) ?? String(score.totalScore),
				severity: score.interpretation.severity,
				total_recommendation: score.interpretation.recommendation,
				color: colors[score.interpretation.color] ?? '#191919'
			};
			(score.subscales ?? []).forEach((sub, i) => {
				params['sub' + i + '_name'] = sub.name;
				params['sub' + i + '_score'] = sub.averageScore?.toFixed(2) ?? String(sub.score);
				params['sub' + i + '_severity'] = sub.interpretation.severity;
				params['sub' + i + '_desc'] = sub.description ?? '';
				params['sub' + i + '_color'] = colors[sub.interpretation.color] ?? '#191919';
			});
			const response = await fetch('https://api.mailopost.ru/v1/email/templates/1850507/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + MAILOPOST_API_TOKEN
				},
				body: JSON.stringify({ to: email, params }),
				signal: AbortSignal.timeout(10_000)
			});
			if (!response.ok) {
				console.error('[quiz-mail] delivery failed', { status: response.status });
				return fail(502, { success: false });
			}
			return { success: true };
		} catch {
			console.error('[quiz-mail] request failed');
			return fail(503, { success: false });
		}
	}
} satisfies import('./$types').Actions;
