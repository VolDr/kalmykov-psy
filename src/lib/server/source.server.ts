import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

class SourceService {
	async getOrCreate(payload: string) {
		let source = (
			await db.select().from(schema.source).where(eq(schema.source.name, payload)).limit(1)
		)[0];
		if (!source) {
			const now = new Date().toISOString();
			source = (
				await db
					.insert(schema.source)
					.values({ name: payload, updatedAt: now, createdAt: now })
					.returning()
			)[0];
		}
		return source;
	}

	async getAll() {
		return await db.select().from(schema.source);
	}
}

export const sourceService = new SourceService();
