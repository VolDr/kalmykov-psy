import { error } from '@sveltejs/kit';
import { getDocByToken, getEntries } from '#lib/server/translations.server.js';
import { getExpertDiscussionContext, publicExpertDiscussion } from '#lib/server/translation-expert-discussion.server.js';
import { getReviewerReconciliation } from '#lib/server/translation-reconciliation.server.js';
import { publicReviewerReview, reviewDigest } from '#lib/server/translation-review-public.server.js';
import type { RequestHandler } from './$types';
import { expertPublicEntries } from '#lib/data/translation-expert.js';

export const GET: RequestHandler = async ({ params, request }) => {
	const doc = await getDocByToken(params.token);
	if (!doc) error(404, 'Страница не найдена');
	let body: string;
	if (doc.kind === 'expert' || doc.kind === 'expert-admin') {
		const context = await getExpertDiscussionContext(doc.id);
		if (!context) error(404);
		body = JSON.stringify({ discussion: await publicExpertDiscussion(context, params.token), entries: expertPublicEntries(await getEntries(context.expertDocId)) });
	} else {
		if (doc.kind !== 'review') error(404, 'Страница не найдена');
		const review = await getReviewerReconciliation(doc.id);
		if (!review) error(404, 'Страница не найдена');
		const { participants, comments } = publicReviewerReview(review, params.token);
		body = JSON.stringify({ participants, comments });
	}
	const etag = `"${reviewDigest(body)}"`;
	const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', ETag: etag };
	if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
	return new Response(body, { headers: { ...headers, 'Content-Type': 'application/json' } });
};
