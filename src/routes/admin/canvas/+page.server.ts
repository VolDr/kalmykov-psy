import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const clientId = url.searchParams.get('id');

	if (!clientId) {
		throw error(400, 'Client ID is required');
	}

	// You can add additional authorization checks here using locals.user
	// For now, we'll just return the clientId to use as sceneId

	return {
		clientId,
		sceneId: clientId // Use clientId as sceneId
	};
};
