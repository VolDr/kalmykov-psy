import { Readable } from 'node:stream';
import type { RequestHandler } from './$types';
import { getVideoFile, isValidViewerKey, webinarState } from '#lib/server/webinars.server.js';

const MAX_CHUNK = 8 * 1024 * 1024;
const headers = { 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes', 'Content-Type': 'video/mp4' };

const handler: RequestHandler = async ({ params, request, cookies }) => {
	if (!/^[a-f0-9]{16}$/.test(params.id)) return new Response('Not found', { status: 404 });
	const file = await getVideoFile(params.id).catch(() => null);
	if (!file || !isValidViewerKey(file.webinar, cookies.get('webinar_access') || '')) {
		return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
	}
	if (webinarState(file.webinar) !== 'live') {
		return new Response('Показ еще не начался или уже завершился', { status: 403, headers: { 'Cache-Control': 'no-store' } });
	}

	const size = file.info.size;
	if (!size) return new Response('Empty video', { status: 404 });
	const range = request.headers.get('range');
	let start = 0;
	let end = size - 1;
	if (range) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range);
		if (!match || (!match[1] && !match[2])) {
			return new Response('Invalid range', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
		}
		if (!match[1]) {
			const suffix = Number(match[2]);
			start = Math.max(0, size - suffix);
			end = Math.min(size - 1, start + MAX_CHUNK - 1);
		} else {
			start = Number(match[1]);
			end = match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
			end = Math.min(end, start + MAX_CHUNK - 1);
		}
		if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start < 0 || end < start) {
			return new Response('Range not satisfiable', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
		}
	}
	// Send bounded byte ranges to avoid buffering an entire recording in
	// Node.js. The browser requests further ranges as playback progresses.
	const resultHeaders = {
		...headers,
		...(range ? { 'Content-Range': 'bytes ' + start + '-' + end + '/' + size } : {}),
		'Content-Length': String(end - start + 1)
	};
	const status = range ? 206 : 200;
	if (request.method === 'HEAD') return new Response(null, { status, headers: resultHeaders });
	const stream = Readable.toWeb(file.stream(start, end)) as unknown as ReadableStream<Uint8Array>;
	return new Response(stream, { status, headers: resultHeaders });
};

export const GET = handler;
export const HEAD = handler;
