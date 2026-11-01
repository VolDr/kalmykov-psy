import https from 'node:https';
import { SocksProxyAgent } from 'socks-proxy-agent';

/** Only numeric provider diagnostics are retained, never tokens, URLs or message bodies. */
export class InstagramApiError extends Error {
	constructor(
		readonly status: number,
		readonly code?: number
	) {
		super(`Instagram API: HTTP ${status}${code === undefined ? '' : `, code ${code}`}`);
	}
}

export function instagramRequest(
	url: URL,
	accessToken: string,
	proxy: string,
	body?: Record<string, unknown>
): Promise<unknown> {
	url.searchParams.set('access_token', accessToken);
	const payload = body === undefined ? undefined : JSON.stringify(body);
	return new Promise((resolve, reject) => {
		let agent: SocksProxyAgent | undefined;
		try {
			agent = proxy ? new SocksProxyAgent(proxy) : undefined;
		} catch {
			reject(new Error('Invalid Instagram proxy configuration'));
			return;
		}
		const req = https.request(
			url,
			{
				method: payload === undefined ? 'GET' : 'POST',
				agent,
				headers:
					payload === undefined
						? {}
						: {
								'Content-Type': 'application/json',
								'Content-Length': Buffer.byteLength(payload)
							}
			},
			(res) => {
				const chunks: Buffer[] = [];
				let length = 0;
				res.on('data', (chunk: Buffer) => {
					length += chunk.length;
					if (length > 1024 * 1024) {
						req.destroy(new Error('Instagram API response too large'));
						return;
					}
					chunks.push(chunk);
				});
				res.on('error', () => reject(new Error('Instagram API connection interrupted')));
				res.on('end', () => {
					try {
						const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
						const status = res.statusCode ?? 0;
						if (status < 200 || status >= 300 || result?.error) {
							reject(
								new InstagramApiError(
									status,
									typeof result?.error?.code === 'number' ? result.error.code : undefined
								)
							);
						} else {
							resolve(result);
						}
					} catch {
						reject(new InstagramApiError(res.statusCode ?? 0));
					}
				});
			}
		);
		// Includes proxy negotiation and DNS, not only an already connected socket.
		const timeout = setTimeout(() => req.destroy(new Error('Instagram API timeout')), 30_000);
		timeout.unref();
		req.on('close', () => {
			clearTimeout(timeout);
			agent?.destroy();
		});
		req.on('error', () => reject(new Error('Instagram API request failed (network or timeout)')));
		if (payload !== undefined) req.write(payload);
		req.end();
	});
}
