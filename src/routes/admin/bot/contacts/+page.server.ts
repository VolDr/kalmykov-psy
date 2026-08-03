import type { PageServerLoad } from './$types';
import { CONTACTS_LIST_LIMIT, listContacts } from '$lib/server/bot-contacts.server';
import { funnelStats } from '$lib/server/bot-funnel.server';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const [contacts, funnel] = await Promise.all([listContacts(search), funnelStats(30)]);

	return { contacts, funnel, search, limitReached: contacts.length >= CONTACTS_LIST_LIMIT };
};
