import { articleService, serializeArticle } from '$lib/server/article.server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const article = await articleService.getByUri(params.uri);

	if (!article) {
		throw error(404, 'Статья не найдена');
	}

	// Increment view count
	await articleService.incrementViewCount(article.id);

	return {
		article: serializeArticle(article)
	};
};
