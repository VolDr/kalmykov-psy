import { SALEBOT_API_KEY } from '$env/static/private';

export type SaleBotPayload = Record<string, unknown> & { client_id: number };

export async function sendSaleBotCallback(payload: SaleBotPayload): Promise<void> {
	const url = `https://chatter.salebot.pro/api/${SALEBOT_API_KEY}/callback`;

	const bodyStr = JSON.stringify(payload);
	console.log('[SaleBot DEBUG] → POST', url.replace(SALEBOT_API_KEY, '***'), '| body:', bodyStr);

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: bodyStr
	});

	const responseText = await response.text();
	console.log('[SaleBot DEBUG] ← HTTP', response.status, '| response:', responseText);

	if (!response.ok) {
		console.error(`[SaleBot] callback failed: HTTP ${response.status}`, responseText);
		throw new Error(`SaleBot callback failed with HTTP ${response.status}`);
	}
}
