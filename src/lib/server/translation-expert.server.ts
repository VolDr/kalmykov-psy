import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import {
	buildExpertItems,
	expertBriefing,
	expertRepeatBriefing,
	latestExpertTexts,
	type ExpertResult
} from '#lib/data/translation-expert.js';
import type { TranslationEntry } from '#lib/data/translation.js';
import { lockFinalItems } from './translation-back.server';

const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
const newToken = () => Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');
export const EXPERT_NAME_MAX = 80;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function validName(rawName: string) {
	const name = rawName.trim();
	if (!name) throw new Error('Укажите имя эксперта');
	if (name.length > EXPERT_NAME_MAX) throw new Error(`Имя длиннее ${EXPERT_NAME_MAX} символов`);
	return name;
}

async function insertLink(
	tx: Tx,
	values: {
		reviewId: number;
		title: string;
		items: ExpertResult['items'];
		guide: string;
		name: string;
		personId?: number;
	}
) {
	const [doc] = await tx
		.insert(schema.translationDocs)
		.values({
			token: newToken(),
			kind: 'expert',
			title: values.title,
			items: values.items,
			guide: values.guide
		})
		.returning();
	// У первой ссылки эксперта person_id совпадает с её id: берём id заранее.
	const {
		rows: [{ id }]
	} = await tx.execute<{ id: string }>(
		sql`select nextval(pg_get_serial_sequence('translation_experts', 'id')) as id`
	);
	const [expert] = await tx
		.insert(schema.translationExperts)
		.values({
			id: Number(id),
			reconciliationId: values.reviewId,
			docId: doc.id,
			name: values.name,
			personId: values.personId ?? Number(id)
		})
		.returning();
	const [adminDoc] = await tx.insert(schema.translationDocs).values({
		token: newToken(), kind: 'expert-admin', title: `Обсуждение с экспертом: ${values.name}`, items: values.items, guide: values.guide
	}).returning();
	await tx.update(schema.translationExperts).set({ adminDocId: adminDoc.id }).where(eq(schema.translationExperts.id, expert.id));
	return expert.id;
}

/**
 * Новая ссылка нового эксперта. Текст берётся из итога согласования на момент создания и
 * дальше не меняется: исправленные пункты отправляются повторной ссылкой того же эксперта.
 */
export async function createExpertLink(sourceId: number, reviewId: number, rawName: string) {
	const name = validName(rawName);
	return db.transaction(async (tx) => {
		const { review, items } = await lockFinalItems(tx, sourceId, reviewId);
		const texts = new Map(items.map((item) => [item.key, item.source]));
		return insertLink(tx, {
			reviewId,
			title: `Экспертная оценка: ${review.title}`,
			items: buildExpertItems(items, (key) => texts.get(key) ?? ''),
			guide: expertBriefing,
			name
		});
	});
}

/**
 * Повторная оценка тем же экспертом: только пункты, чья формулировка изменилась
 * с тех пор, как эксперт видел их в последний раз. Оценки старых формулировок
 * остаются в его прежних ссылках, но в статистику новой не входят.
 */
export async function createExpertRepeatLink(sourceId: number, reviewId: number, personId: number) {
	if (!validId(personId)) throw new Error('Эксперт не найден');
	return db.transaction(async (tx) => {
		const { review, items } = await lockFinalItems(tx, sourceId, reviewId);
		const links = await tx
			.select({
				id: schema.translationExperts.id,
				name: schema.translationExperts.name,
				items: schema.translationDocs.items
			})
			.from(schema.translationExperts)
			.innerJoin(
				schema.translationDocs,
				eq(schema.translationExperts.docId, schema.translationDocs.id)
			)
			.where(
				and(
					eq(schema.translationExperts.reconciliationId, reviewId),
					eq(schema.translationExperts.personId, personId)
				)
			)
			.orderBy(asc(schema.translationExperts.id))
			.for('update');
		if (!links.length) throw new Error('Эксперт не найден');
		const texts = new Map(items.map((item) => [item.key, item.source]));
		const seen = latestExpertTexts(links);
		const changed = buildExpertItems(items, (key) => texts.get(key) ?? '').filter(
			(item) => seen.get(item.key) !== item.source
		);
		if (!changed.length)
			throw new Error('С последней оценки этого эксперта формулировки не менялись');
		return insertLink(tx, {
			reviewId,
			title: `Повторная экспертная оценка: ${review.title}`,
			items: changed,
			guide: expertRepeatBriefing,
			name: links.at(-1)?.name ?? '',
			personId
		});
	});
}

