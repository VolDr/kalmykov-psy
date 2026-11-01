import { redirect, fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { createSession, verifyUser } from '#lib/server/auth.server.js';
import { consumeLimit, limits } from '#lib/server/request-limits.server.js';

const loginSchema = z.object({
	username: z.string().trim().min(1, { message: 'Введите имя' }).max(128).toLowerCase(),
	password: z.string().min(1, { message: 'Введите пароль' }).max(256)
});

// Куда попадает администратор после входа
const AFTER_LOGIN_PATH = '/admin/bookings';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, AFTER_LOGIN_PATH);
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, getClientAddress, setHeaders }) => {
		const throttled = (seconds: number) => {
			setHeaders({ 'Retry-After': String(seconds) });
			return fail(429, {
				username: '',
				errors: { username: undefined, password: 'Слишком много попыток. Попробуйте позже.' }
			});
		};
		try {
			const result = await consumeLimit(limits.loginIp, getClientAddress());
			if (!result.allowed) return throttled(result.retryAfter);
		} catch {
			return fail(503, {
				username: '',
				errors: { username: undefined, password: 'Вход временно недоступен. Попробуйте позже.' }
			});
		}
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		const result = loginSchema.safeParse({ username, password });

		if (!result.success) {
			const errors = result.error.flatten();
			return fail(400, {
				errors: {
					username: errors.fieldErrors.username?.[0],
					password: errors.fieldErrors.password?.[0]
				},
				username: username as string
			});
		}

		const { username: validatedUsername, password: validatedPassword } = result.data;
		try {
			const limit = await consumeLimit(limits.loginAccount, validatedUsername);
			if (!limit.allowed) return throttled(limit.retryAfter);
		} catch {
			return fail(503, {
				username: '',
				errors: { username: undefined, password: 'Вход временно недоступен. Попробуйте позже.' }
			});
		}

		const isValidUser = await verifyUser(validatedUsername, validatedPassword);

		if (!isValidUser) {
			return fail(401, {
				errors: {
					password: 'Неверный логин или пароль'
				},
				username: validatedUsername
			});
		}

		await createSession(cookies, validatedUsername);

		throw redirect(303, AFTER_LOGIN_PATH);
	}
} satisfies Actions;
