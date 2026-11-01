import { fail, redirect } from '@sveltejs/kit';
import { requireAuth } from '#lib/server/protected.js';
import {
	getEntries,
	listDocs,
	listEvents,
	regenerateToken
} from '#lib/server/translations.server.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	const docs = await listDocs();
	const requested = Number(event.url.searchParams.get('id'));
	const doc = docs.find((d) => d.id === requested) ?? docs[0];
	if (!doc) return { docs: [], doc: null };

	const [entries, events] = await Promise.all([getEntries(doc.id), listEvents(doc.id)]);
	return {
		docs: docs.map(({ id, title }) => ({ id, title })),
		doc: {
			id: doc.id,
			title: doc.title,
			items: doc.items,
			token: doc.token,
			link: `${event.url.origin}/translate/${doc.token}`
		},
		entries,
		events
	};
};

export const actions: Actions = {
	regenerate: async (event) => {
		requireAuth(event);
		const id = Number((await event.request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Документ не найден' });
		await regenerateToken(id);
		redirect(303, `/admin/translations?id=${id}`);
	}
};
