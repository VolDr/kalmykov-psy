import { z } from 'zod';
import { MAILOPOST_API_TOKEN } from '$app/env/private';
import { subscriberService } from '#lib/server/subscriber.server.js';
import { consumeLimit, limits, limitResponse } from '#lib/server/request-limits.server.js';
import type { RequestHandler } from './$types';

const schema = z.object({ email: z.email().max(254) }).strict();

export const POST: RequestHandler = async ({ request, url }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) return Response.json({ error: 'Некорректный email' }, { status: 400 });
	const { email } = parsed.data;
	try {
		const limit = await consumeLimit(limits.mailRecipient, email.toLowerCase());
		if (!limit.allowed) return limitResponse(limit);
		const record = await subscriberService.upsertPending(email);
		if (!record.token) throw new Error('Confirmation token unavailable');
		const confirmLink = new URL('/confirm', url.origin);
		confirmLink.searchParams.set('token', record.token);
		const response = await fetch('https://api.mailopost.ru/v1/email/templates/1850796/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + MAILOPOST_API_TOKEN
			},
			body: JSON.stringify({ to: email, params: { confirm_link: confirmLink.href } }),
			signal: AbortSignal.timeout(10_000)
		});
		if (!response.ok) {
			console.error('[subscription] mail failed', { status: response.status });
			return Response.json(
				{ error: 'Не удалось отправить письмо. Попробуйте позже.' },
				{ status: 502 }
			);
		}
		return Response.json({ success: true });
	} catch {
		console.error('[subscription] request failed');
		return Response.json(
			{ error: 'Сервис временно недоступен. Попробуйте позже.' },
			{ status: 503 }
		);
	}
};
