import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import type {
	TranslationChange,
	TranslationEntry,
	TranslationSaveResult
} from '#lib/data/translation.js';

/** Правки одного поля с одного IP в пределах этого окна склеиваются в одну запись журнала. */
const EDIT_MERGE_WINDOW = '3 minutes';
const TOKEN_PATTERN = /^[a-f0-9]{16,64}$/;

export interface RequestMeta {
	ip: string;
	userAgent: string | null;
}

export async function getDocByToken(token: string) {
	if (!TOKEN_PATTERN.test(token)) return null;
	const [doc] = await db
		.select()
		.from(schema.translationDocs)
		.where(eq(schema.translationDocs.token, token))
		.limit(1);
	return doc ?? null;
}

export async function getEntries(docId: number): Promise<Record<string, TranslationEntry>> {
	const rows = await db
		.select()
		.from(schema.translationEntries)
		.where(eq(schema.translationEntries.docId, docId));
	return Object.fromEntries(
		rows.map((row) => [
			row.itemKey,
			{
				translation: row.translation,
				comment: row.comment,
				translationVersion: row.translationVersion,
				commentVersion: row.commentVersion
			}
		])
	);
}

export async function logVisit(docId: number, meta: RequestMeta) {
	await db.insert(schema.translationEvents).values({
		docId,
		kind: 'visit',
		ip: meta.ip,
		userAgent: meta.userAgent
	});
}

/** Версии проверяются под блокировкой, квитанции и журнал пишутся в той же транзакции. */
export async function saveChanges(docId: number, changes: TranslationChange[], meta: RequestMeta) {
	return db.transaction(async (tx) => {
		// Блокировка документа также защищает ещё не существующие строки и исключает
		// взаимные блокировки пачек с разным порядком пунктов.
		await tx
			.select({ id: schema.translationDocs.id })
			.from(schema.translationDocs)
			.where(eq(schema.translationDocs.id, docId))
			.for('update');
		const results: TranslationSaveResult[] = [];
		for (const change of changes) {
			const column = change.field;
			const versionColumn = column === 'translation' ? 'translationVersion' : 'commentVersion';
			const [current] = await tx
				.select()
				.from(schema.translationEntries)
				.where(
					and(
						eq(schema.translationEntries.docId, docId),
						eq(schema.translationEntries.itemKey, change.key)
					)
				)
				.for('update');
			const oldValue = current?.[column] ?? '';
			const version = current?.[versionColumn] ?? 0;
			const [receipt] = await tx
				.select()
				.from(schema.translationOperations)
				.where(
					and(
						eq(schema.translationOperations.docId, docId),
						eq(schema.translationOperations.operationId, change.operationId)
					)
				);
			const repeated =
				receipt &&
				receipt.itemKey === change.key &&
				receipt.field === column &&
				receipt.value === change.value &&
				receipt.expectedVersion === change.expectedVersion;
			// Квитанция старой операции не должна вернуть интерфейс к старому тексту:
			// если после неё поле уже изменили, показываем актуальный конфликт.
			if (repeated && receipt.version === version) {
				results.push({ ...change, status: 'saved', version: receipt.version });
				continue;
			}
			if (receipt || change.expectedVersion !== version) {
				results.push({
					key: change.key,
					field: column,
					operationId: change.operationId,
					status: 'conflict',
					value: oldValue,
					version
				});
				continue;
			}
			// Даже совпадающее значение подтверждаем отдельной версией и квитанцией.
			const nextVersion = version + 1;
			const patch = { [column]: change.value, [versionColumn]: nextVersion };

			await tx
				.insert(schema.translationEntries)
				.values({ docId, itemKey: change.key, ...patch })
				.onConflictDoUpdate({
					target: [schema.translationEntries.docId, schema.translationEntries.itemKey],
					set: { ...patch, updatedAt: sql`now()` }
				});

			await tx.insert(schema.translationOperations).values({
				docId,
				operationId: change.operationId,
				itemKey: change.key,
				field: column,
				value: change.value,
				expectedVersion: change.expectedVersion,
				version: nextVersion
			});
			if (oldValue !== change.value) await logEdit(tx, docId, change, oldValue, meta);
			results.push({ ...change, status: 'saved', version: nextVersion });
		}
		return results;
	});
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function logEdit(
	tx: Tx,
	docId: number,
	change: TranslationChange,
	oldValue: string,
	meta: RequestMeta
) {
	const events = schema.translationEvents;
	const [last] = await tx
		.select({
			id: events.id,
			ip: events.ip,
			recent: sql<boolean>`${events.lastAt} > now() - ${EDIT_MERGE_WINDOW}::interval`
		})
		.from(events)
		.where(
			and(
				eq(events.docId, docId),
				eq(events.kind, 'edit'),
				eq(events.itemKey, change.key),
				eq(events.field, change.field)
			)
		)
		.orderBy(desc(events.id))
		.limit(1);

	if (last && last.ip === meta.ip && last.recent) {
		await tx
			.update(events)
			.set({ newValue: change.value, lastAt: sql`now()`, userAgent: meta.userAgent })
			.where(eq(events.id, last.id));
		return;
	}
	await tx.insert(events).values({
		docId,
		kind: 'edit',
		ip: meta.ip,
		userAgent: meta.userAgent,
		itemKey: change.key,
		field: change.field,
		oldValue,
		newValue: change.value
	});
}

// --- Админка ---

export async function listDocs() {
	return db
		.select({
			id: schema.translationDocs.id,
			token: schema.translationDocs.token,
			title: schema.translationDocs.title,
			items: schema.translationDocs.items
		})
		.from(schema.translationDocs)
		.orderBy(asc(schema.translationDocs.id));
}

export async function listEvents(docId: number, limit = 300) {
	return db
		.select()
		.from(schema.translationEvents)
		.where(eq(schema.translationEvents.docId, docId))
		.orderBy(desc(schema.translationEvents.id))
		.limit(limit);
}

/** Новая случайная ссылка: старая сразу перестаёт работать. */
export async function regenerateToken(docId: number) {
	const token = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('hex');
	await db
		.update(schema.translationDocs)
		.set({ token })
		.where(eq(schema.translationDocs.id, docId));
	return token;
}
