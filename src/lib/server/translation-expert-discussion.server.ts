import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import type { ExpertDiscussion } from '#lib/data/translation-expert.js';
import type { ReviewComment } from '#lib/data/translation-reconciliation.js';
import { reviewDigest } from './translation-review-public.server';

const columns = { id: schema.translationExpertComments.id, slot: schema.translationExpertComments.slot, itemKey: schema.translationExpertComments.itemKey, body: schema.translationExpertComments.body };

export async function getExpertDiscussionContext(docId: number) {
	const [expert] = await db.select({ id: schema.translationExperts.id, docId: schema.translationExperts.docId, name: schema.translationExperts.name, reviewId: schema.translationExperts.reconciliationId })
		.from(schema.translationExperts).where(or(eq(schema.translationExperts.docId, docId), eq(schema.translationExperts.adminDocId, docId)));
	if (!expert) return null;
	const [reviewer] = await db.select({ profile: schema.translationReviewers.profile }).from(schema.translationReviewers)
		.where(and(eq(schema.translationReviewers.reconciliationId, expert.reviewId), eq(schema.translationReviewers.slot, 1)));
	return {
		id: expert.id, expertDocId: expert.docId, slot: docId === expert.docId ? 2 : 1,
		profiles: { 1: reviewer?.profile ?? { name: 'Администратор', avatar: '' }, 2: { name: expert.name, avatar: '' } }
	};
}

export async function listExpertComments(expertId: number): Promise<ReviewComment[]> {
	return db.select(columns).from(schema.translationExpertComments)
		.where(and(eq(schema.translationExpertComments.expertId, expertId), isNull(schema.translationExpertComments.deletedAt)))
		.orderBy(asc(schema.translationExpertComments.createdAt), asc(schema.translationExpertComments.id));
}

export async function publicExpertDiscussion(context: NonNullable<Awaited<ReturnType<typeof getExpertDiscussionContext>>>, token: string): Promise<ExpertDiscussion> {
	const admin = context.profiles[1];
	return {
		id: context.id, slot: context.slot,
		profiles: { 1: { ...admin, avatar: admin.avatar ? `/translate/${encodeURIComponent(token)}/avatar/1?v=${reviewDigest(admin.avatar)}` : '' }, 2: context.profiles[2] },
		comments: await listExpertComments(context.id)
	};
}

export async function addExpertComment(expertId: number, slot: number, comment: { id: string; itemKey: string; body: string }): Promise<ReviewComment | null> {
	await db.insert(schema.translationExpertComments).values({ ...comment, expertId, slot }).onConflictDoNothing({ target: schema.translationExpertComments.id });
	const [stored] = await db.select(columns).from(schema.translationExpertComments).where(and(
		eq(schema.translationExpertComments.id, comment.id), eq(schema.translationExpertComments.expertId, expertId), eq(schema.translationExpertComments.slot, slot), isNull(schema.translationExpertComments.deletedAt)
	));
	return stored ?? null;
}

export async function deleteExpertComment(expertId: number, slot: number, id: string) {
	await db.update(schema.translationExpertComments).set({ deletedAt: new Date().toISOString() }).where(and(
		eq(schema.translationExpertComments.id, id), eq(schema.translationExpertComments.expertId, expertId), eq(schema.translationExpertComments.slot, slot), isNull(schema.translationExpertComments.deletedAt)
	));
}
