import { error } from '@sveltejs/kit';
import { getDocByToken } from '#lib/server/translations.server.js';
import { getReviewerReconciliation } from '#lib/server/translation-reconciliation.server.js';
import { reviewDigest } from '#lib/server/translation-review-public.server.js';
import type { RequestHandler } from './$types';
import { getExpertDiscussionContext } from '#lib/server/translation-expert-discussion.server.js';

export const GET: RequestHandler = async ({ params, request }) => {
	if (params.slot !== '1' && params.slot !== '2') error(404);
	const doc = await getDocByToken(params.token);
	if (!doc) error(404);
	let avatar: string | undefined;
	if (doc.kind === 'expert' || doc.kind === 'expert-admin') {
		const context = await getExpertDiscussionContext(doc.id);
		avatar = params.slot === '1' ? context?.profiles[1].avatar : undefined;
	} else {
		if (doc.kind !== 'review') error(404);
		const review = await getReviewerReconciliation(doc.id);
		avatar = review?.participants.find((p) => p.slot === Number(params.slot))?.profile.avatar;
	}
	if (!avatar) error(404);
	const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(avatar);
	if (!match) error(404);
	const etag = `"${reviewDigest(avatar)}"`;
	const headers = {
		'Content-Type': match[1], 'Cache-Control': 'private, no-cache',
		'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', ETag: etag
	};
	if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
	return new Response(Buffer.from(match[2], 'base64'), { headers });
};
