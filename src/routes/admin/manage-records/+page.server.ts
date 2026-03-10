import { activityService, serializeActivity } from '$lib/server/activity.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [activities, countByDate] = await Promise.all([
		activityService.getAll({ client: true }),
		activityService.groupByDate()
	]);

	return {
		activities: activities.map(serializeActivity).filter((a) => a !== undefined),
		countByDate: countByDate.map((c) => ({
			scheduledDay: new Date(c.scheduledDay),
			_count: c._count
		}))
	};
};
