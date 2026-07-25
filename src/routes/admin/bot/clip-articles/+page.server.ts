import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import {
	createClipArticle,
	isSlugCollision,
	listClipArticles,
	validateSlug
} from '$lib/server/clip-articles.server';

export const load: PageServerLoad = async () => {
	return { articles: await listClipArticles() };
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const title = (form.get('title') as string)?.trim();
		const slug = (form.get('slug') as string)?.trim().toLowerCase();

		if (!title) return fail(400, { createError: 'Укажите название статьи' });
		if (!slug) return fail(400, { createError: 'Укажите slug для URL' });
		const slugError = validateSlug(slug);
		if (slugError) return fail(400, { createError: slugError });

		let created;
		try {
			created = await createClipArticle({ slug, title });
		} catch (err) {
			if (isSlugCollision(err)) {
				return fail(400, { createError: 'Статья с таким slug уже есть' });
			}
			throw err;
		}

		throw redirect(303, `/admin/bot/clip-articles/${created.id}`);
	}
} satisfies Actions;
