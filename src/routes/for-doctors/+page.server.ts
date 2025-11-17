import { pageContentService, getPageContentWithDefaults } from '$lib/server/page-content.server';
import type { PageServerLoad } from './$types';
import type { PageBlock, PageLayoutSettings } from '$lib/types/page-blocks';

export const load: PageServerLoad = async () => {
	const dbContent = await pageContentService.getPageContent('for-doctors');
	const content = getPageContentWithDefaults('for-doctors', dbContent);

	// Load blocks from constructor (if available)
	const blocksData = await pageContentService.get('for-doctors', 'blocks');
	const rawBlocks = blocksData?.content;
	const blocks: PageBlock[] = Array.isArray(rawBlocks) ? rawBlocks : [];

	// Load layout settings
	const layoutData = await pageContentService.get('for-doctors', 'layout');
	const layout: PageLayoutSettings | undefined = layoutData?.content as
		| PageLayoutSettings
		| undefined;

	return {
		content,
		blocks,
		layout,
		hasBlocks: blocks.length > 0
	};
};
