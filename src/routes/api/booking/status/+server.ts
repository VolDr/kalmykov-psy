import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBookingByPaymentId } from '$lib/server/booking.server';
import { getPaymentById } from '$lib/server/robokassa.server';

export const GET: RequestHandler = async ({ url }) => {
	const invId = parseInt(url.searchParams.get('invId') ?? '', 10);
	if (isNaN(invId)) return json({ status: 'unknown' });

	const booking = await getBookingByPaymentId(invId);
	if (booking) return json({ status: booking.status });

	// No booking — simple payment (single/package without slot)
	const payment = await getPaymentById(invId);
	if (payment?.status === 'paid') return json({ status: 'paid' });

	return json({ status: 'unknown' });
};
