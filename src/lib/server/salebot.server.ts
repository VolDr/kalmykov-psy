import { SALEBOT_API_KEY } from '$env/static/private';

export type SaleBotPayload = Record<string, unknown> & { client_id: number };

export async function sendSaleBotCallback(payload: SaleBotPayload): Promise<void> {
	const url = `https://chatter.salebot.pro/api/${SALEBOT_API_KEY}/callback`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	const responseText = await response.text();

	if (!response.ok) {
		console.error(`[SaleBot] callback failed: HTTP ${response.status}`, responseText);
		throw new Error(`SaleBot callback failed with HTTP ${response.status}`);
	}
}
