import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const path = params.path || '';
	redirect(301, `/surveys/${path}`);
};
