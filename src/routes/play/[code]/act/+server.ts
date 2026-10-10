import { json } from '@sveltejs/kit';
import type { RoomAction } from '$lib/data/game-room-types';
import {
	joinRoom,
	normalizeCode,
	pauseGame,
	resumeGame,
	restartGame,
	startGame,
	submitAnswer
} from '$lib/server/game-rooms.server';
import { readPlayerToken, writePlayerToken } from '$lib/server/game-cookie.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, cookies, url }) => {
	const code = normalizeCode(params.code);
	const token = readPlayerToken(cookies, code);

	let action: RoomAction;
	try {
		action = await request.json();
	} catch {
		return json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
	}

	switch (action.type) {
		case 'join': {
			const result = joinRoom(code, action.name, token);
			if (result.ok) writePlayerToken(cookies, code, result.token, url.protocol === 'https:');
			return json(result.ok ? { ok: true } : result, { status: result.ok ? 200 : 400 });
		}
		case 'start':
			return respond(startGame(code, token));
		case 'answer':
			return respond(
				submitAnswer(code, token, {
					option: action.option,
					options: action.options,
					text: action.text
				})
			);
		case 'pause':
			return respond(pauseGame(code, token));
		case 'resume':
			return respond(resumeGame(code, token));
		case 'restart':
			return respond(restartGame(code, token));
		default:
			return json({ ok: false, error: 'Неизвестное действие' }, { status: 400 });
	}
};

function respond(result: { ok: boolean }) {
	return json(result, { status: result.ok ? 200 : 400 });
}
