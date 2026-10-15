import type { PageServerLoad } from './$types';
import { getPricing } from '$lib/server/pricing.server';

export const load: PageServerLoad = async () => ({ prices: await getPricing() });
