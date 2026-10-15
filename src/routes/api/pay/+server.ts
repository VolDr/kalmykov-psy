import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPayment } from '$lib/server/robokassa.server';
import { getPricing } from '$lib/server/pricing.server';
import { toPaymentAmount } from '$lib/pricing';
import { isRateLimited } from '$lib/server/rate-limit.server';

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
		return json({ error: 'Слишком много запросов. Попробуйте через минуту.' }, { status: 429 });
	}

	const { email, product } = await request.json();

	const trimmedEmail = String(email ?? '').trim();

	if (!trimmedEmail) {
		return json({ error: 'Введите email' }, { status: 400 });
	}
	if (trimmedEmail.length > 254 || !trimmedEmail.includes('@')) {
		return json({ error: 'Некорректный email' }, { status: 400 });
	}

	const prod = PRODUCTS[product as keyof typeof PRODUCTS];
	if (!prod) {
		return json({ error: 'Неверный тип продукта' }, { status: 400 });
	}

	const prices = await getPricing();
	const payment = await createPayment({
		outSum: toPaymentAmount(prices[product as keyof typeof PRODUCTS]),
		description: prod.description,
		email: trimmedEmail,
		successUrl: `${url.origin}/booking/success`,
		failUrl: `${url.origin}/booking/fail`
	});

	return json(payment);
};
