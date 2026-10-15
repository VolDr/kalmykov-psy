import { db } from '../..';
import * as schema from '../../db/schema';
import { and, desc, eq, getTableColumns, ilike, isNull, or, sql } from 'drizzle-orm';

export type TelegramFrom = {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
};

/** Случайный 9-значный публичный id (100000000–999999999) для ссылок и куки. */
function randomPublicId(): number {
	return Math.floor(100_000_000 + Math.random() * 900_000_000);
}

function isPublicIdCollision(err: unknown): boolean {
	return err instanceof Error && err.message.includes('bot_contacts_public_id_key');
}

/** Находит или создаёт CRM-контакт по данным Telegram-пользователя, обновляет профиль/активность. */
export async function upsertContactFromTelegramUser(from: TelegramFrom) {
	// Retry на редчайший случай коллизии случайного public_id
	for (let attempt = 0; ; attempt++) {
		try {
			const [contact] = await db
				.insert(schema.botContacts)
				.values({
					publicId: randomPublicId(),
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
		} catch (err) {
			if (attempt < 3 && isPublicIdCollision(err)) continue;
			throw err;
		}
	}
}

export async function getContact(id: number) {
	const [contact] = await db.select().from(schema.botContacts).where(eq(schema.botContacts.id, id));
	return contact ?? null;
}

/** Поиск по публичному id — то, что приходит в куке/ссылках с сайта. */
export async function getContactByPublicId(publicId: number) {
	const [contact] = await db
		.select()
		.from(schema.botContacts)
		.where(eq(schema.botContacts.publicId, publicId));
	return contact ?? null;
}

export async function getContactByTelegramId(telegramUserId: number) {
	const [contact] = await db
		.select()
		.from(schema.botContacts)
		.where(eq(schema.botContacts.telegramUserId, telegramUserId));
	return contact ?? null;
}

export const CONTACTS_PAGE_SIZE = 50;

/**
 * Контакт занят цепочкой, если у него есть хотя бы один ожидающий шаг любой цепочки.
 * Это то же определение, которое использует onlyIdle при запуске рассылки.
 */
export async function listContacts(search = '', requestedPage = 1, archived = false) {
	const normalizedSearch = search.trim();
	const searchCondition = normalizedSearch
		? or(
				ilike(schema.botContacts.username, `%${normalizedSearch}%`),
				ilike(schema.botContacts.firstName, `%${normalizedSearch}%`),
				ilike(schema.botContacts.lastName, `%${normalizedSearch}%`)
			)
		: undefined;

	const archiveCondition = eq(schema.botContacts.botBlocked, archived);
	const listCondition = searchCondition ? and(archiveCondition, searchCondition) : archiveCondition;

	const activeChainExists = sql<boolean>`exists (
		select 1
		from ${schema.botScheduledSteps}
		where ${schema.botScheduledSteps.contactId} = ${schema.botContacts.id}
			and ${schema.botScheduledSteps.status} = 'pending'
	)`;

	const [[filteredCount], [chainStats]] = await Promise.all([
		db
			.select({ total: sql<number>`count(*)::int` })
			.from(schema.botContacts)
			.where(listCondition),
		db
			.select({
				total: sql<number>`count(*) filter (where ${schema.botContacts.botBlocked} = false)::int`,
				active: sql<number>`count(*) filter (where ${schema.botContacts.botBlocked} = false and ${activeChainExists})::int`,
				blocked: sql<number>`count(*) filter (where ${schema.botContacts.botBlocked})::int`
			})
			.from(schema.botContacts)
	]);

	const total = filteredCount?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / CONTACTS_PAGE_SIZE));
	const page = Math.min(Math.max(1, requestedPage), totalPages);

	const contacts = await db
		.select({
			...getTableColumns(schema.botContacts),
			hasActiveChain: activeChainExists.as('has_active_chain')
		})
		.from(schema.botContacts)
		.where(listCondition)
		.orderBy(
			sql`${schema.botContacts.lastInteractionAt} desc nulls last`,
			desc(schema.botContacts.id)
		)
		.limit(CONTACTS_PAGE_SIZE)
		.offset((page - 1) * CONTACTS_PAGE_SIZE);

	const allContacts = chainStats?.total ?? 0;
	const activeContacts = chainStats?.active ?? 0;
	const blockedContacts = chainStats?.blocked ?? 0;

	return {
		contacts,
		pagination: {
			page,
			pageSize: CONTACTS_PAGE_SIZE,
			total,
			totalPages,
			from: total === 0 ? 0 : (page - 1) * CONTACTS_PAGE_SIZE + 1,
			to: Math.min(page * CONTACTS_PAGE_SIZE, total)
		},
		chainStats: {
			total: allContacts,
			active: activeContacts,
			idle: allContacts - activeContacts,
			blocked: blockedContacts
		}
	};
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

/**
 * Литерал text[] ('{"a","b"}') для параметра внутри sql``.
 * Drizzle разворачивает JS-массив в raw-sql в СПИСОК параметров ($1, $2),
 * а не в массив — приводит к "malformed array literal". Передаём строкой + ::text[].
 */
export function pgTextArrayLiteral(values: string[]): string {
	const escaped = values.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
	return `{${escaped.join(',')}}`;
}

/**
 * Добавляет контакту теги без дублей. Молча no-op, если контакта нет.
 * Слияние атомарное на стороне SQL — параллельная запись тегов
 * (шаг сценария, второе событие с сайта) не потеряется.
 */
export async function addTagsToContact(id: number, tags: string[]) {
	if (tags.length === 0) return;
	await db
		.update(schema.botContacts)
		.set({
			tags: sql`(select array_agg(distinct t) from unnest(${schema.botContacts.tags} || ${pgTextArrayLiteral(tags)}::text[]) as t)`,
			updatedAt: sql`now()`
		})
		.where(eq(schema.botContacts.id, id));
}

/**
 * Привязывает ClientID Метрики к контакту — только если он ещё не привязан.
 * Первый ClientID не перетираем: человек мог зайти повторно с другого устройства,
 * а конверсию Директу надо отдать по тому визиту, который за него заплатил.
 */
export async function attachMetrikaClientId(id: number, metrikaClientId: string) {
	const [updated] = await db
		.update(schema.botContacts)
		.set({ metrikaClientId, updatedAt: sql`now()` })
		.where(and(eq(schema.botContacts.id, id), isNull(schema.botContacts.metrikaClientId)))
		.returning();
	return updated ?? null;
}

export async function setBotBlocked(id: number, blocked: boolean) {
	await db.transaction(async (tx) => {
		await tx
			.update(schema.botContacts)
			.set({ botBlocked: blocked, updatedAt: sql`now()` })
			.where(eq(schema.botContacts.id, id));

		// Блокировка — это архивирование контакта. Снимаем всю ожидающую очередь
		// сразу, а не ждём, пока каждый шаг отдельно дойдёт до воркера.
		if (blocked) {
			await tx
				.update(schema.botScheduledSteps)
				.set({
					status: 'cancelled',
					cancellationReason: 'contact_blocked',
					processedAt: sql`now()`
				})
				.where(
					and(
						eq(schema.botScheduledSteps.contactId, id),
						eq(schema.botScheduledSteps.status, 'pending')
					)
				);
		}
	});
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
