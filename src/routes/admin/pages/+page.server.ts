import { pageContentService, serializePageContent } from '$lib/server/page-content.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const PAGE_OPTIONS = [
	{ slug: 'home', name: 'Главная' },
	{ slug: 'online-therapy', name: 'Онлайн-терапия' },
	{ slug: 'for-doctors', name: 'Для врачей' },
	{ slug: 'sos', name: 'SOS' },
	{ slug: 'articles', name: 'Статьи' },
	{ slug: 'surveys', name: 'Опросники' }
];

export const load: PageServerLoad = async ({ url }) => {
	const selectedPage = url.searchParams.get('page') || 'home';
	const pageContent = await pageContentService.getAllForPage(selectedPage);

	return {
		pageOptions: PAGE_OPTIONS,
		selectedPage,
		pageContent: pageContent.map(serializePageContent)
	};
};

export const actions: Actions = {
	saveSEO: async ({ request }) => {
		const formData = await request.formData();
		const pageSlug = formData.get('pageSlug') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const ogImage = formData.get('ogImage') as string;

		if (!pageSlug || !title || !description) {
			return fail(400, { error: 'Заполните обязательные поля: заголовок и описание' });
		}

		try {
			const seoContent = {
				title,
				description,
				...(ogImage && { ogImage })
			};

			const result = await pageContentService.upsert({
				pageSlug,
				sectionKey: 'seo',
				content: seoContent,
				sortOrder: 0,
				isActive: true
			});

			return { success: true, section: serializePageContent(result) };
		} catch (error) {
			console.error('Error saving SEO settings:', error);
			return fail(500, { error: 'Не удалось сохранить SEO настройки' });
		}
	}
};
