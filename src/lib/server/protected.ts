import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Middleware to protect routes that require authentication
 * Use this in +page.server.ts or +layout.server.ts load functions
 *
 * @example
 * export const load: PageServerLoad = async (event) => {
 *   requireAuth(event);
 *   // rest of your load function
 * };
 */
export function requireAuth(event: RequestEvent, redirectTo = '/login'): void {
	if (!event.locals.user) {
		throw error(404, 'Страница не найдена');
	}
}

/**
 * Middleware to prevent authenticated users from accessing certain routes
 * (e.g., login page when already logged in)
 *
 * @example
 * export const load: PageServerLoad = async (event) => {
 *   requireGuest(event, '/dashboard');
 *   // rest of your load function
 * };
 */
export function requireGuest(event: RequestEvent, redirectTo = '/'): void {
	if (event.locals.user) {
		throw error(404, 'Страница не найдена');
	}
}
