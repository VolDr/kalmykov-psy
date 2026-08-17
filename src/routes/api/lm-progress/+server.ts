import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '../../..';
import { leadMagnetEvents } from '../../../db/schema';
import { addTagsToContact, getContactByPublicId } from '$lib/server/bot-contacts.server';
import { triggerScenarioByKey } from '$lib/server/bot-scenarios.server';

// Чтобы подключить новый лид-магнит, достаточно добавить его сюда.
// На событие контакту вешается тег lm_<name>_<event>, и если существует включённый
// сценарий с триггером «Диплинк /start=» и значением lm_<name>_<event> — он запускается
// (например, lm_focus_read75 → послечтенческая прогревочная серия).
const ALLOWED_LEAD_MAGNETS = ['otpusk', 'focus', 'burnout', 'quiz'] as const;
// read75 — дочитал статью, completed — прошёл опросник до результатов
const ALLOWED_EVENTS = ['opened', 'read75', 'completed'] as const;

// Дедупа здесь нет: частотой перезапуска управляет кулдаун на самой цепочке
// («не запускать чаще раза в N дней» в настройках сценария). Тег идемпотентен.
type LeadMagnet = (typeof ALLOWED_LEAD_MAGNETS)[number];
type EventName = (typeof ALLOWED_EVENTS)[number];

/** Тег на контакт + запуск сценария по ключу события (если такой сценарий настроен). */
async function processLeadMagnetEvent(
	contactId: number,
	leadMagnet: LeadMagnet,
	event: EventName
): Promise<boolean> {
	const key = `lm_${leadMagnet}_${event}`;
	await addTagsToContact(contactId, [key]);
	return triggerScenarioByKey(key, contactId);
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Публичный id контакта берётся из HttpOnly cookie, установленного /go/*
	// (в ссылках из бота используется подстановка {contact_id}), не из тела запроса
	const rawCookie = cookies.get('sb_client_id');
	const publicId = rawCookie ? parseInt(rawCookie, 10) : NaN;
	if (!Number.isSafeInteger(publicId) || publicId <= 0) {
		console.log(`[lm-progress] скип: нет куки sb_client_id (значение: ${rawCookie ?? '—'})`);
		return json({ ok: true, skipped: true });
	}

	// Старые куки (Salebot-ID или внутренние id до перехода на public_id) — скипаем
	const contact = await getContactByPublicId(publicId);
	if (!contact) {
		console.log(`[lm-progress] скип: контакт с public_id=${publicId} не найден`);
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

	try {
		const key = `lm_${leadMagnet}_${event}`;
		const triggered = await processLeadMagnetEvent(
			contact.id,
			leadMagnet as LeadMagnet,
			event as EventName
		);
		if (triggered) {
			console.log(`[lm-progress] ${key}: тег повешен, цепочка запущена (контакт ${contact.id})`);
		} else {
			// Тег повесился в любом случае; цепочки нет — либо нет включённого сценария
			// с триггером «диплинк /start=» и значением key, либо юзер заблокировал бота
			const reason = contact.botBlocked ? 'бот заблокирован' : 'нет включённого сценария';
			console.log(
				`[lm-progress] ${key}: тег повешен, цепочка НЕ запущена — ${reason} (контакт ${contact.id})`
			);
		}
	} catch (err) {
		console.error(`[lm-progress] Ошибка обработки ${event}:`, err);
		return json({ error: 'Event processing failed' }, { status: 500 });
	}

	// Журнал последнего события (для отладки). Best-effort, на ответ не влияет.
	// В lead_magnet_events.client_id храним внутренний id контакта.
	try {
		await db
			.insert(leadMagnetEvents)
			.values({
				clientId: contact.id,
				leadMagnet: leadMagnet as string,
				eventName: event as string,
				status: 'sent',
				attempts: 1,
				sentAt: sql`NOW()`
			})
			.onConflictDoUpdate({
				target: [
					leadMagnetEvents.clientId,
					leadMagnetEvents.leadMagnet,
					leadMagnetEvents.eventName
				],
				set: {
					status: 'sent',
					sentAt: sql`NOW()`,
					attempts: sql`${leadMagnetEvents.attempts} + 1`
				}
			});
	} catch (dbErr) {
		console.error('[lm-progress] DB upsert error (не критично):', dbErr);
	}

	return json({ success: true });
};
