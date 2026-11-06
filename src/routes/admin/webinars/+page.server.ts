import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/protected.js';
import { createWebinar, deleteWebinar, listWebinars } from '#lib/server/webinars.server.js';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	const webinars = await listWebinars();
	return { webinars };
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const title = String(form.get('title') || '').trim();
		const startAt = String(form.get('startAt') || '');
		try {
			const webinar = await createWebinar(title, startAt);
			return { created: webinar.id };
		} catch (error) {
			return fail(400, { error: error instanceof Error ? error.message : 'Не удалось создать вебинар.' });
		}
	},
	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = String(form.get('id') || '');
		if (form.get('confirm') !== id) return fail(400, { error: 'Подтвердите удаление.' });
		try {
			await deleteWebinar(id);
			return { deleted: id };
		} catch (error) {
			return fail(400, { error: error instanceof Error ? error.message : 'Не удалось удалить вебинар.' });
		}
	}
} satisfies Actions;
