import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import type { ReviewComment } from '#lib/data/translation-reconciliation.js';

const columns = {
	id: schema.translationReviewComments.id,
	slot: schema.translationReviewComments.slot,
	itemKey: schema.translationReviewComments.itemKey,
	body: schema.translationReviewComments.body
};

/** Комментарии раунда в порядке добавления, без удалённых. */
export async function listReviewComments(reconciliationId: number): Promise<ReviewComment[]> {
	return db
		.select(columns)
		.from(schema.translationReviewComments)
		.where(
			and(
				eq(schema.translationReviewComments.reconciliationId, reconciliationId),
				isNull(schema.translationReviewComments.deletedAt)
			)
		)
		.orderBy(
			asc(schema.translationReviewComments.createdAt),
			asc(schema.translationReviewComments.id)
		);
}

/**
 * Идентификатор задаёт браузер, поэтому повтор после обрыва связи не создаёт дубль.
 * Чужой или уже удалённый идентификатор не перезаписывается.
 */
export async function addReviewComment(
	reconciliationId: number,
	slot: number,
	comment: { id: string; itemKey: string; body: string }
): Promise<ReviewComment | null> {
	await db
		.insert(schema.translationReviewComments)
		.values({ ...comment, reconciliationId, slot })
		.onConflictDoNothing({ target: schema.translationReviewComments.id });
	const [stored] = await db
		.select(columns)
		.from(schema.translationReviewComments)
		.where(
			and(
				eq(schema.translationReviewComments.id, comment.id),
				eq(schema.translationReviewComments.reconciliationId, reconciliationId),
				eq(schema.translationReviewComments.slot, slot),
				isNull(schema.translationReviewComments.deletedAt)
			)
		);
	return stored ?? null;
}

/** Удалить можно только свой комментарий. Повторное удаление ничего не меняет. */
export async function deleteReviewComment(reconciliationId: number, slot: number, id: string) {
	await db
		.update(schema.translationReviewComments)
		.set({ deletedAt: new Date().toISOString() })
		.where(
			and(
				eq(schema.translationReviewComments.id, id),
				eq(schema.translationReviewComments.reconciliationId, reconciliationId),
				eq(schema.translationReviewComments.slot, slot),
				isNull(schema.translationReviewComments.deletedAt)
			)
		);
}