export async function listExperts(sourceId: number, reviewId: number): Promise<ExpertResult[]> {
	if (!validId(sourceId) || !validId(reviewId)) return [];
	const experts = await db
		.select({
			id: schema.translationExperts.id,
			personId: schema.translationExperts.personId,
			docId: schema.translationExperts.docId,
			name: schema.translationExperts.name,
			createdAt: schema.translationExperts.createdAt,
			token: schema.translationDocs.token,
			items: schema.translationDocs.items
			, adminDocId: schema.translationExperts.adminDocId
		})
		.from(schema.translationExperts)
		.innerJoin(
			schema.translationReconciliations,
			eq(schema.translationExperts.reconciliationId, schema.translationReconciliations.id)
		)
		.innerJoin(
			schema.translationDocs,
			eq(schema.translationExperts.docId, schema.translationDocs.id)
		)
		.where(
			and(
				eq(schema.translationExperts.reconciliationId, reviewId),
				eq(schema.translationReconciliations.sourceDocId, sourceId)
			)
		)
		.orderBy(asc(schema.translationExperts.id));
	if (!experts.length) return [];
	const rows = await db
		.select()
		.from(schema.translationEntries)
		.where(
			inArray(
				schema.translationEntries.docId,
				experts.map((expert) => expert.docId)
			)
		);
	const adminIds = experts.flatMap((expert) => expert.adminDocId ? [expert.adminDocId] : []);
	const adminDocs = adminIds.length ? await db.select({ id: schema.translationDocs.id, token: schema.translationDocs.token }).from(schema.translationDocs).where(inArray(schema.translationDocs.id, adminIds)) : [];
	const comments = await db.select().from(schema.translationExpertComments).where(and(inArray(schema.translationExpertComments.expertId, experts.map((expert) => expert.id)), isNull(schema.translationExpertComments.deletedAt))).orderBy(asc(schema.translationExpertComments.createdAt), asc(schema.translationExpertComments.id));
	return experts.map(({ adminDocId, ...expert }) => ({
		...expert,
		adminToken: adminDocs.find((doc) => doc.id === adminDocId)?.token ?? null,
		comments: comments.filter((comment) => comment.expertId === expert.id).map(({ id, slot, itemKey, body }) => ({ id, slot, itemKey, body })),
		entries: Object.fromEntries(
			rows
				.filter((row) => row.docId === expert.docId)
				.map((row): [string, TranslationEntry] => [
					row.itemKey,
					{
						translation: row.translation,
						comment: row.comment,
						translationVersion: row.translationVersion,
						commentVersion: row.commentVersion
					}
				])
		)
	}));
}

async function findExpert(sourceId: number, reviewId: number, expertId: number) {
	if (!validId(sourceId) || !validId(reviewId) || !validId(expertId)) return null;
	const [expert] = await db
		.select({
			id: schema.translationExperts.id,
			docId: schema.translationExperts.docId,
			personId: schema.translationExperts.personId
			, adminDocId: schema.translationExperts.adminDocId
		})
		.from(schema.translationExperts)
		.innerJoin(
			schema.translationReconciliations,
			eq(schema.translationExperts.reconciliationId, schema.translationReconciliations.id)
		)
		.where(
			and(
				eq(schema.translationExperts.id, expertId),
				eq(schema.translationExperts.reconciliationId, reviewId),
				eq(schema.translationReconciliations.sourceDocId, sourceId)
			)
		);
	return expert ?? null;
}

/** Старая ссылка эксперта перестаёт работать, ответы сохраняются. */
export async function regenerateExpertToken(sourceId: number, reviewId: number, expertId: number) {
	const expert = await findExpert(sourceId, reviewId, expertId);
	if (!expert) throw new Error('Эксперт не найден');
	await db
		.update(schema.translationDocs)
		.set({ token: newToken() })
		.where(eq(schema.translationDocs.id, expert.docId));
}

/**
 * Удаляет одну ссылку вместе с её ответами (документ, ответы, квитанции и журнал
 * удаляются каскадом). Ссылка перестаёт работать, её оценки выпадают из статистики;
 * если это была повторная оценка, снова учитываются прежние оценки эксперта.
 */
export async function deleteExpertLink(sourceId: number, reviewId: number, expertId: number) {
	const expert = await findExpert(sourceId, reviewId, expertId);
	if (!expert) throw new Error('Эксперт не найден');
	await db.delete(schema.translationDocs).where(inArray(schema.translationDocs.id, [expert.docId, ...(expert.adminDocId ? [expert.adminDocId] : [])]));
}

/** Existing expert links can obtain a separate administrator discussion link. */
export async function createExpertAdminLink(sourceId: number, reviewId: number, expertId: number) {
	const target = await findExpert(sourceId, reviewId, expertId);
	if (!target) throw new Error('Эксперт не найден');
	return db.transaction(async (tx) => {
		const [expert] = await tx.select().from(schema.translationExperts).where(eq(schema.translationExperts.id, target.id)).for('update');
		if (!expert) throw new Error('Эксперт не найден');
		if (expert.adminDocId) return expert.adminDocId;
		const [source] = await tx.select().from(schema.translationDocs).where(eq(schema.translationDocs.id, expert.docId));
		const [doc] = await tx.insert(schema.translationDocs).values({ token: newToken(), kind: 'expert-admin', title: `Обсуждение с экспертом: ${expert.name}`, items: source.items, guide: source.guide }).returning();
		await tx.update(schema.translationExperts).set({ adminDocId: doc.id }).where(eq(schema.translationExperts.id, expert.id));
		return doc.id;
	});
}

/** Имя меняется во всех ссылках этого эксперта. */
export async function renameExpert(
	sourceId: number,
	reviewId: number,
	expertId: number,
	rawName: string
) {
	const name = validName(rawName);
	const expert = await findExpert(sourceId, reviewId, expertId);
	if (!expert) throw new Error('Эксперт не найден');
	await db
		.update(schema.translationExperts)
		.set({ name })
		.where(
			and(
				eq(schema.translationExperts.personId, expert.personId),
				eq(schema.translationExperts.reconciliationId, reviewId)
			)
		);
}
