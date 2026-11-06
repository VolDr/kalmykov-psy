import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import { getEntries } from './translations.server';
import { listReviewComments } from './translation-review-comments.server';
import {
	parseSecondTranslation,
	validateVariant,
	type ReconciliationProfile
} from '#lib/data/translation-reconciliation.js';

const newToken = () => Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');
const validId = (id: number) => Number.isSafeInteger(id) && id > 0;

export function validateReviewerProfile(name: unknown, avatar: unknown): ReconciliationProfile {
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 80)
		throw new Error('Укажите имя до 80 символов');
	if (typeof avatar !== 'string' || avatar.length > 240_000)
		throw new Error('Аватарка слишком велика');
	if (avatar) {
		const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(avatar);
		if (!match) throw new Error('Нужна картинка PNG, JPEG или WebP');
		const bytes = Buffer.from(match[2], 'base64');
		const valid =
			match[1] === 'png'
				? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
				: match[1] === 'jpeg'
					? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
					: bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
		if (!valid || bytes.length < 12) throw new Error('Не удалось прочитать изображение');
	}
	return { name: name.trim(), avatar };
}

export async function createReconciliation(sourceDocId: number, secondText: string, title: string) {
	if (!validId(sourceDocId)) throw new Error('Исходный документ не найден');
	if (!title.trim() || title.trim().length > 150)
		throw new Error('Укажите название до 150 символов');
	return db.transaction(async (tx) => {
		const [source] = await tx
			.select()
			.from(schema.translationDocs)
			.where(eq(schema.translationDocs.id, sourceDocId))
			.for('update');
		if (!source || source.kind !== 'translation') throw new Error('Исходный документ не найден');
		if (!source.items.length) throw new Error('В документе нет пунктов для согласования');
		const rows = await tx
			.select()
			.from(schema.translationEntries)
			.where(eq(schema.translationEntries.docId, sourceDocId));
		const variantA = validateVariant(
			Object.fromEntries(
				source.items.map((item) => [
					item.key,
					rows.find((row) => row.itemKey === item.key)?.translation ?? ''
				])
			),
			source.items
		);
		const variantB = parseSecondTranslation(secondText, source.items);
		const [finalDoc] = await tx
			.insert(schema.translationDocs)
			.values({ token: newToken(), title: title.trim(), kind: 'consensus', items: source.items })
			.returning();
		const [review] = await tx
			.insert(schema.translationReconciliations)
			.values({
				sourceDocId,
				finalDocId: finalDoc.id,
				title: title.trim(),
				items: source.items,
				variantA,
				variantB
			})
			.returning();
		for (const slot of [1, 2]) {
			const [doc] = await tx
				.insert(schema.translationDocs)
				.values({ token: newToken(), title: title.trim(), kind: 'review', items: source.items })
				.returning();
			await tx.insert(schema.translationReviewers).values({
				reconciliationId: review.id,
				slot,
				docId: doc.id,
				profile: { name: `Участник ${slot}`, avatar: '' }
			});
		}
		return review.id;
	});
}

/** Общие ответы участников, без чужих токенов и идентификаторов документов. */
export async function getReviewerReconciliation(docId: number) {
	const [row] = await db
		.select({
			id: schema.translationReconciliations.id,
			title: schema.translationReconciliations.title,
			variantA: schema.translationReconciliations.variantA,
			variantB: schema.translationReconciliations.variantB,
			profile: schema.translationReviewers.profile,
			slot: schema.translationReviewers.slot
		})
		.from(schema.translationReviewers)
		.innerJoin(
			schema.translationReconciliations,
			eq(schema.translationReviewers.reconciliationId, schema.translationReconciliations.id)
		)
		.where(eq(schema.translationReviewers.docId, docId));
	if (!row) return null;
	const participants = await db
		.select({
			slot: schema.translationReviewers.slot,
			profile: schema.translationReviewers.profile,
			docId: schema.translationReviewers.docId
		})
		.from(schema.translationReviewers)
		.where(eq(schema.translationReviewers.reconciliationId, row.id))
		.orderBy(asc(schema.translationReviewers.slot));
	return {
		...row,
		participants: await Promise.all(
			participants.map(async ({ slot, profile, docId }) => ({
				slot,
				profile,
				entries: await getEntries(docId)
			}))
		),
		comments: await listReviewComments(row.id)
	};
}

