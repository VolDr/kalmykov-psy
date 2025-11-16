import {
	pageContentService,
	serializePageContent
} from '$lib/server/page-content.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Pages that use block-based structure
const BLOCK_PAGES = [
	{ slug: 'home', name: 'Главная страница' },
	{ slug: 'online-therapy', name: 'Онлайн-терапия' },
	{ slug: 'for-doctors', name: 'Для врачей' },
	{ slug: 'sos', name: 'Экстренная помощь' }
];

export const load: PageServerLoad = async ({ url }) => {
	const selectedPage = url.searchParams.get('page') || 'home';

	// Get blocks for selected page
	const blocksContent = await pageContentService.get(selectedPage, 'blocks');

	return {
		pageOptions: BLOCK_PAGES,
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
	}
};
