import type { RequestEvent } from '@sveltejs/kit';
import { consumeLimit, limits, limitResponse, type LimitPolicy } from './request-limits.server';
import { requireAuth } from './protected';

const publicWrites: Record<string, { policy: LimitPolicy; bytes: number }> = {
	'/api/subscribe': { policy: limits.mailIp, bytes: 2048 },
	'/useful/burnout-questionnaire': { policy: limits.mailIp, bytes: 16_384 },
	'/api/analytics': { policy: limits.analytics, bytes: 8192 },
	'/api/quiz-results': { policy: limits.quiz, bytes: 16_384 },
	'/api/lm-progress': { policy: limits.progress, bytes: 2048 },
	'/api/booking': { policy: limits.booking, bytes: 4096 },
	'/api/booking/acquaintance': { policy: limits.booking, bytes: 4096 },
	'/api/pay': { policy: limits.booking, bytes: 4096 }
};

export function isAdminRequest(event: Pick<RequestEvent, 'route' | 'url'>): boolean {
	// route.id also covers encoded paths and SvelteKit's __data.json requests.
	return [event.route.id, event.url.pathname].some(
		(path) => path === '/admin' || path?.startsWith('/admin/')
	);
}

/** Buffer only small public forms/JSON. Never consume webhook or file-upload bodies. */
async function capBody(event: RequestEvent, maxBytes: number): Promise<Response | null> {
	const original = event.request;
	const declared = Number(original.headers.get('content-length'));
	const tooLarge = () => Response.json({ error: 'Запрос слишком большой' }, { status: 413 });
	if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();
	if (!original.body) return null;
	const reader = original.clone().body!.getReader();
	let length = 0;
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			length += chunk.value.byteLength;
			if (length > maxBytes) {
				void reader.cancel().catch(() => {});
				void original.body.cancel().catch(() => {});
				return tooLarge();
			}
		}
	} finally {
		reader.releaseLock();
	}
	return null;
}

/** Runs before resolve(), including before any layout, data load or form action. */
export async function protectRequest(event: RequestEvent): Promise<Response | null> {
	if (isAdminRequest(event)) {
		requireAuth(event);
		return null;
	}
	const path = (event.route.id ?? event.url.pathname).replace(/\/$/, '');
	const isPost = event.request.method === 'POST';
	let rule = isPost && Object.hasOwn(publicWrites, path) ? publicWrites[path] : undefined;
	if (event.route.id === '/[code]') {
		rule = { policy: isPost ? limits.surveyWrite : limits.surveyRead, bytes: 4096 };
	} else if (
		event.route.id === '/translate/[token]' ||
		event.route.id === '/translate/[token]/save'
	) {
		// 10 правок × 5000 символов кириллицы ≈ 100 КБ
		rule = { policy: limits.translation, bytes: 131_072 };
	} else if (!isPost && path === '/api/booking/status') {
		rule = { policy: limits.bookingStatus, bytes: 0 };
	}
	if (isPost && path === '/login') return capBody(event, 4096);
	if (!rule) return null;
	if (isPost) {
		const response = await capBody(event, rule.bytes);
		if (response) return response;
	}
	try {
		const result = await consumeLimit(rule.policy, event.getClientAddress());
		return result.allowed ? null : limitResponse(result);
	} catch {
		// Do not silently fail open when the shared store or migration is missing.
		return Response.json(
			{ error: 'Сервис временно недоступен. Попробуйте позже.' },
			{
				status: 503,
				headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' }
			}
		);
	}
}
