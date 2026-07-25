import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import {
	deleteClipArticle,
	getClipArticle,
	isSlugCollision,
	parsePagesJson,
	updateClipArticle,
	validateSlug
} from '$lib/server/clip-articles.server';

async function loadArticleOr404(idParam: string) {
	const id = parseInt(idParam, 10);
	if (isNaN(id)) throw error(404, 'Статья не найдена');
	const article = await getClipArticle(id);
	if (!article) throw error(404, 'Статья не найдена');
	return article;
}

export const load: PageServerLoad = async ({ params }) => {
	return { article: await loadArticleOr404(params.id) };
};

const optional = (form: FormData, name: string) => (form.get(name) as string)?.trim() || null;

export const actions = {
	update: async (event) => {
		requireAuth(event);
		const article = await loadArticleOr404(event.params.id);
		const form = await event.request.formData();

		const title = (form.get('title') as string)?.trim();
		const slug = (form.get('slug') as string)?.trim().toLowerCase();
		if (!title) return fail(400, { error: 'Укажите название' });
		if (!slug) return fail(400, { error: 'Укажите slug' });
		const slugError = validateSlug(slug);
		if (slugError) return fail(400, { error: slugError });

		const parsed = parsePagesJson((form.get('pages') as string) ?? '[]');
		if ('error' in parsed) return fail(400, { error: parsed.error });

		const enabled = form.get('enabled') === 'on';
		if (enabled && parsed.pages.length === 0) {
			return fail(400, { error: 'Нельзя включить статью без экранов — добавьте хотя бы один' });
		}

		try {
			await updateClipArticle(article.id, {
				title,
				slug,
				subtitle: optional(form, 'subtitle'),
				enabled,
				pages: parsed.pages,
				quizEnabled: form.get('quizEnabled') === 'on',
				quizButtonText: optional(form, 'quizButtonText'),
				resultHeading: optional(form, 'resultHeading'),
				resultTextGreen: optional(form, 'resultTextGreen'),
				resultTextOrange: optional(form, 'resultTextOrange'),
				resultTextRed: optional(form, 'resultTextRed'),
				botCtaText: optional(form, 'botCtaText'),
				botCtaButtonText: optional(form, 'botCtaButtonText')
			});
		} catch (err) {
			if (isSlugCollision(err)) return fail(400, { error: 'Статья с таким slug уже есть' });
			throw err;
		}

		return { success: true };
	},

	delete: async (event) => {
		requireAuth(event);
		const article = await loadArticleOr404(event.params.id);
		await deleteClipArticle(article.id);
		throw redirect(303, '/admin/bot/clip-articles');
	}
} satisfies Actions;
