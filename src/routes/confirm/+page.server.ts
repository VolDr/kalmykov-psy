import { MAILOPOST_API_TOKEN } from '$env/static/private';
import { subscriberService } from '$lib/server/subscriber.server';

const MAILOPOST_LIST_ID = '742243';

export async function load({ url }) {
	const token = url.searchParams.get('token');

	console.log('LOAD: Token from URL:', token);

	if (!token) {
		console.log('LOAD: No token provided');
		return { success: false, message: 'Ссылка недействительна или устарела.' };
	}

	try {
		const result = await subscriberService.confirmByToken(token);

		console.log('LOAD: Result from confirmByToken:', result);

		if (!result.record) {
			console.log('LOAD: Record is null');
			return { success: false, message: 'Произошла ошибка или подписка уже подтверждена.' };
		}

		if (result.isNew) {
			const email = result.record.email;
			console.log('LOAD: Sending to Mailopost:', email);

			const subscribeResponse = await fetch(
				`https://api.mailopost.ru/v1/email/lists/${MAILOPOST_LIST_ID}/recipients`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${MAILOPOST_API_TOKEN}`
					},
					body: JSON.stringify({ email: email })
				}
			);

			console.log('LOAD: Mailopost status:', subscribeResponse.status);

			if (!subscribeResponse.ok) {
				const errorDetails = await subscribeResponse.text();
				console.error('LOAD: Mailopost error:', errorDetails);
				throw new Error('Ошибка добавления в список рассылки');
			}
		} else {
			console.log('LOAD: isNew is false, skipping Mailopost');
		}

		return { success: true };
	} catch (error) {
		console.error('LOAD: Error caught:', error);
		const message = error instanceof Error ? error.message : 'Неизвестная ошибка сервера';
		return { success: false, message };
	}
}
