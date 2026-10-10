import { normalizeCode, subscribe } from '$lib/server/game-rooms.server';
import { readPlayerToken } from '$lib/server/game-cookie.server';
import type { RequestHandler } from './$types';

const HEARTBEAT_MS = 15_000;

export const GET: RequestHandler = ({ params, cookies, request }) => {
	const code = normalizeCode(params.code);
	const token = readPlayerToken(cookies, code);
	const encoder = new TextEncoder();

	let cleanup = () => {};

	const stream = new ReadableStream({
		start(controller) {
			const write = (chunk: string) => controller.enqueue(encoder.encode(chunk));

			const unsubscribe = subscribe(code, token, (view) =>
				write(`data: ${JSON.stringify(view)}\n\n`)
			);
			if (!unsubscribe) {
				// Комнаты нет или токен чужой (например, после перезапуска сервера)
				write('event: gone\ndata: {}\n\n');
				controller.close();
				return;
			}

			const heartbeat = setInterval(() => {
				try {
					// Именованное событие, а не комментарий: комментарии EventSource скрывает,
					// а клиенту нужно видеть, что поток жив
					write('event: ping\ndata: {}\n\n');
				} catch {
					cleanup();
				}
			}, HEARTBEAT_MS);

			let closed = false;
			cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(heartbeat);
				unsubscribe();
				try {
					controller.close();
				} catch {
					// поток уже закрыт клиентом
				}
			};
			request.signal.addEventListener('abort', cleanup);
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			// Чтобы nginx не буферизовал поток
			'X-Accel-Buffering': 'no'
		}
	});
};
