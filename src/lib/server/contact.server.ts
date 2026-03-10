import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { contactTypeService } from './contact-type.server';

interface ContactDto {
	clientId: string;
	value: string;
	contactType: string;
}

class ContactService {
	async getOrCreate(payload: ContactDto) {
		const [existingContact] = await db
			.select()
			.from(schema.contact)
			.where(eq(schema.contact.value, payload.value))
			.limit(1);

		if (existingContact) {
			return existingContact;
		}

		const contactType = await contactTypeService.getOrCreate({
			name: payload.contactType
		});

		const now = new Date().toISOString();

		const [contact] = await db
			.insert(schema.contact)
			.values({
				value: payload.value,
				clientId: payload.clientId,
				contactTypeId: contactType.id,
				disabled: false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return contact;
	}

	async has(data: { value: string; contactType: string }) {
		return Boolean(await this.get(data));
	}

	async get(data: { value: string; contactType: string }) {
		const contactType = await contactTypeService.getOrCreate({
			name: data.contactType
		});

		const [contact] = await db
			.select()
			.from(schema.contact)
			.where(
				and(eq(schema.contact.value, data.value), eq(schema.contact.contactTypeId, contactType.id))
			)
			.limit(1);

		return contact || null;
	}

	async getFirstByClient(data: { clientId: string }) {
		const [contact] = await db
			.select()
			.from(schema.contact)
			.where(eq(schema.contact.clientId, data.clientId))
			.limit(1);

		return contact || null;
	}

	async getAllByClient(data: { clientId: string }) {
		const contacts = await db
			.select()
			.from(schema.contact)
			.where(eq(schema.contact.clientId, data.clientId));

		const contactsWithType = await Promise.all(
			contacts.map(async (contact) => {
				const [contactType] = await db
					.select()
					.from(schema.contactType)
					.where(eq(schema.contactType.id, contact.contactTypeId))
					.limit(1);

				return {
					...contact,
					contactType
				};
			})
		);

		return contactsWithType;
	}

	async delete(id: string) {
		const [deletedContact] = await db
			.delete(schema.contact)
			.where(eq(schema.contact.id, BigInt(id)))
			.returning();

		return deletedContact;
	}

	async create(data: ContactDto) {
		const contactType = await contactTypeService.getOrCreate({
			name: data.contactType
		});

		const now = new Date().toISOString();

		const [contact] = await db
			.insert(schema.contact)
			.values({
				value: data.value,
				clientId: data.clientId,
				contactTypeId: contactType.id,
				disabled: false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return contact;
	}

	async update(id: string, data: { value: string; contactType: string }) {
		const contactType = await contactTypeService.getOrCreate({
			name: data.contactType
		});

		const now = new Date().toISOString();

		const [contact] = await db
			.update(schema.contact)
			.set({
				value: data.value,
				contactTypeId: contactType.id,
				updatedAt: now
			})
			.where(eq(schema.contact.id, BigInt(id)))
			.returning();

		return contact;
	}
}

export const contactService = new ContactService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

function serializeBigInt(value: bigint | number | null | undefined): string | undefined {
	if (value === null || value === undefined) return undefined;
	return value.toString();
}

export function serializeContact(
	contact:
		| Awaited<ReturnType<(typeof contactService)['get']>>
		| Awaited<ReturnType<(typeof contactService)['getAllByClient']>>[0]
) {
	if (!contact) {
		return undefined;
	}
	return {
		...contact,
		id: serializeBigInt(contact.id),
		createdAt: serializeDate(contact.createdAt),
		updatedAt: serializeDate(contact.updatedAt),
		description: contact.description ?? undefined,
		contactTypeId: serializeBigInt(contact.contactTypeId),
		contactType:
			'contactType' in contact && contact.contactType
				? {
						...contact.contactType,
						id: serializeBigInt(contact.contactType.id),
						createdAt: serializeDate(contact.contactType.createdAt),
						updatedAt: serializeDate(contact.contactType.updatedAt)
					}
				: undefined
	};
}
