import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

interface ContactTypeServiceDto {
	name: string;
}

class ContactTypeService {
	async getOrCreate(payload: ContactTypeServiceDto) {
		const [existingContactType] = await db
			.select()
			.from(schema.contactType)
			.where(eq(schema.contactType.name, payload.name))
			.limit(1);

		if (existingContactType) {
			return existingContactType;
		}

		const now = new Date().toISOString();

		const [contactType] = await db
			.insert(schema.contactType)
			.values({
				name: payload.name,
				disabled: false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return contactType;
	}

	async getAll() {
		const contactTypes = await db.select().from(schema.contactType);
		return contactTypes;
	}
}

export const contactTypeService = new ContactTypeService();
