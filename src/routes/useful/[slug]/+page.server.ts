import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEnabledClipArticleBySlug } from '$lib/server/clip-articles.server';

export const load: PageServerLoad = async ({ params }) => {
	const article = await getEnabledClipArticleBySlug(params.slug);
	if (!article || article.pages.length === 0) throw error(404, 'Страница не найдена');

	return {
		article: {
			slug: article.slug,
			title: article.title,
			subtitle: article.subtitle,
			pages: article.pages,
			quizEnabled: article.quizEnabled,
			quizButtonText: article.quizButtonText,
			resultHeading: article.resultHeading,
			resultTextGreen: article.resultTextGreen,
			resultTextOrange: article.resultTextOrange,
			resultTextRed: article.resultTextRed,
			botCtaText: article.botCtaText,
			botCtaButtonText: article.botCtaButtonText
		}
	};
};
