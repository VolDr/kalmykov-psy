import { articleService, serializeArticle } from '$lib/server/article.server';
import {
	pageContentService,
	getPageContentWithDefaults
} from '$lib/server/page-content.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [articles, dbContent] = await Promise.all([
		articleService.getAll(),
		pageContentService.getPageContent('articles')
	]);

	const content = getPageContentWithDefaults('articles', dbContent);

	return {
		articles: articles.map(serializeArticle),
		content
	};
};
