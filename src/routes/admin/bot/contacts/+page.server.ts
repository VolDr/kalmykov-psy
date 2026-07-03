import type { PageServerLoad } from './$types';
import { CONTACTS_LIST_LIMIT, listContacts } from '$lib/server/bot-contacts.server';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const contacts = await listContacts(search);

	return { contacts, search, limitReached: contacts.length >= CONTACTS_LIST_LIMIT };
};
