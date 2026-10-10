import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	new Response('Not found', {
		status: 404,
		headers: { 'X-Robots-Tag': 'noindex, nofollow' }
	});
