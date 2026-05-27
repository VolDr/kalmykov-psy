import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBooking, CONSULTATION_PRICE, PACKAGE_PRICE } from '$lib/server/booking.server';
import { isRateLimited } from '$lib/server/rate-limit.server';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const ip = getClientAddress();
	if (isRateLimited(ip)) {
		return json({ error: 'Слишком много запросов. Попробуйте через минуту.' }, { status: 429 });
	}

	const { availabilityId, bookedAt, telegram, email, type } = await request.json();
	const outSum = type === 'package' ? PACKAGE_PRICE : CONSULTATION_PRICE;

	const availabilityIdNum = parseInt(String(availabilityId ?? ''), 10);
	if (isNaN(availabilityIdNum) || !bookedAt || !telegram?.trim() || !email?.trim()) {
		return json({ error: 'Заполните все поля' }, { status: 400 });
	}

	if (telegram.trim().length > 64) {
		return json({ error: 'Telegram слишком длинный' }, { status: 400 });
	}

	if (email.trim().length > 254 || !email.includes('@')) {
		return json({ error: 'Некорректный email' }, { status: 400 });
	}

	if (isNaN(new Date(bookedAt).getTime())) {
		return json({ error: 'Некорректное время слота' }, { status: 400 });
	}

	try {
		const payment = await createBooking({
			availabilityId: availabilityIdNum,
			bookedAt,
			clientName: telegram.trim(),
			email: email.trim(),
			originUrl: url.origin,
			outSum
		});
		return json(payment);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ошибка сервера';
		return json({ error: message }, { status: 400 });
	}
};
