import { redirect, fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

const editProfileSchema = z.object({
	clientId: z.string(),
	name: z.string().min(1, { message: 'Введите имя' }),
	nick: z.string().optional(),
	source: z.string().min(1, { message: 'Укажите источник' }),
	gender: z.string().optional(),
	invocation: z.string().optional(),
	description: z.string().optional()
});

export const load: PageServerLoad = async ({ url, locals }) => {
	const { clientService } = await import('$lib/server/client.server');
	const { sourceService } = await import('$lib/server/source.server');
	const { contactService, serializeContact } = await import('$lib/server/contact.server');
	const { contactTypeService } = await import('$lib/server/contact-type.server');

	const clientId = url.searchParams.get('clientId');

	if (!clientId) {
		redirect(302, '/admin/manage-records');
	}

	const client = await clientService.getByUuid(clientId, { source: true });

	if (!client) {
		redirect(302, '/admin/manage-records');
	}

	const sources = await sourceService.getAll();
	const contacts = await contactService.getAllByClient({ clientId });
	const contactTypes = await contactTypeService.getAll();

	return {
		client: {
			id: client.id,
			name: client.name,
			nick: client.nick,
			gender: client.gender,
			invocation: client.invocation,
			description: client.description,
			source: client.source?.name
		},
		sources: sources.map((s) => s.name),
		contacts: contacts.map(serializeContact).filter((c) => c !== undefined),
		contactTypes: contactTypes.map((ct) => ct.name)
	};
};

export const actions: Actions = {
	addContact: async ({ request }) => {
		const { contactService } = await import('$lib/server/contact.server');

		const formData = await request.formData();
		const clientId = formData.get('clientId') as string;
		const value = formData.get('value') as string;
		const type = formData.get('type') as string;

		if (!clientId || !value || !type) {
			return fail(400, { error: 'Недостаточно данных для добавления контакта' });
		}

		await contactService.create({
			clientId,
			value,
			contactType: type
		});

		return { success: true };
	},

	updateContact: async ({ request }) => {
		const { contactService } = await import('$lib/server/contact.server');

		const formData = await request.formData();
		const contactId = formData.get('contactId') as string;
		const value = formData.get('value') as string;
		const type = formData.get('type') as string;

		if (!contactId || !value || !type) {
			return fail(400, { error: 'Недостаточно данных для обновления контакта' });
		}

		await contactService.update(contactId, {
			value,
			contactType: type
		});

		return { success: true };
	},

	deleteContact: async ({ request }) => {
		const { contactService } = await import('$lib/server/contact.server');

		const formData = await request.formData();
		const contactId = formData.get('contactId') as string;

		if (!contactId) {
			return fail(400, { error: 'ID контакта не указан' });
		}

		await contactService.delete(contactId);

		return { success: true };
	},

	updateProfile: async ({ request }) => {
		const { clientService } = await import('$lib/server/client.server');

		const formData = await request.formData();
		const data = Object.fromEntries(formData);

		const result = editProfileSchema.safeParse(data);

		if (!result.success) {
			return fail(400, { error: 'Ошибка валидации' });
		}

		const { clientId, name, nick, source, gender, invocation, description } = result.data;

		const client = await clientService.getByUuid(clientId);

		if (!client) {
			return fail(404, { error: 'Клиент не найден' });
		}

		await clientService.updateProfile(client.id, {
			name,
			nick,
			source,
			gender,
			invocation,
			description
		});

		redirect(302, `/admin/profile?clientId=${clientId}`);
	}
};
