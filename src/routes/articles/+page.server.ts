import { articleService, serializeArticle } from '$lib/server/article.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const articles = await articleService.getAll();

	return {
		articles: articles.map(serializeArticle)
	};
};
