import {
	pageContentService,
	getPageContentWithDefaults
} from '$lib/server/page-content.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const dbContent = await pageContentService.getPageContent('home');
	const content = getPageContentWithDefaults('home', dbContent);

	return {
		content
	};
};
