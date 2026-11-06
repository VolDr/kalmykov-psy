import type { RequestHandler } from './$types';

const MEDIA_ASSET = /^(?:vision_bundle\.mjs|wasm\/[A-Za-z0-9_-]+\.(?:wasm|js)|models\/selfie_segmenter\.tflite)$/;

const handler: RequestHandler = async ({ params, request }) => {
	const asset = params.asset || '';
	if (!MEDIA_ASSET.test(asset)) return new Response('Not found', { status: 404 });

	try {
		// Galene's optional MediaPipe distribution is installed in
		// /opt/galene/static/third-party/tasks-vision. Keep worker, module,
		// model and wasm on the SvelteKit origin without adding extra CORS.
		const response = await fetch(
			'http://127.0.0.1:8443/third-party/tasks-vision/' + asset,
			{ method: request.method === 'HEAD' ? 'HEAD' : 'GET', signal: AbortSignal.timeout(15000) }
		);
		if (!response.ok) return new Response('Blur assets are not installed', { status: 404 });

		const contentType = asset.endsWith('.mjs') || asset.endsWith('.js')
			? 'text/javascript; charset=utf-8'
			: asset.endsWith('.wasm')
				? 'application/wasm'
				: 'application/octet-stream';
		const headers = {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=86400',
			'X-Content-Type-Options': 'nosniff'
		};
		return new Response(request.method === 'HEAD' ? null : response.body, { status: 200, headers });
	} catch {
		return new Response('Blur assets are unavailable', { status: 503 });
	}
};

export const GET = handler;
export const HEAD = handler;
