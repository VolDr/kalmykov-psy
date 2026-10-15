import { json } from '@sveltejs/kit';
import { MAILOPOST_API_TOKEN } from '$env/static/private';
import { subscriberService } from '$lib/server/subscriber.server';

export async function POST({ request, url }) {
	console.log('POST: Start subscription process');
	const { email } = await request.json();
	console.log('POST: Received email:', email);

	if (!email || !email.includes('@')) {
		console.log('POST: Invalid email provided');
		return json({ error: 'Invalid email' }, { status: 400 });
	}

	try {
		console.log('POST: Calling upsertPending for email:', email);
		const record = await subscriberService.upsertPending(email);
		console.log('POST: Received record from upsertPending:', record);

		const confirmLink = `${url.origin}/confirm?token=${record.token}`;
		console.log('POST: Generated confirmLink:', confirmLink);

		console.log('POST: Sending request to Mailopost API');
		const response = await fetch(`https://api.mailopost.ru/v1/email/templates/1850796/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${MAILOPOST_API_TOKEN}`
			},
			body: JSON.stringify({
				to: email,
				params: { confirm_link: confirmLink }
			})
		});

		console.log('POST: Mailopost response status:', response.status);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('POST: Mailopost error data:', errorData);
			throw new Error(`Ошибка Mailopost: ${response.status}`);
		}

		console.log('POST: Successfully sent subscription email');
		return json({ success: true });
	} catch (error: any) {
		console.error('POST: CATCH ERROR:', error.message || error);
		return json({ error: error.message || 'Внутренняя ошибка сервера' }, { status: 500 });
	}
}
