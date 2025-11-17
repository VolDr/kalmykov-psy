import {
	pageContentService,
	getPageContentWithDefaults
} from '$lib/server/page-content.server';
import type { PageServerLoad } from './$types';
import type { PageBlock } from '$lib/types/page-blocks';

export const load: PageServerLoad = async () => {
	const dbContent = await pageContentService.getPageContent('sos');
	const content = getPageContentWithDefaults('sos', dbContent);

	// Load blocks from constructor (if available)
	const blocksData = await pageContentService.get('sos', 'blocks');
	const rawBlocks = blocksData?.content;
	const blocks: PageBlock[] = Array.isArray(rawBlocks) ? rawBlocks : [];

	return {
		content,
		blocks,
		hasBlocks: blocks.length > 0
	};
};
