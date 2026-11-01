
import type { RequestHandler } from './$types';
import { createPayment } from '#lib/server/robokassa.server.js';
import { getPricing } from '#lib/server/pricing.server.js';
import { toPaymentAmount } from '#lib/pricing.js';
import { isRateLimited } from '#lib/server/rate-limit.server.js';

const PRODUCTS = {
	single: {
		description: 'Психологическая консультация'
	},
	package: {
		description: 'Пакет психологических консультаций'
	}
} as const;

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const ip = getClientAddress();
	if (isRateLimited(ip)) {
		return Response.json({ error: 'Слишком много запросов. Попробуйте через минуту.' }, { status: 429 });
	}

	const { email, product } = await request.json();

	const trimmedEmail = String(email ?? '').trim();

	if (!trimmedEmail) {
		return Response.json({ error: 'Введите email' }, { status: 400 });
	}
	if (trimmedEmail.length > 254 || !trimmedEmail.includes('@')) {
		return Response.json({ error: 'Некорректный email' }, { status: 400 });
	}

	const prod = PRODUCTS[product as keyof typeof PRODUCTS];
	if (!prod) {
		return Response.json({ error: 'Неверный тип продукта' }, { status: 400 });
	}

	const prices = await getPricing();
	const payment = await createPayment({
		outSum: toPaymentAmount(prices[product as keyof typeof PRODUCTS]),
		description: prod.description,
		email: trimmedEmail,
		successUrl: `${url.origin}/booking/success`,
		failUrl: `${url.origin}/booking/fail`
	});

	return Response.json(payment);
};
