import type { PageServerLoad } from './$types';
import { getAvailabilities, CONSULTATION_PRICE, PACKAGE_PRICE } from '$lib/server/booking.server';

export const load: PageServerLoad = async ({ url }) => {
	const sbClientId = url.searchParams.get('sb_client_id');

	if (url.searchParams.has('acquaintance')) {
		const availabilities = await getAvailabilities();
		return { availabilities, price: '0', type: 'acquaintance' as const, sbClientId };
	}
	const type = url.searchParams.get('type') === 'package' ? 'package' : 'single';
	const price = type === 'package' ? PACKAGE_PRICE : CONSULTATION_PRICE;
	const availabilities = await getAvailabilities();
	return { availabilities, price, type, sbClientId };
};
