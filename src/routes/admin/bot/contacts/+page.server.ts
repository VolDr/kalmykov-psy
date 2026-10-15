import type { PageServerLoad } from './$types';
import { listContacts } from '$lib/server/bot-contacts.server';
import { funnelStats } from '$lib/server/bot-funnel.server';
import { listChannelPosts, postStartKey } from '$lib/server/bot-channel-posts.server';
import { getBotAccessCheckState } from '$lib/server/bot-contact-access.server';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const archived = url.searchParams.get('view') === 'archive';
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const [contactList, funnel, posts] = await Promise.all([
		listContacts(search, Number.isFinite(requestedPage) ? requestedPage : 1, archived),
		funnelStats(30),
		listChannelPosts()
	]);

	// Кнопки постов приводят людей с источником cp_<id> — подписываем его постом
	const postSources: Record<string, string> = {};
	for (const { post } of posts) {
		postSources[postStartKey(post.id)] = `пост: ${post.title ?? `№${post.messageId}`}`;
	}

	return {
		...contactList,
		funnel,
		postSources,
		search,
		archived,
		accessCheck: getBotAccessCheckState()
	};
};
