import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { getPricing, savePricing } from '$lib/server/pricing.server';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	return { prices: await getPricing() };
};

function parsePrice(value: FormDataEntryValue | null): number | null {
	if (typeof value !== 'string' || !/^[1-9]\d{0,6}$/.test(value)) return null;
	const amount = Number(value);
	return amount <= 1_000_000 ? amount : null;
}

export const actions: Actions = {
	save: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const singleValue = form.get('single');
		const packageValue = form.get('package');
		const single = parsePrice(singleValue);
		const packagePrice = parsePrice(packageValue);
		if (single === null || packagePrice === null) {
			return fail(400, {
				error: 'Укажите целые суммы от 1 до 1 000 000 ₽ для обоих тарифов.',
				values: { single: String(singleValue ?? ''), package: String(packageValue ?? '') }
			});
		}
		await savePricing({ single, package: packagePrice });
		return { success: true };
	}
};
