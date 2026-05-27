import type { PageServerLoad } from './$types';
import { getAvailabilities, CONSULTATION_PRICE, PACKAGE_PRICE } from '$lib/server/booking.server';

export const load: PageServerLoad = async ({ url }) => {
	const type = url.searchParams.get('type') === 'package' ? 'package' : 'single';
	const price = type === 'package' ? PACKAGE_PRICE : CONSULTATION_PRICE;
	const availabilities = await getAvailabilities();
	return { availabilities, price, type };
};
