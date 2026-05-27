import type { RequestHandler } from './$types';
import { markPaid } from '$lib/server/robokassa.server';
import { confirmByPaymentId } from '$lib/server/booking.server';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const outSum = formData.get('OutSum') as string;
	const invId = parseInt(formData.get('InvId') as string, 10);
	const sig = formData.get('SignatureValue') as string;

	if (!outSum || isNaN(invId) || !sig) {
		return new Response('bad request', { status: 400 });
	}

	const ok = await markPaid(invId, outSum, sig);
	if (!ok) return new Response('bad sign', { status: 400 });

	const result = await confirmByPaymentId(invId);

	// slot_taken means payment went through but slot was taken by someone else.
	// The booking is now marked requires_refund for admin to handle manually.
	// We still return OK to Robokassa so it doesn't retry.
	if (result === 'not_found') {
		console.error(`confirmByPaymentId: booking not found for paymentId=${invId}`);
	}
	if (result === 'slot_taken') {
		console.error(`confirmByPaymentId: slot taken after lock expired for paymentId=${invId} — manual refund needed`);
	}

	return new Response(`OK${invId}`, { status: 200 });
};
