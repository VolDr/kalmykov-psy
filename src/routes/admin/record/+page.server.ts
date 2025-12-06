import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { schemaRecordNewClient, schemaRecordExistingClient } from '$lib/types/record';
import { clientService } from '$lib/server/client.server';
import { contactService } from '$lib/server/contact.server';
import { activityService } from '$lib/server/activity.server';
import { sourceService } from '$lib/server/source.server';
import { feedbackService } from '$lib/server/feedback.server';
import { currentStateService } from '$lib/server/current-state.server';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import * as locale from 'dayjs/locale/ru.js';
import { v4 as uuid } from 'uuid';

dayjs.extend(customParseFormat);
dayjs.locale(locale.name);

type ContactType = 'phone' | 'telegram';

export const load: PageServerLoad = async ({ url }) => {
	let initialClientId = url.searchParams.get('clientId') ?? undefined;
	let initialDate = url.searchParams.get('date') ?? undefined;

	const tryParseDate = isNaN(Date.parse(dayjs(initialDate, 'DD-MM-YYYY-HH-mm').format()));
	if (tryParseDate) {
		initialDate = undefined;
	}

	let editActivityId = url.searchParams.get('id') ?? undefined;

	let description: string | undefined;
	let contact: string | undefined;
	let client: Awaited<ReturnType<typeof clientService.getByUuid>> | undefined;

	if (editActivityId !== undefined) {
		const activity = await activityService.get(editActivityId, { client: true });
		if (!activity || activity.disabled) {
			editActivityId = undefined;
		} else {
			initialDate = dayjs(activity.scheduledDate).format('DD-MM-YYYY-HH-mm');
			initialClientId = activity.clientId;
			description = activity.description ?? undefined;
			contact =
				(
					await contactService.getFirstByClient({
						clientId: initialClientId
					})
				)?.value ?? undefined;
			client = (await clientService.getByUuid(initialClientId)) ?? undefined;
		}
	}

	const clients = await clientService.getAll();
	const names: Array<{
		id: string;
		value: string;
		numOfActivities: number;
		nick: string | undefined;
		lastActivityDate: Date | null;
	}> = [];

	clients.forEach((c) => {
		const nick = c.nick ?? undefined;
		const lastActivityDate =
			c.activities.length > 0
				? new Date(
						Math.max(
							...c.activities.map((a) => {
								const date = a.scheduledDate;
								return typeof date === 'string'
									? new Date(date).getTime()
									: new Date(date).getTime();
							})
						)
					)
				: null;

		names.push({
			id: c.id,
			value: c.name,
			numOfActivities: c.activities.length,
			nick,
			lastActivityDate
		});
	});

	// Sort: clients with activities by last activity date (desc), then clients without activities
	names.sort((a, b) => {
		if (a.lastActivityDate && b.lastActivityDate) {
			return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
		}
		if (a.lastActivityDate && !b.lastActivityDate) {
			return -1;
		}
		if (!a.lastActivityDate && b.lastActivityDate) {
			return 1;
		}
		return 0;
	});

	const suggestedSources = (await sourceService.getAll()).map((c) => c.name);

	return {
		suggestedNames: names,
		suggestedSources,
		initialDate,
		initialClientId,
		description,
		editActivityId,
		contact,
		gender: client?.gender,
		invocation: client?.invocation
	};
};

function makeClientId(record: { name: string; phone: string }) {
	return `${record.name}_${record.phone}`;
}

function formatPhone(phone: string) {
	if (phone.startsWith('+')) {
		return phone
			.replaceAll('-', '')
			.replaceAll(' ', '')
			.replaceAll('+', '')
			.replaceAll('(', '')
			.replaceAll(')', '');
	} else {
		return phone.replaceAll(' ', '');
	}
}

function checkContactIsPhone(phone: string, explicitType?: string) {
	// If explicit type is provided, use it
	if (explicitType === 'phone' || explicitType === 'telegram') {
		return explicitType === 'phone';
	}
	// Otherwise, fallback to checking the format
	return phone.startsWith('+');
}

async function createFeedback(clientId: string, datetime: Date | string) {
	async function _createFeedback() {
		const smallId = [...uuid().slice(-7, -1).toLocaleLowerCase()]
			.map((c) => (Math.random() < 0.3 ? c : c.toUpperCase()))
			.join('');
		if ((await feedbackService.get(smallId, {})) || (await currentStateService.get(smallId, {}))) {
			throw new Error('Already exists');
		}
		return await feedbackService.create({
			clientId: clientId,
			attitude: 5,
			disabled: false,
			editable: true,
			generally: 5,
			method: 5,
			goals: 5,
			datetime,
			smallId
		});
	}
	let feedback;
	while (!feedback) {
		try {
			feedback = await _createFeedback();
		} catch (e) {
			///
		}
	}
	return feedback;
}

async function createCurrentState(clientId: string, datetime: Date | string) {
	async function _createCurrentState() {
		const smallId = [...uuid().slice(-7, -1).toLocaleLowerCase()]
			.map((c) => (Math.random() < 0.3 ? c : c.toUpperCase()))
			.join('');
		if ((await feedbackService.get(smallId, {})) || (await currentStateService.get(smallId, {}))) {
			throw new Error('Already exists');
		}
		return await currentStateService.create({
			clientId: clientId,
			family: 5,
			individual: 5,
			social: 5,
			disabled: false,
			editable: true,
			generally: 5,
			datetime,
			smallId
		});
	}
	let currentState;
	while (!currentState) {
		try {
			currentState = await _createCurrentState();
		} catch (e) {
			///
		}
	}
	return currentState;
}

