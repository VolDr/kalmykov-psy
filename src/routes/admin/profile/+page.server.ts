import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { clientService, serializeClient } from '$lib/server/client.server';
import { contactService, serializeContact } from '$lib/server/contact.server';
import { currentStateService, serializeCurrentState } from '$lib/server/current-state.server';
import { feedbackService, serializeFeedback } from '$lib/server/feedback.server';
import { activityService, serializeActivity } from '$lib/server/activity.server';

export const load: PageServerLoad = async ({ url }) => {
	const clientId = url.searchParams.get('clientId');

	if (!clientId) {
		throw redirect(302, '/admin/manage-records');
	}

	const clientData = await clientService.getByUuid(clientId, {
		source: true,
		activities: true
	});

	if (!clientData) {
		throw redirect(302, '/admin/manage-records');
	}

	const [feedback, currentState, contacts, activities] = await Promise.all([
		feedbackService.getAllByClient(clientData.id, {}),
		currentStateService.getAllByClient(clientData.id, {}),
		contactService.getAllByClient({ clientId: clientData.id }),
		activityService.getAll({
			client: true,
			clientId: clientData.id
		})
	]);

	return {
		clientData: serializeClient(clientData),
		feedback: feedback.map(serializeFeedback).filter((f) => f !== undefined),
		currentState: currentState.map(serializeCurrentState).filter((c) => c !== undefined),
		contacts: contacts.map(serializeContact).filter((c) => c !== undefined),
		activities: activities.map(serializeActivity).filter((a) => a !== undefined)
	};
};
