import { Readable } from 'node:stream';
import type { RequestHandler } from './$types';
import {
	getHlsManifest, getWebinar, isReleasedSegment,
	isValidViewerKey, liveHlsPlaylist, openSegment, webinarState
} from '#lib/server/webinars.server.js';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const handler: RequestHandler = async ({ params, cookies, request }) => {
	const { id, file } = params;
	if (!/^[a-f0-9]{16}$/.test(id)) return new Response('Not found', { status: 404 });
	const webinar = await getWebinar(id);
	if (!webinar || !isValidViewerKey(webinar, cookies.get('webinar_access') || '')) {
		return new Response('Forbidden', { status: 403, headers });
	}
	const state = webinarState(webinar);
	if (state === 'waiting') return new Response('Waiting for scheduled start', { status: 425, headers });
	if (state !== 'live') return new Response('Webinar ended or media unavailable', { status: 410, headers });

	if (file === 'index.m3u8') {
		const manifest = await getHlsManifest(id);
		if (!manifest) return new Response('Not found', { status: 404, headers });
		const playlist = liveHlsPlaylist(webinar, manifest);
		if (!playlist) return new Response('Not started', { status: 425, headers });
		return new Response(request.method === 'HEAD' ? null : playlist, {
			status: 200,
			headers: { ...headers, 'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8' }
		});
	}

	if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.ts$/.test(file)) return new Response('Not found', { status: 404 });
	const segment = await openSegment(id, file).catch(() => null);
	if (!segment) return new Response('Not found', { status: 404, headers });
	if (!isReleasedSegment(webinar, segment.segment)) {
		return new Response('Segment not aired yet', { status: 425, headers });
	}
	const segmentHeaders = {
		...headers,
		'Content-Type': 'video/mp2t',
		'Content-Length': String(segment.size)
	};
	if (request.method === 'HEAD') return new Response(null, { status: 200, headers: segmentHeaders });
	const stream = Readable.toWeb(segment.stream()) as unknown as ReadableStream<Uint8Array>;
	return new Response(stream, { status: 200, headers: segmentHeaders });
};
export const GET = handler;
export const HEAD = handler;
