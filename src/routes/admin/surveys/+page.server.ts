import {
	surveyService,
	surveyCategoryService,
	serializeSurvey,
	serializeSurveyCategory
} from '$lib/server/survey.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SurveyConfig } from '$lib/data/surveys/types';

export const load: PageServerLoad = async ({ url }) => {
	const surveys = await surveyService.getAllWithCategories();
	const categories = await surveyCategoryService.getAll();

	// If requesting a specific survey (for editing)
	const surveyId = url.searchParams.get('edit');
	let fullSurvey = null;
	if (surveyId) {
		fullSurvey = await surveyService.get(surveyId);
	}

	return {
		surveys: surveys.map(serializeSurvey),
		categories: categories.map(serializeSurveyCategory),
		fullSurvey: fullSurvey ? serializeSurvey(fullSurvey) : null
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID опросника не указан' });
		}

		try {
			await surveyService.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting survey:', error);
			return fail(500, { error: 'Не удалось удалить опросник' });
		}
	},

	save: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const categoryId = formData.get('categoryId') as string;
		const configJson = formData.get('config') as string;
		const isPublished = formData.get('isPublished') === 'true';
		const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

		if (!title || !slug) {
			return fail(400, { error: 'Заполните обязательные поля: название и slug' });
		}

		let config: SurveyConfig;
		try {
			config = JSON.parse(configJson);
		} catch (e) {
			return fail(400, { error: 'Неверный формат конфигурации опросника' });
		}

		// Validate config structure
		if (!config.id || !config.title || !config.questions || !config.scoring) {
			return fail(400, {
				error: 'Конфигурация должна содержать: id, title, questions, scoring'
			});
		}

		try {
			if (id) {
				const updated = await surveyService.update(id, {
					title,
					slug,
					description: description || null,
					categoryId: categoryId || null,
					config,
					isPublished,
					sortOrder
				});
				return { success: true, survey: serializeSurvey(updated) };
			} else {
				const created = await surveyService.create({
					title,
					slug,
					description: description || null,
					categoryId: categoryId || null,
					config,
					isPublished,
					sortOrder
				});
				return { success: true, survey: serializeSurvey(created) };
			}
		} catch (error) {
			console.error('Error saving survey:', error);
			return fail(500, { error: 'Не удалось сохранить опросник' });
		}
	},

	togglePublish: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const isPublished = formData.get('isPublished') === 'true';

		if (!id) {
			return fail(400, { error: 'ID опросника не указан' });
		}

		try {
			await surveyService.update(id, { isPublished: !isPublished });
			return { success: true };
		} catch (error) {
			console.error('Error toggling publish:', error);
			return fail(500, { error: 'Не удалось изменить статус публикации' });
		}
	},

	saveCategory: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

		if (!name || !slug) {
			return fail(400, { error: 'Заполните обязательные поля: название и slug' });
		}

		try {
			if (id) {
				const updated = await surveyCategoryService.update(id, {
					name,
					slug,
					description: description || null,
					sortOrder
				});
				return { success: true, category: serializeSurveyCategory(updated) };
			} else {
				const created = await surveyCategoryService.create({
					name,
					slug,
					description: description || null,
					sortOrder
				});
				return { success: true, category: serializeSurveyCategory(created) };
			}
		} catch (error) {
			console.error('Error saving category:', error);
			return fail(500, { error: 'Не удалось сохранить категорию' });
		}
	},

	deleteCategory: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID категории не указан' });
		}

		try {
			await surveyCategoryService.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { error: 'Не удалось удалить категорию' });
		}
	}
};
