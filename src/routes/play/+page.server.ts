import { fail, redirect } from '@sveltejs/kit';
import { getPublishedQuiz, listPublishedQuizzes } from '$lib/server/game-quizzes.server';
import { createRoom, isCreateLimited } from '$lib/server/game-rooms.server';
import { writePlayerToken } from '$lib/server/game-cookie.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ quizzes: await listPublishedQuizzes() });

export const actions: Actions = {
	create: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const quizId = Number(form.get('quizId'));
		const name = String(form.get('name') ?? '');

		const quiz = Number.isInteger(quizId) ? await getPublishedQuiz(quizId) : null;
		if (!quiz) return fail(404, { error: 'Викторина не найдена', quizId });
		if (isCreateLimited(getClientAddress())) {
			return fail(429, { error: 'Слишком много комнат подряд, попробуйте через час', quizId });
		}

		const room = createRoom(quiz, name);
		if (!room.ok) return fail(400, { error: room.error, quizId });

		writePlayerToken(cookies, room.code, room.token, url.protocol === 'https:');
		redirect(303, `/play/${room.code}`);
	}
};
