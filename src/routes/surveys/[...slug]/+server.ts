import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Only redirect old questionnaire URLs that have exact equivalents.
const questionnaireSlugs = new Set(['phq9', 'gad7', 'cpq', 'psi', 'ips', 'bat4', 'bat12', 'bat23']);

export const GET: RequestHandler = ({ params }) => {
	const slug = params.slug?.replace(/\\/$/, '').toLowerCase();
	if (!slug || !questionnaireSlugs.has(slug)) error(404, 'Опросник не найден');
	redirect(301, `/questionnaires/${slug}`);
};
