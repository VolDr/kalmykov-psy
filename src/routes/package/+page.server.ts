import type { PageServerLoad } from './$types';
import { getPricing } from '#lib/server/pricing.server.js';

export const load: PageServerLoad = async () => ({ price: (await getPricing()).package });
