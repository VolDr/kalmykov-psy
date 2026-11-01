import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { feedbackService, serializeFeedback } from '#lib/server/feedback.server.js';
import { currentStateService, serializeCurrentState } from '#lib/server/current-state.server.js';
import { feedbackSchema } from '#lib/types/feedback.js';
import { currentStateSchema } from '#lib/types/currentState.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const code = params.code;
	const isAuth = !!locals.user;

	const [feedback, currentState] = await Promise.all([
		feedbackService.get(code, { client: true }),
		currentStateService.get(code, { client: true })
	]);

	const serializedFeedback = serializeFeedback(feedback);
	const serializedCurrentState = serializeCurrentState(currentState);

	if (
		(feedback && feedback.disabled && !isAuth) ||
		(currentState && currentState.disabled && !isAuth)
	) {
		throw error(404, 'Страница не найдена');
	}

	if (!serializedFeedback && !serializedCurrentState) {
		throw error(404, 'Страница не найдена');
	}

	return {
		feedback: serializedFeedback
			? {
					...serializedFeedback,
					client: isAuth ? serializedFeedback.client : undefined,
					smallClientData: {
						invocation: serializedFeedback.client?.invocation,
						gender: serializedFeedback.client?.gender
					}
				}
			: undefined,
		currentState: serializedCurrentState
			? {
					...serializedCurrentState,
					client: isAuth ? serializedCurrentState.client : undefined,
					smallClientData: {
						invocation: serializedCurrentState.client?.invocation,
						gender: serializedCurrentState.client?.gender
					}
				}
			: undefined
	};
};

export const actions = {
	send_feedback: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		if (data.smallId !== params.code) return fail(404, { error: 'Форма не найдена' });
		if (data.actionType && !locals.user) return fail(403, { error: 'Доступ запрещён' });

		const isAuth = !!locals.user;

		// Validate based on action type
		const actionType = data.actionType as string | undefined;

		// Admin actions
		if (actionType && isAuth) {
			const smallId = data.smallId as string;
			const feedback = await feedbackService.get(smallId, { client: false });

			if (!feedback) {
				return fail(404, { error: 'Feedback not found' });
			}

			if (actionType === 'disable' || actionType === 'enable') {
				await feedbackService.update(smallId, {
					editable: actionType === 'enable'
				});
				return {
					success: true,
					message: actionType === 'enable' ? 'Редактирование включено' : 'Редактирование отключено'
				};
			} else if (actionType === 'on' || actionType === 'off') {
				await feedbackService.update(smallId, {
					disabled: actionType === 'off'
				});
				return {
					success: true,
					message: actionType === 'off' ? 'Форма скрыта' : 'Форма открыта'
				};
			}

			return { success: true };
		}

		// Regular feedback submission
		const result = feedbackSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		const { smallId, attitude, goals, method, generally } = result.data;

		const payload = { attitude, goals, method, generally };
		const saved = isAuth
			? await feedbackService.update(params.code, { ...payload, editable: false })
			: await feedbackService.submit(params.code, payload);

		if (!saved) return fail(409, { error: 'Форма недоступна или уже отправлена' });
		return { success: true, message: 'Обратная связь отправлена' };
	},

	send_current_state: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		if (data.smallId !== params.code) return fail(404, { error: 'Форма не найдена' });
		if (data.actionType && !locals.user) return fail(403, { error: 'Доступ запрещён' });

		const isAuth = !!locals.user;

		// Validate based on action type
		const actionType = data.actionType as string | undefined;

		// Admin actions
		if (actionType && isAuth) {
			const smallId = data.smallId as string;
			const currentState = await currentStateService.get(smallId, { client: false });

			if (!currentState) {
				return fail(404, { error: 'Current state not found' });
			}

			if (actionType === 'disable' || actionType === 'enable') {
				await currentStateService.update(smallId, {
					editable: actionType === 'enable'
				});
				return {
					success: true,
					message: actionType === 'enable' ? 'Редактирование включено' : 'Редактирование отключено'
				};
			} else if (actionType === 'on' || actionType === 'off') {
				await currentStateService.update(smallId, {
					disabled: actionType === 'off'
				});
				return {
					success: true,
					message: actionType === 'off' ? 'Форма скрыта' : 'Форма открыта'
				};
			}

			return { success: true };
		}

		// Regular current state submission
		const result = currentStateSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		const { smallId, individual, family, social, generally } = result.data;

		const payload = { individual, family, social, generally };
		const saved = isAuth
			? await currentStateService.update(params.code, { ...payload, editable: false })
			: await currentStateService.submit(params.code, payload);

		if (!saved) return fail(409, { error: 'Форма недоступна или уже отправлена' });
		return { success: true, message: 'Текущее состояние отправлено' };
	}
} satisfies Actions;
