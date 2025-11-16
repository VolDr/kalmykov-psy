import {
	articleService,
	articleCategoryService,
	serializeArticle,
	serializeArticleCategory
} from '$lib/server/article.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const articles = await articleService.getAllWithCategories();
	const categories = await articleCategoryService.getAll();

	// If requesting a specific article (for editing)
	const articleId = url.searchParams.get('edit');
	let fullArticle = null;
	if (articleId) {
		fullArticle = await articleService.get(articleId);
	}

	return {
		articles: articles.map(serializeArticle),
		categories: categories.map(serializeArticleCategory),
		fullArticle: fullArticle ? serializeArticle(fullArticle) : null
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID статьи не указан' });
		}

		try {
			await articleService.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting article:', error);
			return fail(500, { error: 'Не удалось удалить статью' });
		}
	},

	save: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const uri = formData.get('uri') as string;
		const content = formData.get('content') as string;
		const imageUrl = formData.get('imageUrl') as string;
		const descriptionMeta = formData.get('descriptionMeta') as string;
		const categoryId = formData.get('categoryId') as string;

		if (!title || !uri || !content) {
			return fail(400, { error: 'Заполните обязательные поля: заголовок, URI и контент' });
		}

		try {
			if (id) {
				const updated = await articleService.update(id, {
					title,
					description: description || null,
					uri,
					content,
					imageUrl: imageUrl || null,
					descriptionMeta: descriptionMeta || null,
					categoryId: categoryId || null
				});
				return { success: true, article: serializeArticle(updated) };
			} else {
				const created = await articleService.create({
					title,
					description: description || null,
					uri,
					content,
					imageUrl: imageUrl || null,
					descriptionMeta: descriptionMeta || null,
					categoryId: categoryId || null
				});
				return { success: true, article: serializeArticle(created) };
			}
		} catch (error) {
			console.error('Error saving article:', error);
			return fail(500, { error: 'Не удалось сохранить статью' });
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
				const updated = await articleCategoryService.update(id, {
					name,
					slug,
					description: description || null,
					sortOrder
				});
				return { success: true, category: serializeArticleCategory(updated) };
			} else {
				const created = await articleCategoryService.create({
					name,
					slug,
					description: description || null,
					sortOrder
				});
				return { success: true, category: serializeArticleCategory(created) };
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
			await articleCategoryService.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { error: 'Не удалось удалить категорию' });
		}
	}
};
