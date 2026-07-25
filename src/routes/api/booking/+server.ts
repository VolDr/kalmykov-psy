import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBooking, CONSULTATION_PRICE, PACKAGE_PRICE } from '$lib/server/booking.server';
import { isRateLimited } from '$lib/server/rate-limit.server';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const ip = getClientAddress();
	if (isRateLimited(ip)) {
		return json({ error: 'Слишком много запросов. Попробуйте через минуту.' }, { status: 429 });
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let body: any;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Некорректный запрос' }, { status: 400 });
	}
	const { availabilityId, bookedAt, clientName, email, type, sbClientId: rawSbClientId } = body;

	const availabilityIdNum = parseInt(String(availabilityId ?? ''), 10);
	if (isNaN(availabilityIdNum) || availabilityIdNum <= 0 || !bookedAt || !clientName?.trim() || !email?.trim()) {
		return json({ error: 'Заполните все поля' }, { status: 400 });
	}

	if (clientName.trim().length > 100) {
		return json({ error: 'Имя слишком длинное' }, { status: 400 });
	}

	if (email.trim().length > 254 || !email.includes('@')) {
		return json({ error: 'Некорректный email' }, { status: 400 });
	}

	if (isNaN(new Date(bookedAt).getTime())) {
		return json({ error: 'Некорректное время слота' }, { status: 400 });
	}

	const outSum = type === 'package' ? PACKAGE_PRICE : CONSULTATION_PRICE;

	const sbClientIdNum =
		rawSbClientId != null && (typeof rawSbClientId === 'number' || typeof rawSbClientId === 'string')
			? Number(rawSbClientId)
			: null;
	const validSbClientId =
		sbClientIdNum !== null && Number.isSafeInteger(sbClientIdNum) && sbClientIdNum > 0
			? sbClientIdNum
			: null;

	try {
		const payment = await createBooking({
			availabilityId: availabilityIdNum,
			bookedAt,
			clientName: clientName.trim(),
			email: email.trim(),
			originUrl: url.origin,
			outSum,
			sbClientId: validSbClientId
		});
		return json(payment);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ошибка сервера';
		return json({ error: message }, { status: 400 });
	}
};
