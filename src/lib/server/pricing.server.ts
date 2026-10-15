import { db } from '../..';
import { servicePricing } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { ServicePrices } from '$lib/pricing';

// Запрос без кэша: изменённый тариф действует на следующем запросе к странице/API.
export async function getPricing(): Promise<ServicePrices> {
	const [row] = await db
		.select({ single: servicePricing.singlePrice, package: servicePricing.packagePrice })
		.from(servicePricing)
		.where(eq(servicePricing.id, 1))
		.limit(1);
	if (!row) throw new Error('Тарифы не инициализированы: примените миграцию 0021_service_pricing');
	return row;
}

export async function savePricing(prices: ServicePrices): Promise<void> {
	const rows = await db
		.update(servicePricing)
		.set({ singlePrice: prices.single, packagePrice: prices.package, updatedAt: new Date().toISOString() })
		.where(eq(servicePricing.id, 1))
		.returning({ id: servicePricing.id });
	if (rows.length !== 1) throw new Error('Тарифы не инициализированы');
}
