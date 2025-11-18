import { pageContentService, getPageContentWithDefaults } from '$lib/server/page-content.server';
import {
	surveyService,
	surveyCategoryService,
	serializeSurvey,
	serializeSurveyCategory
} from '$lib/server/survey.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const dbContent = await pageContentService.getPageContent('surveys');
	const content = getPageContentWithDefaults('surveys', dbContent);

	// Get published surveys and categories from database
	const surveys = await surveyService.getPublished();
	const categories = await surveyCategoryService.getAll();

	// Group surveys by category
	const surveysByCategory: Array<{
		category: { id: string; name: string; slug: string; sortOrder: number } | null;
		surveys: Array<{ title: string; link: string; description: string }>;
	}> = [];

	// Add uncategorized surveys first
	const uncategorizedSurveys = surveys
		.filter((s) => !s.categoryId)
		.map((s) => ({
			title: s.title,
			link: `/surveys/${s.slug}`,
			description: s.description || ''
		}));

	if (uncategorizedSurveys.length > 0) {
		surveysByCategory.push({
			category: null,
			surveys: uncategorizedSurveys
		});
	}

	// Add categorized surveys
	for (const category of categories) {
		const categorySurveys = surveys
			.filter((s) => s.categoryId === category.id)
			.map((s) => ({
				title: s.title,
				link: `/surveys/${s.slug}`,
				description: s.description || ''
			}));

		if (categorySurveys.length > 0) {
			surveysByCategory.push({
				category: {
					id: category.id,
					name: category.name,
					slug: category.slug,
					sortOrder: category.sortOrder
				},
				surveys: categorySurveys
			});
		}
	}

	return {
		content,
		surveysByCategory
	};
};
