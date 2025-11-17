import {
	pageContentService,
	serializePageContent
} from '$lib/server/page-content.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Default pages that use block-based structure
const DEFAULT_BLOCK_PAGES = [
	{ slug: 'home', name: 'Главная страница' },
	{ slug: 'online-therapy', name: 'Онлайн-терапия' },
	{ slug: 'for-doctors', name: 'Для врачей' },
	{ slug: 'sos', name: 'Экстренная помощь' }
];

export const load: PageServerLoad = async ({ url }) => {
	const selectedPage = url.searchParams.get('page') || 'home';

	// Get all pages from database
	const allPages = await pageContentService.getAllPages();

	// Merge default pages with pages from database
	const pageSet = new Set<string>();
	const pageOptions: { slug: string; name: string }[] = [];

	// Add default pages first
	for (const page of DEFAULT_BLOCK_PAGES) {
		pageSet.add(page.slug);
		pageOptions.push(page);
	}

	// Add pages from database that are not in defaults
	for (const pageSlug of allPages) {
		if (!pageSet.has(pageSlug)) {
			pageSet.add(pageSlug);
			pageOptions.push({ slug: pageSlug, name: pageSlug });
		}
	}

	// Get blocks for selected page
	const blocksContent = await pageContentService.get(selectedPage, 'blocks');

	return {
		pageOptions,
		selectedPage,
		blocks: blocksContent?.content || [],
		lastUpdated: blocksContent?.updatedAt || null
	};
};

export const actions: Actions = {
	saveBlocks: async ({ request }) => {
		const formData = await request.formData();
		const pageSlug = formData.get('pageSlug') as string;
		const blocksJson = formData.get('blocks') as string;

		if (!pageSlug) {
			return fail(400, { error: 'Укажите страницу' });
		}

		let blocks: any;
		try {
			blocks = JSON.parse(blocksJson);
		} catch {
			return fail(400, { error: 'Неверный JSON формат' });
		}

		if (!Array.isArray(blocks)) {
			return fail(400, { error: 'Блоки должны быть массивом' });
		}

		try {
			const result = await pageContentService.upsert({
				pageSlug,
				sectionKey: 'blocks',
				content: blocks,
				sortOrder: 0,
				isActive: true
			});
			return { success: true, section: serializePageContent(result) };
		} catch (error) {
			console.error('Error saving blocks:', error);
			return fail(500, { error: 'Не удалось сохранить блоки' });
		}
	},

	createPage: async ({ request }) => {
		const formData = await request.formData();
		const pageSlug = formData.get('pageSlug') as string;
		const pageName = formData.get('pageName') as string;

		if (!pageSlug) {
			return fail(400, { error: 'Укажите slug страницы' });
		}

		// Validate slug format (only lowercase letters, numbers, and hyphens)
		if (!/^[a-z0-9-]+$/.test(pageSlug)) {
			return fail(400, {
				error: 'Slug может содержать только латинские буквы в нижнем регистре, цифры и дефисы'
			});
		}

		try {
			// Create an empty blocks array for the new page
			await pageContentService.upsert({
				pageSlug,
				sectionKey: 'blocks',
				content: [],
				sortOrder: 0,
				isActive: true
			});

			return {
				success: true,
				message: `Страница "${pageName || pageSlug}" создана`,
				newPageSlug: pageSlug
			};
		} catch (error) {
			console.error('Error creating page:', error);
			return fail(500, { error: 'Не удалось создать страницу' });
		}
	}
};
