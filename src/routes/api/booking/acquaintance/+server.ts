
import type { RequestHandler } from './$types';
import { createAcquaintanceBooking } from '#lib/server/booking.server.js';
import { isRateLimited } from '#lib/server/rate-limit.server.js';
import { addTagsToContact, getContactByPublicId } from '#lib/server/bot-contacts.server.js';
import { triggerScenarioByKey } from '#lib/server/bot-scenarios.server.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (isRateLimited(ip)) {
		return Response.json({ error: 'Слишком много запросов. Попробуйте через минуту.' }, { status: 429 });
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let body: any;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
	}
	const { availabilityId, bookedAt, telegram, email, sbClientId: rawSbClientId } = body;

	const availabilityIdNum = parseInt(String(availabilityId ?? ''), 10);
	if (isNaN(availabilityIdNum) || availabilityIdNum <= 0 || !bookedAt || !telegram?.trim()) {
		return Response.json({ error: 'Заполните все поля' }, { status: 400 });
	}

	if (telegram.trim().length > 64) {
		return Response.json({ error: 'Telegram слишком длинный' }, { status: 400 });
	}

	if (email?.trim() && (email.trim().length > 254 || !email.includes('@'))) {
		return Response.json({ error: 'Некорректный email' }, { status: 400 });
	}

	if (isNaN(new Date(bookedAt).getTime())) {
		return Response.json({ error: 'Некорректное время слота' }, { status: 400 });
	}

	// Parse sbClientId (id контакта нашего бота) — optional, skip bot trigger if absent or invalid
	const sbClientIdNum =
		rawSbClientId != null &&
		(typeof rawSbClientId === 'number' || typeof rawSbClientId === 'string')
			? Number(rawSbClientId)
			: null;
	const validSbClientId =
		sbClientIdNum !== null && Number.isSafeInteger(sbClientIdNum) && sbClientIdNum > 0
			? sbClientIdNum
			: null;

	try {
		await createAcquaintanceBooking({
			availabilityId: availabilityIdNum,
			bookedAt,
			clientName: telegram.trim(),
			email: email?.trim(),
			sbClientId: validSbClientId
		});

		// Тег + сценарий intro_booked в нашем боте после подтверждённой брони (non-blocking).
		// sbClientId — публичный id контакта бота
		if (validSbClientId !== null) {
			getContactByPublicId(validSbClientId)
				.then(async (contact) => {
					if (!contact) return;
					await addTagsToContact(contact.id, ['intro_booked']);
					await triggerScenarioByKey('intro_booked', contact.id);
				})
				.catch((e) => console.error('[bot] intro_booked trigger failed:', e));
		}

		return Response.json({ success: true, bookedAt });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ошибка сервера';
		const isServerError = message === 'Ошибка сервера. Попробуйте ещё раз.';
		return Response.json({ error: message }, { status: isServerError ? 500 : 400 });
	}
};
