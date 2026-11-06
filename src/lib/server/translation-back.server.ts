import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import { emptyTranslationEntry, type TranslationEntry } from '#lib/data/translation.js';
import { reconciliationText } from '#lib/data/translation-reconciliation.js';
import { getEntries, listEvents } from './translations.server';

const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
const guide = 'Переведите на английский язык русскую инструкцию, утверждения и варианты ответа. Это обратный перевод согласованной русской версии.\n\nПередавайте смысл и оттенки формулировок своими словами. Не ищите исходный английский опросник и не сверяйтесь с ним.\n\nЕсли формулировка допускает несколько толкований, укажите это в комментарии. Перевод и комментарии сохраняются автоматически; к пунктам можно возвращаться.';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Итоговые русские формулировки раунда под блокировкой документов участников и итога:
 * пункт не может поменяться посреди снимка. Пустой итог — ошибка.
 */
export async function lockFinalItems(tx: Tx, sourceId: number, reviewId: number) {
	if (!validId(sourceId) || !validId(reviewId)) throw new Error('Согласование не найдено');
	const [review] = await tx.select().from(schema.translationReconciliations)
		.where(and(eq(schema.translationReconciliations.id, reviewId), eq(schema.translationReconciliations.sourceDocId, sourceId)))
		.for('update');
	if (!review) throw new Error('Согласование не найдено');
	const reviewers = await tx.select().from(schema.translationReviewers)
		.where(eq(schema.translationReviewers.reconciliationId, reviewId)).orderBy(asc(schema.translationReviewers.slot));
	const docIds = [review.finalDocId, ...reviewers.map((p) => p.docId)];
	// Shared with the versioned saver: an item cannot change halfway through the snapshot.
	await tx.select({ id: schema.translationDocs.id }).from(schema.translationDocs)
		.where(inArray(schema.translationDocs.id, docIds)).orderBy(asc(schema.translationDocs.id)).for('update');
	const rows = await tx.select().from(schema.translationEntries).where(inArray(schema.translationEntries.docId, docIds));
	const entries = (docId?: number): Record<string, TranslationEntry> => Object.fromEntries(
		rows.filter((row) => row.docId === docId).map((row) => [row.itemKey, {
			...emptyTranslationEntry(), translation: row.translation, comment: row.comment,
			translationVersion: row.translationVersion, commentVersion: row.commentVersion
		}])
	);
	const first = entries(reviewers[0]?.docId), second = entries(reviewers[1]?.docId), final = entries(review.finalDocId);
	if (!review.items.length) throw new Error('В согласовании нет пунктов');
	const items = review.items.map((item) => {
		const { text } = reconciliationText(item.key, review.variantA, review.variantB, first, second, final);
		if (!text.trim()) throw new Error(`Сначала заполните итоговую формулировку: ${item.label}`);
		return { ...item, source: text };
	});
	return { review, items };
}

/** Freeze the final Russian wording once, without exposing the English original. */
export async function createBackTranslation(sourceId: number, reviewId: number) {
	if (!validId(sourceId) || !validId(reviewId)) throw new Error('Согласование не найдено');
	return db.transaction(async (tx) => {
		const [locked] = await tx.select({ id: schema.translationReconciliations.id }).from(schema.translationReconciliations)
			.where(and(eq(schema.translationReconciliations.id, reviewId), eq(schema.translationReconciliations.sourceDocId, sourceId)))
			.for('update');
		if (!locked) throw new Error('Согласование не найдено');
		const [existing] = await tx.select().from(schema.translationBackTranslations)
			.where(eq(schema.translationBackTranslations.reconciliationId, reviewId));
		if (existing) return existing.docId;
		const { review, items } = await lockFinalItems(tx, sourceId, reviewId);
		const [doc] = await tx.insert(schema.translationDocs).values({
			token: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex'),
			kind: 'backtranslation', title: `Обратный перевод: ${review.title}`, items, guide
		}).returning();
		await tx.insert(schema.translationBackTranslations).values({ reconciliationId: reviewId, docId: doc.id });
		return doc.id;
	});
}

export async function getBackTranslation(sourceId: number, reviewId: number) {
	if (!validId(sourceId) || !validId(reviewId)) return null;
	const [doc] = await db.select({
		id: schema.translationDocs.id, token: schema.translationDocs.token,
		title: schema.translationDocs.title, items: schema.translationDocs.items
	}).from(schema.translationBackTranslations)
		.innerJoin(schema.translationReconciliations, eq(schema.translationBackTranslations.reconciliationId, schema.translationReconciliations.id))
		.innerJoin(schema.translationDocs, eq(schema.translationBackTranslations.docId, schema.translationDocs.id))
		.where(and(eq(schema.translationReconciliations.sourceDocId, sourceId), eq(schema.translationReconciliations.id, reviewId)));
	if (!doc) return null;
	const [entries, events] = await Promise.all([getEntries(doc.id), listEvents(doc.id)]);
	return { ...doc, entries, events };
}

export async function regenerateBackTranslationToken(sourceId: number, reviewId: number) {
	const back = await getBackTranslation(sourceId, reviewId);
	if (!back) throw new Error('Обратный перевод не найден');
	const token = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');
	await db.update(schema.translationDocs).set({ token }).where(eq(schema.translationDocs.id, back.id));
}
