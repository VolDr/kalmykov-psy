import { MAILOPOST_API_TOKEN } from '$app/env/private';
import { subscriberService } from '#lib/server/subscriber.server.js';

const MAILOPOST_LIST_ID = '742243';

export async function load({ url }) {
	const token = url.searchParams.get('token');

	if (!token) {
		return { success: false, message: 'Ссылка недействительна или устарела.' };
	}

	try {
		const result = await subscriberService.confirmByToken(token);

		if (!result.record) {
			return { success: false, message: 'Произошла ошибка или подписка уже подтверждена.' };
		}

		if (result.isNew) {
			const email = result.record.email;

			const subscribeResponse = await fetch(
				`https://api.mailopost.ru/v1/email/lists/${MAILOPOST_LIST_ID}/recipients`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${MAILOPOST_API_TOKEN}`
					},
					body: JSON.stringify({ email }),
					signal: AbortSignal.timeout(10_000)
				}
			);

			if (!subscribeResponse.ok) {
				console.error('[subscription] Mailopost failed', { status: subscribeResponse.status });
				throw new Error('Ошибка добавления в список рассылки');
			}
		}

		return { success: true };
	} catch (error) {
		console.error('[subscription] confirmation failed');
		return { success: false, message: 'Не удалось подтвердить подписку. Попробуйте позже.' };
	}
}
