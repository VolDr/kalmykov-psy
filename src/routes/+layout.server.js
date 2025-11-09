/** @type {import('./$types').LayoutServerLoad} */
export const load = ({ url, locals }) => {
	const { pathname } = url;

	return {
		pathname,
		user: locals.user
	};
};
