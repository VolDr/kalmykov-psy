import { getDocByToken } from '#lib/server/translations.server.js';
import { getReviewerSlot } from '#lib/server/translation-reconciliation.server.js';
import {
	addReviewComment,
	deleteReviewComment
} from '#lib/server/translation-review-comments.server.js';
import { parseReviewCommentRequest } from '#lib/data/translation-reconciliation.js';
import type { RequestHandler } from './$types';
import { getExpertDiscussionContext, addExpertComment, deleteExpertComment } from '#lib/server/translation-expert-discussion.server.js';

const noStore = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) =>
	Response.json({ ok: false, error }, { status, headers: noStore });

/** Добавление и удаление своих комментариев по личной ссылке участника. */
export const POST: RequestHandler = async ({ params, request }) => {
	const doc = await getDocByToken(params.token);
	if (!doc || !['review', 'expert', 'expert-admin'].includes(doc.kind)) return fail('Не найдено', 404);
	if (doc.kind === 'expert' || doc.kind === 'expert-admin') {
		const context = await getExpertDiscussionContext(doc.id);
		if (!context) return fail('Не найдено', 404);
		const parsed = parseReviewCommentRequest(await request.json().catch(() => null), new Set(doc.items.map((item) => item.key)));
		if (!parsed.ok) return fail(parsed.error, 400);
		const action = parsed.request;
		if (action.op === 'delete') {
			await deleteExpertComment(context.id, context.slot, action.id);
			return Response.json({ ok: true }, { headers: noStore });
		}
		const comment = await addExpertComment(context.id, context.slot, action);
		return comment ? Response.json({ ok: true, comment }, { headers: noStore }) : fail('Комментарий уже удалён', 409);
	}
	const review = await getReviewerSlot(doc.id);
	if (!review) return fail('Не найдено', 404);
	let raw: unknown;
	try {
		raw = JSON.parse(await request.text());
	} catch {
		return fail('Некорректный запрос', 400);
	}
	const parsed = parseReviewCommentRequest(raw, new Set(doc.items.map((item) => item.key)));
	if (!parsed.ok) return fail(parsed.error, 400);
	const { request: action } = parsed;
	if (action.op === 'delete') {
		await deleteReviewComment(review.id, review.slot, action.id);
		return Response.json({ ok: true }, { headers: noStore });
	}
	const comment = await addReviewComment(review.id, review.slot, action);
	if (!comment) return fail('Комментарий уже удалён', 409);
	return Response.json({ ok: true, comment }, { headers: noStore });
};
