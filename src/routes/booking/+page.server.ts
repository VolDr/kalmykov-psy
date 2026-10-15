import type { PageServerLoad } from './$types';
import { getAvailabilities } from '$lib/server/booking.server';
import { getPricing } from '$lib/server/pricing.server';
import { toPaymentAmount } from '$lib/pricing';

export const load: PageServerLoad = async ({ url }) => {
	const sbClientId = url.searchParams.get('sb_client_id');

	if (url.searchParams.has('acquaintance')) {
		const availabilities = await getAvailabilities();
		return { availabilities, price: '0', type: 'acquaintance' as const, sbClientId };
	}
	const type = url.searchParams.get('type') === 'package' ? 'package' : 'single';
	const prices = await getPricing();
	const price = toPaymentAmount(prices[type]);
	const availabilities = await getAvailabilities();
	return { availabilities, price, type, sbClientId };
};
