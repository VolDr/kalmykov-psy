import type { PageServerLoad } from './$types';
import { getBookingByPaymentId } from '$lib/server/booking.server';

export const load: PageServerLoad = async ({ url }) => {
	const invIdStr = url.searchParams.get('InvId');
	if (!invIdStr) return { bookingStatus: 'unknown' as const, invId: null as number | null };

	const invId = parseInt(invIdStr, 10);
	if (isNaN(invId)) return { bookingStatus: 'unknown' as const, invId: null as number | null };

	const booking = await getBookingByPaymentId(invId);
	return { bookingStatus: (booking?.status ?? 'unknown') as string, invId };
};
