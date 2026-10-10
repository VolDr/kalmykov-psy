import { error } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { db } from '../../..';
import { postAnalyticsDatasets, postAnalyticsPosts } from '../../../db/schema';
import type {
	ChannelDataset,
	ExpertiseDataset,
	PostsDashboardData,
	StructuresDataset
} from './types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [posts, datasets] = await Promise.all([
		db.select().from(postAnalyticsPosts).orderBy(desc(postAnalyticsPosts.score)),
		db.select().from(postAnalyticsDatasets)
	]);

	const byKey = new Map(datasets.map((dataset) => [dataset.key, dataset]));
	const channel = byKey.get('channel');
	const structures = byKey.get('structures');
	const expertise = byKey.get('expertise');

	if (!channel || !structures || !expertise) {
		error(500, 'Данные аналитики постов не загружены. Примените миграцию 0017.');
	}

	return {
		posts,
		channel: channel.payload as ChannelDataset,
		structures: structures.payload as StructuresDataset,
		expertise: expertise.payload as ExpertiseDataset,
		generatedAt: channel.sourceGeneratedAt
	} satisfies PostsDashboardData;
};
