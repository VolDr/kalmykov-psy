import { createHash } from 'crypto';
import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, and, lt } from 'drizzle-orm';

export const ROBOKASSA_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

// Read env at call time so tests can stub process.env before calling
function cfg() {
	return {
		login: (process.env.ROBOKASSA_LOGIN ?? '').trim(),
		pass1: (process.env.ROBOKASSA_PASS1 ?? '').trim(),
		pass2: (process.env.ROBOKASSA_PASS2 ?? '').trim(),
		isTest: (process.env.ROBOKASSA_IS_TEST ?? '0').trim()
	};
}

function buildReceipt(description: string, outSum: string) {
	return {
		items: [
			{
				name: description.substring(0, 128),
				quantity: 1,
				sum: Math.round(parseFloat(outSum) * 100) / 100,
				payment_method: 'full_payment',
				payment_object: 'service',
				tax: 'none'
			}
		]
	};
}

function paymentSig(outSum: string, invId: number, receiptEncoded?: string): string {
	const { login, pass1 } = cfg();
	const base = receiptEncoded
		? `${login}:${outSum}:${invId}:${receiptEncoded}:${pass1}`
		: `${login}:${outSum}:${invId}:${pass1}`;
	return createHash('md5').update(base).digest('hex');
}

function resultSig(outSum: string, invId: number): string {
	return createHash('md5').update(`${outSum}:${invId}:${cfg().pass2}`).digest('hex');
}

export function isTestMode(): boolean {
	return cfg().isTest === '1';
}

export function validateResultSig(outSum: string, invId: number, sig: string): boolean {
	return resultSig(outSum, invId).toLowerCase() === sig.toLowerCase();
}

export async function createPayment(params: {
	outSum: string;
	description: string;
	email?: string;
	expiresInMinutes?: number;
	successUrl?: string;
	failUrl?: string;
}) {
	const now = new Date().toISOString();
	const [payment] = await db
		.insert(schema.robokassaPayment)
		.values({
			outSum: params.outSum,
			description: params.description,
			email: params.email ?? null,
			updatedAt: now
		})
		.returning();

	const receiptJson = JSON.stringify(buildReceipt(payment.description, params.outSum));
	const receiptEncoded = encodeURIComponent(receiptJson);
	const sig = paymentSig(params.outSum, payment.id, receiptEncoded);

	const minutes = params.expiresInMinutes ?? 15;
	const expiration = new Date(Date.now() + minutes * 60 * 1000);
	const expirationDate = expiration.toISOString().replace(/\.\d{3}Z$/, '+00:00');

	return {
		url: ROBOKASSA_URL,
		fields: {
			MerchantLogin: cfg().login,
			OutSum: params.outSum,
			InvId: String(payment.id),
			Description: payment.description,
			// Robokassa verifies the signature against the URL-encoded Receipt value.
			// The browser will encode this form value once more for transport; Robokassa
			// decodes that layer and receives exactly the value used in paymentSig().
			Receipt: receiptEncoded,
			SignatureValue: sig,
			IsTest: isTestMode() ? '1' : '0',
			ExpirationDate: expirationDate,
			...(params.email ? { Email: params.email } : {}),
			...(params.successUrl ? { SuccessURL: params.successUrl } : {}),
			...(params.failUrl ? { FailURL: params.failUrl } : {})
		} as Record<string, string>
	};
}

export async function markPaid(invId: number, outSum: string, sig: string): Promise<boolean> {
	if (!validateResultSig(outSum, invId, sig)) return false;

	const [payment] = await db
		.select()
		.from(schema.robokassaPayment)
		.where(eq(schema.robokassaPayment.id, invId))
		.limit(1);

	// Reject if payment not found or amount doesn't match (prevents cheap-payment attack)
	if (!payment || parseFloat(payment.outSum) !== parseFloat(outSum)) return false;

	await db
		.update(schema.robokassaPayment)
		.set({ status: 'paid', updatedAt: new Date().toISOString() })
		.where(eq(schema.robokassaPayment.id, invId));
	return true;
}

export async function getPaymentById(id: number) {
	const [p] = await db
		.select()
		.from(schema.robokassaPayment)
		.where(eq(schema.robokassaPayment.id, id))
		.limit(1);
	return p ?? null;
}

export async function releaseExpiredPayments(): Promise<number> {
	const expiredBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
	const result = await db
		.update(schema.robokassaPayment)
		.set({ status: 'failed', updatedAt: new Date().toISOString() })
		.where(
			and(
				eq(schema.robokassaPayment.status, 'pending'),
				lt(schema.robokassaPayment.createdAt, expiredBefore)
			)
		)
		.returning({ id: schema.robokassaPayment.id });
	return result.length;
}
