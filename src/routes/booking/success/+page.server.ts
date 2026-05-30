import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBookingByPaymentId } from '$lib/server/booking.server';
import { getPaymentById } from '$lib/server/robokassa.server';

export const load: PageServerLoad = async ({ url }) => {
	const invIdStr = url.searchParams.get('InvId');
	if (!invIdStr) redirect(302, '/');

	const invId = parseInt(invIdStr, 10);
	if (isNaN(invId)) redirect(302, '/');

	const booking = await getBookingByPaymentId(invId);
	if (booking) {
		const payment = booking.paymentId ? await getPaymentById(booking.paymentId) : null;
		return {
			bookingStatus: booking.status as string,
			bookedAt: booking.bookedAt,
			description: payment?.description ?? null,
			invId
		};
	}

	// Simple payment (single/package) — no booking record
	const payment = await getPaymentById(invId);
	return {
		bookingStatus: (payment?.status ?? 'unknown') as string,
		bookedAt: null,
		description: payment?.description ?? null,
		invId
	};
};
