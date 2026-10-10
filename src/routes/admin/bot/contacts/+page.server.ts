import type { PageServerLoad } from './$types';
import { CONTACTS_LIST_LIMIT, listContacts } from '$lib/server/bot-contacts.server';
import { funnelStats } from '$lib/server/bot-funnel.server';
import { listChannelPosts, postStartKey } from '$lib/server/bot-channel-posts.server';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const [contacts, funnel, posts] = await Promise.all([
		listContacts(search),
		funnelStats(30),
		listChannelPosts()
	]);

	// Кнопки постов приводят людей с источником cp_<id> — подписываем его постом
	const postSources: Record<string, string> = {};
	for (const { post } of posts) {
		postSources[postStartKey(post.id)] = `пост: ${post.title ?? `№${post.messageId}`}`;
	}

	return {
		contacts,
		funnel,
		postSources,
		search,
		limitReached: contacts.length >= CONTACTS_LIST_LIMIT
	};
};
