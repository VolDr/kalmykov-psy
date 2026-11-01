
import type { RequestHandler } from './$types';
import { getBookingByPaymentId } from '#lib/server/booking.server.js';
import { getPaymentById } from '#lib/server/robokassa.server.js';

export const GET: RequestHandler = async ({ url }) => {
	const invId = parseInt(url.searchParams.get('invId') ?? '', 10);
	if (isNaN(invId)) return Response.json({ status: 'unknown' });

	const booking = await getBookingByPaymentId(invId);
	if (booking) return Response.json({ status: booking.status });

	// No booking — simple payment (single/package without slot)
	const payment = await getPaymentById(invId);
	if (payment?.status === 'paid') return Response.json({ status: 'paid' });

	return Response.json({ status: 'unknown' });
};
