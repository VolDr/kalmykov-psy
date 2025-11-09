import { redirect, fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { createSession, verifyUser } from '$lib/server/auth.server';

const loginSchema = z.object({
	username: z.string().min(1, { message: 'Введите имя' }).toLowerCase(),
	password: z.string().min(1, { message: 'Введите пароль' })
});

export const load: PageServerLoad = async ({ locals }) => {
	console.log(locals);
	if (locals.user) {
		throw redirect(303, '/admin/manage-records');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
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

		throw redirect(303, '/admin/manage-records');
	}
} satisfies Actions;
