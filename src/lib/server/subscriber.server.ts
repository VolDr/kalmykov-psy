import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

class SubscriberService {
	async upsertPending(email: string) {
		const token = crypto.randomUUID();
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		console.log('UPSERT_PENDING: Start for email', email);
		console.log('UPSERT_PENDING: Generated new token', token);

		const existing = await db
			.select()
			.from(schema.subscriber)
			.where(eq(schema.subscriber.email, email))
			.limit(1);

		if (existing.length > 0) {
			console.log('UPSERT_PENDING: Found existing record', existing[0]);
			const [updated] = await db
				.update(schema.subscriber)
				.set({
					status: 'pending',
					token: token,
					updatedAt: now
				})
				.where(eq(schema.subscriber.email, email))
				.returning();

			console.log('UPSERT_PENDING: Updated record', updated);
			return updated;
		}

		console.log('UPSERT_PENDING: Creating new record');
		const [record] = await db
			.insert(schema.subscriber)
			.values({ id, email, status: 'pending', token })
			.returning();

		console.log('UPSERT_PENDING: Created record', record);
		return record;
	}

	async confirmByToken(token: string) {
		console.log('CONFIRM_BY_TOKEN: Start for token', token);

		const [existing] = await db
			.select()
			.from(schema.subscriber)
			.where(eq(schema.subscriber.token, token))
			.limit(1);

		console.log('CONFIRM_BY_TOKEN: Found existing record?', existing);

		if (!existing) {
			console.log('CONFIRM_BY_TOKEN: Record not found');
			return { record: null, isNew: false };
		}

		if (existing.status === 'active') {
			console.log('CONFIRM_BY_TOKEN: Status is already active');
			return { record: existing, isNew: false };
		}

		const now = new Date().toISOString();
		const [updated] = await db
			.update(schema.subscriber)
			.set({
				status: 'active',
				updatedAt: now
			})
			.where(eq(schema.subscriber.token, token))
			.returning();

		console.log('CONFIRM_BY_TOKEN: Status updated to active', updated);
		return { record: updated, isNew: true };
	}
}

export const subscriberService = new SubscriberService();
