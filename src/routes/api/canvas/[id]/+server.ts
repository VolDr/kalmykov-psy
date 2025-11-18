import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple in-memory storage for canvas data
// In production, you would use a database
const canvasStore = new Map<string, any>();

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	const canvasData = canvasStore.get(id);

	if (!canvasData) {
		return json({ elements: [], appState: {} });
	}

	return json(canvasData);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	const data = await request.json();

	canvasStore.set(id, {
		elements: data.elements,
		appState: data.appState,
		updatedAt: new Date().toISOString()
	});

	return json({ success: true });
};
