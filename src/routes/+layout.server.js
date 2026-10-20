import { VITE_URL } from '$env/static/private';

/** @type {import('./$types').LayoutServerLoad} */
export const load = ({ url, locals }) => {
	const { pathname } = url;
	const baseUrl = (VITE_URL || 'https://kalmykov-psy.ru').replace(/\/+$/, '');
	const canonicalUrl = `${baseUrl}${pathname}`;

	return {
		pathname,
		canonicalUrl
	};
};