async function updateFeedback(
	clientId: string,
	oldDatetime: Date | string,
	newDatetime: Date | string
) {
	return await feedbackService.updateByClientIdAndDate(clientId, oldDatetime, {
		datetime: newDatetime
	});
}

async function updateCurrentState(
	clientId: string,
	oldDatetime: Date | string,
	newDatetime: Date | string
) {
	return await currentStateService.updateByClientIdAndDate(clientId, oldDatetime, {
		datetime: newDatetime
	});
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const intent = formData.get('intent');

		// Handle delete intent
		if (intent === 'delete') {
			const editActivityId = formData.get('editActivityId');
			if (!editActivityId || typeof editActivityId !== 'string') {
				return fail(400, { error: 'ID записи не найден' });
			}

			const activity = await activityService.get(editActivityId, {});
			if (!activity) {
				return fail(404, { error: 'Запись не найдена' });
			}

			const client = await clientService.getByUuid(activity.clientId);
			if (!client) {
				return fail(404, { error: 'Клиент не найден' });
			}

			await activityService.delete(editActivityId);

			throw redirect(303, '/admin/manage-records');
		}

		const timestamp = formData.get('timestamp');
		const formattedTimestamp =
			timestamp && typeof timestamp === 'string' ? dayjs(timestamp).format('DD-MM-YYYY-HH-mm') : '';

		const data = Object.fromEntries(formData);
		data.timestamp = formattedTimestamp;
		data.date = formattedTimestamp;

		// Try parsing as new client
		const newClientResult = schemaRecordNewClient.safeParse(data);
		if (newClientResult.success) {
			const { data: validData } = newClientResult;
			const formattedData = {
				phone: formatPhone(validData.phone),
				date: dayjs(validData.timestamp, 'DD-MM-YYYY-HH-mm').toDate(),
				name: makeClientId({
					name: validData.name,
					phone: formatPhone(validData.phone)
				}),
				nick: validData.name,
				source: validData.source,
				description: validData.description,
				gender: validData.gender,
				invocation: validData.invocation
			};

			const explicitContactType = validData.contactType;
			const contactIsPhone = checkContactIsPhone(validData.phone, explicitContactType);
			const contactType: ContactType = contactIsPhone ? 'phone' : 'telegram';

			const contact = await contactService.get({
				value: formattedData.phone,
				contactType
			});

			if (await clientService.hasByName(formattedData.name)) {
				return fail(400, { error: `Клиент уже существует: ${formattedData.name}` });
			} else if (contact) {
				const alreadyClient = await clientService.getByUuid(contact.clientId);
				if (!alreadyClient) {
					return fail(500, { error: 'Неизвестная ошибка' });
				}

				return fail(400, {
					error: `Клиент c указанным контактом уже существует : ${alreadyClient.name}`
				});
			} else {
				const client = await clientService.create(formattedData);
				await contactService.getOrCreate({
					clientId: client.id,
					contactType,
					value: formattedData.phone
				});

				const activity = await activityService.create({
					clientId: client.id,
					scheduledDate: formattedData.date,
					status: 'active',
					description: formattedData.description
				});
				await createFeedback(client.id, formattedData.date);
				await createCurrentState(client.id, formattedData.date);

				throw redirect(303, '/admin/manage-records');
			}
		}

		// Try parsing as existing client
		const existingClientResult = schemaRecordExistingClient.safeParse(data);
		if (existingClientResult.success) {
			const { data: validData } = existingClientResult;

			const formattedData = {
				date: dayjs(validData.timestamp, 'DD-MM-YYYY-HH-mm').toDate(),
				clientId: validData.clientId,
				description: validData.description,
				editActivityId: validData.editActivityId
			};

			const client = await clientService.getByUuid(formattedData.clientId);
			if (!client) {
				return fail(404, { error: 'Клиент не найден' });
			}

			if (formattedData.editActivityId !== undefined) {
				const oldActivity = await activityService.get(formattedData.editActivityId, {});
				if (!oldActivity) {
					return fail(404, { error: 'Активность не найдена' });
				}
				await activityService.update(formattedData.editActivityId, {
					clientId: client.id,
					scheduledDate: formattedData.date,
					status: 'active',
					description: formattedData.description
				});
				await updateFeedback(client.id, oldActivity.scheduledDate, formattedData.date);
				await updateCurrentState(client.id, oldActivity.scheduledDate, formattedData.date);

				throw redirect(303, '/admin/manage-records');
			} else {
				await activityService.create({
					clientId: client.id,
					scheduledDate: formattedData.date,
					status: 'active',
					description: formattedData.description
				});
				await createFeedback(client.id, formattedData.date);
				await createCurrentState(client.id, formattedData.date);

				throw redirect(303, '/admin/manage-records');
			}
		}

		return fail(400, { error: 'Неизвестная ошибка' });
	}
} satisfies Actions;
