import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

class SubscriberService {
	async upsertPending(email: string) {
		const token = crypto.randomUUID();
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		const existing = await db
			.select()
			.from(schema.subscriber)
			.where(eq(schema.subscriber.email, email))
			.limit(1);

		if (existing.length > 0) {
			const [updated] = await db
				.update(schema.subscriber)
				.set({
					status: 'pending',
					token: token,
					updatedAt: now
				})
				.where(eq(schema.subscriber.email, email))
				.returning();

			return updated;
		}

		const [record] = await db
			.insert(schema.subscriber)
			.values({ id, email, status: 'pending', token })
			.returning();

		return record;
	}

	async confirmByToken(token: string) {
		const [existing] = await db
			.select()
			.from(schema.subscriber)
			.where(eq(schema.subscriber.token, token))
			.limit(1);

		if (!existing) {
			return { record: null, isNew: false };
		}

		if (existing.status === 'active') {
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

		return { record: updated, isNew: true };
	}
}

export const subscriberService = new SubscriberService();
