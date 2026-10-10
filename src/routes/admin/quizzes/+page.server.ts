import { fail, redirect } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/protected';
import { deleteQuiz, listQuizzes, parseQuizInput, saveQuiz } from '$lib/server/game-quizzes.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	return { quizzes: await listQuizzes() };
};

export const actions: Actions = {
	save: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const rawId = String(form.get('id') ?? '');
		const id = rawId ? Number(rawId) : null;

		let payload: unknown;
		try {
			payload = JSON.parse(String(form.get('payload') ?? ''));
		} catch {
			return fail(400, { error: 'Не удалось прочитать форму' });
		}

		const parsed = parseQuizInput(payload);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const savedId = await saveQuiz(id, parsed.data);
		redirect(303, `/admin/quizzes?edit=${savedId}&saved=1`);
	},

	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const id = Number(form.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Не указана викторина' });
		await deleteQuiz(id);
		redirect(303, '/admin/quizzes');
	}
};
