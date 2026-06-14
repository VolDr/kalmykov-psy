import type { RequestHandler } from './$types';
import { markPaid, getPaymentById } from '$lib/server/robokassa.server';
import { confirmByPaymentId, getBookingByPaymentId } from '$lib/server/booking.server';
import { telegramService } from '$lib/server/telegram.server';
import { sendSaleBotCallback } from '$lib/server/salebot.server';

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
	if (result === 'slot_taken') {
		console.error(`confirmByPaymentId: slot taken after lock expired for paymentId=${invId} — manual refund needed`);
	}

	if (result === 'confirmed') {
		// Оплата + бронирование через сайт
		const booking = await getBookingByPaymentId(invId);
		if (booking) {
			telegramService.sendPaymentConfirmed({
				email: booking.email,
				amount: outSum,
				description: 'Консультация (бронирование)',
				bookedAt: booking.bookedAt
			}).catch((e) => console.error('Telegram payment notification failed:', e));

			telegramService.sendBookingConfirmed({
				clientName: booking.clientName,
				email: booking.email,
				bookedAt: booking.bookedAt,
				source: 'website'
			}).catch((e) => console.error('Telegram booking notification failed:', e));

			// [DEBUG]
			console.log('[SaleBot DEBUG] consultation_booked проверка — sbClientId:', booking.sbClientId, '| bookingId:', booking.id);
			if (booking.sbClientId) {
				console.log('[SaleBot DEBUG] ✓ sbClientId есть, отправляем consultation_booked для client_id:', booking.sbClientId);
				sendSaleBotCallback({
					client_id: booking.sbClientId,
					message: 'consultation_booked',
					consultation_booked: 1
				}).catch((e) => console.error('[SaleBot] consultation_booked failed:', e));
			} else {
				console.log('[SaleBot DEBUG] sbClientId отсутствует — consultation_booked не отправляется');
			}
		}
	} else if (result === 'not_found') {
		// Оплата без бронирования (страница /pay — консультация или пакет)
		const payment = await getPaymentById(invId);
		if (payment) {
			telegramService.sendPaymentConfirmed({
				email: payment.email ?? '—',
				amount: outSum,
				description: payment.description
			}).catch((e) => console.error('Telegram payment notification failed:', e));
		} else {
			console.error(`confirmByPaymentId: booking not found for paymentId=${invId}`);
		}
	}

	return new Response(`OK${invId}`, { status: 200 });
};
