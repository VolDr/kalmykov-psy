import { db } from '../..';
import * as schema from '../../db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';

export type TelegramFrom = {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
};

/** Находит или создаёт CRM-контакт по данным Telegram-пользователя, обновляет профиль/активность. */
export async function upsertContactFromTelegramUser(from: TelegramFrom) {
	const [contact] = await db
		.insert(schema.botContacts)
		.values({
			telegramUserId: from.id,
			username: from.username ?? null,
			firstName: from.first_name ?? null,
			lastName: from.last_name ?? null,
			lastInteractionAt: sql`now()`
		})
		.onConflictDoUpdate({
			target: schema.botContacts.telegramUserId,
			set: {
				username: from.username ?? null,
				firstName: from.first_name ?? null,
				lastName: from.last_name ?? null,
				lastInteractionAt: sql`now()`,
				updatedAt: sql`now()`,
				botBlocked: false
			}
		})
		.returning();

	return contact;
}

export async function getContact(id: number) {
	const [contact] = await db
		.select()
		.from(schema.botContacts)
		.where(eq(schema.botContacts.id, id));
	return contact ?? null;
}

export async function getContactByTelegramId(telegramUserId: number) {
	const [contact] = await db
		.select()
		.from(schema.botContacts)
		.where(eq(schema.botContacts.telegramUserId, telegramUserId));
	return contact ?? null;
}

/** Максимум контактов в списке за раз — дальше просим уточнить поиск */
export const CONTACTS_LIST_LIMIT = 200;

export async function listContacts(search?: string) {
	const query = db.select().from(schema.botContacts);

	if (search && search.trim()) {
		const pattern = `%${search.trim()}%`;
		return query
			.where(
				or(
					ilike(schema.botContacts.username, pattern),
					ilike(schema.botContacts.firstName, pattern),
					ilike(schema.botContacts.lastName, pattern)
				)
			)
			.orderBy(desc(schema.botContacts.lastInteractionAt))
			.limit(CONTACTS_LIST_LIMIT);
	}

	return query.orderBy(desc(schema.botContacts.lastInteractionAt)).limit(CONTACTS_LIST_LIMIT);
}

export async function updateCrm(
	id: number,
	data: { stage?: string; tags?: string[]; notes?: string | null }
) {
	await db
		.update(schema.botContacts)
		.set({ ...data, updatedAt: sql`now()` })
		.where(eq(schema.botContacts.id, id));
}

/** Добавляет контакту теги без дублей. Молча no-op, если контакта нет. */
export async function addTagsToContact(id: number, tags: string[]) {
	if (tags.length === 0) return;
	const contact = await getContact(id);
	if (!contact) return;

	const merged = Array.from(new Set([...contact.tags, ...tags]));
	await db
		.update(schema.botContacts)
		.set({ tags: merged, updatedAt: sql`now()` })
		.where(eq(schema.botContacts.id, id));
}

export async function setBotBlocked(id: number, blocked: boolean) {
	await db
		.update(schema.botContacts)
		.set({ botBlocked: blocked, updatedAt: sql`now()` })
		.where(eq(schema.botContacts.id, id));
}

export async function listMessages(contactId: number) {
	return db
		.select()
		.from(schema.botMessages)
		.where(eq(schema.botMessages.contactId, contactId))
		.orderBy(schema.botMessages.createdAt);
}

export async function logInboundMessage(params: {
	contactId: number;
	text?: string | null;
	telegramMessageId?: number;
	payload?: unknown;
}) {
	await db.insert(schema.botMessages).values({
		contactId: params.contactId,
		direction: 'in',
		text: params.text ?? null,
		telegramMessageId: params.telegramMessageId ?? null,
		payload: params.payload ?? null
	});
}

export async function logOutboundMessage(params: {
	contactId: number;
	text: string;
	telegramMessageId?: number;
	sentByAccountId?: string;
}) {
	await db.insert(schema.botMessages).values({
		contactId: params.contactId,
		direction: 'out',
		text: params.text,
		telegramMessageId: params.telegramMessageId ?? null,
		sentByAccountId: params.sentByAccountId ?? null
	});
}
