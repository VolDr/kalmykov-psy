import type { Cookies } from '@sveltejs/kit';

const MAX_AGE_S = 6 * 60 * 60;

export const playerCookieName = (code: string) => `pt_${code}`;

export function readPlayerToken(cookies: Cookies, code: string): string | undefined {
	return cookies.get(playerCookieName(code));
}

export function writePlayerToken(cookies: Cookies, code: string, token: string, secure: boolean) {
	cookies.set(playerCookieName(code), token, {
		path: '/play',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: MAX_AGE_S
	});
}
