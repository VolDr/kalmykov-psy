import {
	pageContentService,
	siteSettingsService,
	serializePageContent,
	serializeSiteSetting
} from '$lib/server/page-content.server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const PAGE_OPTIONS = [
	{ slug: 'home', name: 'Главная страница' },
	{ slug: 'online-therapy', name: 'Онлайн-терапия' },
	{ slug: 'for-doctors', name: 'Для врачей' },
	{ slug: 'sos', name: 'Экстренная помощь' },
	{ slug: 'articles', name: 'Статьи' },
	{ slug: 'surveys', name: 'Опросники' }
];

export const load: PageServerLoad = async ({ url }) => {
	const selectedPage = url.searchParams.get('page') || 'home';
	const pageContent = await pageContentService.getAllForPage(selectedPage);
	const siteSettings = await siteSettingsService.getAllRaw();

	return {
		pageOptions: PAGE_OPTIONS,
		selectedPage,
		pageContent: pageContent.map(serializePageContent),
		siteSettings: siteSettings.map(serializeSiteSetting)
	};
};

export const actions: Actions = {
	saveSection: async ({ request }) => {
		const formData = await request.formData();
		const pageSlug = formData.get('pageSlug') as string;
		const sectionKey = formData.get('sectionKey') as string;
		const contentJson = formData.get('content') as string;
		const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
		const isActive = formData.get('isActive') === 'true';

		if (!pageSlug || !sectionKey) {
			return fail(400, { error: 'Укажите страницу и ключ секции' });
		}

		let content: any;
		try {
			content = JSON.parse(contentJson);
		} catch {
			return fail(400, { error: 'Неверный JSON формат' });
		}

		try {
			const result = await pageContentService.upsert({
				pageSlug,
				sectionKey,
				content,
				sortOrder,
				isActive
			});
			return { success: true, section: serializePageContent(result) };
		} catch (error) {
			console.error('Error saving section:', error);
			return fail(500, { error: 'Не удалось сохранить секцию' });
		}
	},

	deleteSection: async ({ request }) => {
		const formData = await request.formData();
		const pageSlug = formData.get('pageSlug') as string;
		const sectionKey = formData.get('sectionKey') as string;

		if (!pageSlug || !sectionKey) {
			return fail(400, { error: 'Укажите страницу и ключ секции' });
		}

		try {
			await pageContentService.delete(pageSlug, sectionKey);
			return { success: true };
		} catch (error) {
			console.error('Error deleting section:', error);
			return fail(500, { error: 'Не удалось удалить секцию' });
		}
	},

	saveSiteSetting: async ({ request }) => {
		const formData = await request.formData();
		const key = formData.get('key') as string;
		const valueJson = formData.get('value') as string;
		const description = formData.get('description') as string;

		if (!key) {
			return fail(400, { error: 'Укажите ключ настройки' });
		}

		let value: any;
		try {
			value = JSON.parse(valueJson);
		} catch {
			return fail(400, { error: 'Неверный JSON формат' });
		}

		try {
			const result = await siteSettingsService.set(key, value, description || undefined);
			return { success: true, setting: serializeSiteSetting(result) };
		} catch (error) {
			console.error('Error saving setting:', error);
			return fail(500, { error: 'Не удалось сохранить настройку' });
		}
	}
};