/** Раунд и место участника по его документу — без загрузки ответов. */
export async function getReviewerSlot(docId: number) {
	const [row] = await db
		.select({
			id: schema.translationReviewers.reconciliationId,
			slot: schema.translationReviewers.slot
		})
		.from(schema.translationReviewers)
		.where(eq(schema.translationReviewers.docId, docId));
	return row ?? null;
}

export async function listReconciliations(sourceDocId: number) {
	return db
		.select({
			id: schema.translationReconciliations.id,
			title: schema.translationReconciliations.title,
			createdAt: schema.translationReconciliations.createdAt
		})
		.from(schema.translationReconciliations)
		.where(eq(schema.translationReconciliations.sourceDocId, sourceDocId))
		.orderBy(desc(schema.translationReconciliations.id));
}

export async function getReconciliationSaveTarget(sourceDocId: number, id: number) {
	if (!validId(sourceDocId) || !validId(id)) return null;
	const [target] = await db
		.select({
			finalDocId: schema.translationReconciliations.finalDocId,
			items: schema.translationReconciliations.items
		})
		.from(schema.translationReconciliations)
		.where(
			and(
				eq(schema.translationReconciliations.id, id),
				eq(schema.translationReconciliations.sourceDocId, sourceDocId)
			)
		);
	return target ?? null;
}

export async function getAdminReconciliation(sourceDocId: number, id: number) {
	if (!validId(sourceDocId) || !validId(id)) return null;
	const [review] = await db
		.select()
		.from(schema.translationReconciliations)
		.where(
			and(
				eq(schema.translationReconciliations.id, id),
				eq(schema.translationReconciliations.sourceDocId, sourceDocId)
			)
		);
	if (!review) return null;
	const participants = await db
		.select({
			slot: schema.translationReviewers.slot,
			docId: schema.translationReviewers.docId,
			profile: schema.translationReviewers.profile,
			token: schema.translationDocs.token
		})
		.from(schema.translationReviewers)
		.innerJoin(
			schema.translationDocs,
			eq(schema.translationReviewers.docId, schema.translationDocs.id)
		)
		.where(eq(schema.translationReviewers.reconciliationId, id))
		.orderBy(asc(schema.translationReviewers.slot));
	return {
		...review,
		participants: await Promise.all(
			participants.map(async (participant) => ({
				...participant,
				entries: await getEntries(participant.docId)
			}))
		),
		finalEntries: await getEntries(review.finalDocId),
		comments: await listReviewComments(review.id)
	};
}

export async function updateReviewerProfile(
	sourceDocId: number,
	id: number,
	slot: number,
	profile: ReconciliationProfile
) {
	const review = await getAdminReconciliation(sourceDocId, id);
	if (!review || ![1, 2].includes(slot)) throw new Error('Участник не найден');
	await db
		.update(schema.translationReviewers)
		.set({ profile: validateReviewerProfile(profile.name, profile.avatar) })
		.where(
			and(
				eq(schema.translationReviewers.reconciliationId, id),
				eq(schema.translationReviewers.slot, slot)
			)
		);
}

export async function regenerateReviewerToken(sourceDocId: number, id: number, slot: number) {
	const review = await getAdminReconciliation(sourceDocId, id);
	const participant = review?.participants.find((participant) => participant.slot === slot);
	if (!participant) throw new Error('Участник не найден');
	await db
		.update(schema.translationDocs)
		.set({ token: newToken() })
		.where(eq(schema.translationDocs.id, participant.docId));
}
