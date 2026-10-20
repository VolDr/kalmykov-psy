import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Legacy questionnaire catalog URL: preserve old search and external links.
export const GET: RequestHandler = () => {
	redirect(301, '/questionnaires');
};
