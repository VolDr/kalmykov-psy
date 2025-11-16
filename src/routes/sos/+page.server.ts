import {
	pageContentService,
	getPageContentWithDefaults
} from '$lib/server/page-content.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const dbContent = await pageContentService.getPageContent('sos');
	const content = getPageContentWithDefaults('sos', dbContent);

	return {
		content
	};
};
