import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and, ne, sql } from 'drizzle-orm';
import { db } from '../../..';
import { leadMagnetEvents } from '../../../db/schema';
import { addTagsToContact, getContact } from '$lib/server/bot-contacts.server';
import { triggerScenarioByKey } from '$lib/server/bot-scenarios.server';

// Чтобы подключить новый лид-магнит, достаточно добавить его сюда.
// На событие контакту вешается тег lm_<name>_<event>, и если существует включённый
// сценарий с триггером «Диплинк /start=» и значением lm_<name>_<event> — он запускается
// (например, lm_focus_read75 → послечтенческая прогревочная серия).
const ALLOWED_LEAD_MAGNETS = ['otpusk', 'focus', 'burnout'] as const;
const ALLOWED_EVENTS = ['opened', 'read75'] as const;

// read75 повторно обрабатываем не чаще раза в N дней на контакт (см. ветку read75 ниже).
const READ75_RESEND_AFTER_DAYS = 14;

type LeadMagnet = (typeof ALLOWED_LEAD_MAGNETS)[number];
type EventName = (typeof ALLOWED_EVENTS)[number];

/** Тег на контакт + запуск сценария по ключу события (если такой сценарий настроен). */
async function processLeadMagnetEvent(
	contactId: number,
	leadMagnet: LeadMagnet,
	event: EventName
): Promise<void> {
	const key = `lm_${leadMagnet}_${event}`;
	await addTagsToContact(contactId, [key]);
	await triggerScenarioByKey(key, contactId);
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	// contactId (id из bot_contacts) берётся из HttpOnly cookie, установленного /go/*
	// (в ссылках из бота используется подстановка {contact_id}), не из тела запроса
	const rawCookie = cookies.get('sb_client_id');
	const contactId = rawCookie ? parseInt(rawCookie, 10) : NaN;
	if (!Number.isSafeInteger(contactId) || contactId <= 0) {
		return json({ ok: true, skipped: true });
	}

	// Старые куки ещё содержат Salebot-ID — контакта с таким id у нас нет, скипаем
	const contact = await getContact(contactId);
	if (!contact) {
		return json({ ok: true, skipped: true });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { leadMagnet, event, progress } = body as Record<string, unknown>;

	// Validate leadMagnet
	if (!(ALLOWED_LEAD_MAGNETS as readonly unknown[]).includes(leadMagnet)) {
		return json({ error: 'Invalid leadMagnet' }, { status: 400 });
	}

	// Validate event
	if (!(ALLOWED_EVENTS as readonly unknown[]).includes(event)) {
		return json({ error: 'Invalid event' }, { status: 400 });
	}

	// Validate progress for read75
	if (event === 'read75') {
		const progressNum = Number(progress);
		if (!Number.isFinite(progressNum) || progressNum < 75) {
			return json({ error: 'progress must be >= 75 for read75' }, { status: 400 });
		}
	}

	// read75 — дедуп с окном 2 недели.
	// Внутри окна повторно НЕ обрабатываем: иначе сценарий заново запустит
	// послечтенческую прогревочную серию на каждый повторный заход и прочтение.
	// Если read75 ещё не обрабатывали или прошло ≥ 2 недель — обрабатываем снова
	// и обновляем sent_at (окно сдвигается от последней обработки).
	// Спам в рамках одной загрузки страницы дополнительно гасит клиент (флаг read75Sent).
	if (event === 'read75') {
		// Свежесть проверяем прямо в SQL (NOW() - make_interval), а не в JS:
		// sent_at приходит из node-postgres строкой (mode:'string'), и парсить её через
		// new Date() ненадёжно. Строка возвращается только если есть успешный read75,
		// обработанный менее READ75_RESEND_AFTER_DAYS назад → значит это дубль.
		const [recent] = await db
			.select({ id: leadMagnetEvents.id })
			.from(leadMagnetEvents)
			.where(
				and(
					eq(leadMagnetEvents.clientId, contactId),
					eq(leadMagnetEvents.leadMagnet, leadMagnet as string),
					eq(leadMagnetEvents.eventName, 'read75'),
					eq(leadMagnetEvents.status, 'sent'),
					sql`${leadMagnetEvents.sentAt} > NOW() - make_interval(days => ${READ75_RESEND_AFTER_DAYS})`
				)
			)
			.limit(1);

		if (recent) {
			return json({ success: true, duplicate: true });
		}

		try {
			await processLeadMagnetEvent(contactId, leadMagnet as LeadMagnet, 'read75');
		} catch (err) {
			console.error('[lm-progress] Ошибка обработки read75:', err);
			return json({ error: 'Event processing failed' }, { status: 500 });
		}

		// Отмечаем обработку (сбрасывает 2-недельное окно). Best-effort, на ответ не влияет.
		try {
			await db
				.insert(leadMagnetEvents)
				.values({
					clientId: contactId,
					leadMagnet: leadMagnet as string,
					eventName: 'read75',
					status: 'sent',
					attempts: 1,
					sentAt: sql`NOW()`
				})
				.onConflictDoUpdate({
					target: [leadMagnetEvents.clientId, leadMagnetEvents.leadMagnet, leadMagnetEvents.eventName],
					set: {
						status: 'sent',
						sentAt: sql`NOW()`,
						attempts: sql`${leadMagnetEvents.attempts} + 1`
					}
				});
		} catch (dbErr) {
			console.error('[lm-progress] read75 DB upsert error (не критично):', dbErr);
		}
		return json({ success: true });
	}

	// opened — обрабатываем ОДИН раз на контакт (межсессионный дедуп через DB unique constraint).
	try {
		// Atomically create the event record if it doesn't exist yet,
		// or return the existing one unchanged (no-op update forces RETURNING on conflict).
		const [record] = await db
			.insert(leadMagnetEvents)
			.values({
				clientId: contactId,
				leadMagnet: leadMagnet as string,
				eventName: event as string,
				status: 'pending',
				attempts: 0
			})
			.onConflictDoUpdate({
				target: [leadMagnetEvents.clientId, leadMagnetEvents.leadMagnet, leadMagnetEvents.eventName],
				// No-op SET — preserves existing row, forces RETURNING to work on conflict
				set: { status: sql`lead_magnet_events.status` }
			})
			.returning();

		if (record.status === 'sent') {
			return json({ success: true, duplicate: true });
		}

		// Atomically increment attempts.
		// If 0 rows returned, the status became 'sent' in a concurrent request.
		const acquired = await db
			.update(leadMagnetEvents)
			.set({ attempts: sql`${leadMagnetEvents.attempts} + 1` })
			.where(
				and(eq(leadMagnetEvents.id, record.id), ne(leadMagnetEvents.status, 'sent'))
			)
			.returning({ id: leadMagnetEvents.id });

		if (acquired.length === 0) {
			return json({ success: true, processing: true });
		}

		try {
			await processLeadMagnetEvent(contactId, leadMagnet as LeadMagnet, event as EventName);

			await db
				.update(leadMagnetEvents)
				.set({ status: 'sent', sentAt: sql`NOW()` })
				.where(eq(leadMagnetEvents.id, record.id));

			return json({ success: true });
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : String(err);
			console.error('[lm-progress] Ошибка обработки opened:', errMsg);

			await db
				.update(leadMagnetEvents)
				.set({ status: 'failed', lastError: errMsg })
				.where(eq(leadMagnetEvents.id, record.id));

			return json({ error: 'Event processing failed' }, { status: 500 });
		}
	} catch (dbErr) {
		console.error('[lm-progress] DB error:', dbErr);
		return json({ error: 'Database error' }, { status: 500 });
	}
};
