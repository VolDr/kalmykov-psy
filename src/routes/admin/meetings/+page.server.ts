import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/protected.js';
import {
	createManagedRoom,
	deleteManagedRoom,
	galeneAdminConfigured,
	listManagedRooms,
	reissueRoomInvites,
	type ManagedRoom
} from '#lib/server/galene-admin.server.js';

const safeMessage = (error: unknown) =>
	error instanceof Error && error.name === 'GaleneAdminError'
		? error.message
		: 'Не удалось связаться с Galene. Проверьте службу и настройки административного API.';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	if (!galeneAdminConfigured()) {
		return {
			configured: false,
			rooms: [] as ManagedRoom[],
			backendError: 'Укажите GALENE_ADMIN_USER и GALENE_ADMIN_PASSWORD в окружении сайта.'
		};
	}
	try {
		return { configured: true, rooms: await listManagedRooms(), backendError: null };
	} catch (error) {
		return { configured: true, rooms: [] as ManagedRoom[], backendError: safeMessage(error) };
	}
};

export const actions = {
	create: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const title = String(form.get('title') || '').trim();
		const count = Number(form.get('maxClients') || 2);
		if (!title || title.length > 60 || /[\x00-\x1F]/.test(title)) {
			return fail(400, { error: 'Укажите название комнаты (до 60 символов).' });
		}
		if (!Number.isInteger(count) || count < 2 || count > 12) {
			return fail(400, { error: 'Число участников должно быть от 2 до 12.' });
		}
		try {
			return { created: await createManagedRoom(title, count) };
		} catch (error) {
			return fail(503, { error: safeMessage(error) });
		}
	},
	reissue: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const group = String(form.get('group') || '');
		try {
			return { reissued: await reissueRoomInvites(group) };
		} catch (error) {
			return fail(503, { error: safeMessage(error) });
		}
	},
	delete: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();
		const group = String(form.get('group') || '');
		if (form.get('confirm') !== group) return fail(400, { error: 'Подтвердите удаление комнаты.' });
		try {
			await deleteManagedRoom(group);
			return { deleted: group };
		} catch (error) {
			return fail(503, { error: safeMessage(error) });
		}
	}
} satisfies Actions;
