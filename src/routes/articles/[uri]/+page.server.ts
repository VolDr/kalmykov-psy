import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'X-Robots-Tag': 'noindex, nofollow' });
	throw error(404, 'Статья не найдена');
};
