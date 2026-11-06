import { createHash } from 'node:crypto';
import type { ReviewerReconciliation } from '#lib/data/translation-reconciliation.js';

export const reviewDigest = (value: string) => createHash('sha256').update(value).digest('hex');

/** Images are shared by URL, rather than embedding the same base64 in every item. */
export function publicReviewerReview(review: ReviewerReconciliation, token: string): ReviewerReconciliation {
	const profile = (value: ReviewerReconciliation['profile'], slot: number) => ({
		name: value.name,
		avatar: value.avatar ? `/translate/${encodeURIComponent(token)}/avatar/${slot}?v=${reviewDigest(value.avatar)}` : ''
	});
	return {
		...review,
		profile: profile(review.profile, review.slot),
		participants: review.participants.map((participant) => ({
			...participant, profile: profile(participant.profile, participant.slot)
		}))
	};
}
