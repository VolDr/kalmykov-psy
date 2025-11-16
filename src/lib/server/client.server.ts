import { db } from '../..';
import * as schema from '../../db/schema';
import { sourceService } from './source.server';
import { eq } from 'drizzle-orm';

interface ClientDto {
	source: string;
	name: string;
	phone: string;
	nick: string;
	gender?: string;
	invocation?: string;
}

class ClientService {
	async create(payload: ClientDto) {
		const source = await sourceService.getOrCreate(payload.source);
		const now = new Date().toISOString();

		const [client] = await db
			.insert(schema.client)
			.values({
				id: crypto.randomUUID(),
				name: payload.name,
				sourceId: source.id,
				nick: payload.nick,
				gender: payload.gender,
				invocation: payload.invocation,
				createdAt: now,
				updatedAt: now,
				disabled: false
			})
			.returning();

		return client;
	}

	async hasByName(name: string) {
		const result = await db
			.select()
			.from(schema.client)
			.where(eq(schema.client.name, name))
			.limit(1);

		return result.length > 0;
	}

	async getByUuid(id: string, include?: { source?: boolean; activities?: boolean }) {
		const clientQuery = db.select().from(schema.client).where(eq(schema.client.id, id));

		const [client] = await clientQuery.limit(1);

		if (!client) {
			return null;
		}

		let result: any = { ...client };

		if (include?.source) {
			const [sourceData] = await db
				.select()
				.from(schema.source)
				.where(eq(schema.source.id, client.sourceId))
				.limit(1);
			result.source = sourceData;
		}

		if (include?.activities) {
			const activities = await db
				.select()
				.from(schema.activity)
				.where(eq(schema.activity.clientId, client.id));
			result.activities = activities;
		}

		return result;
	}

	async getAll() {
		const clients = await db.select().from(schema.client);

		const clientsWithActivities = await Promise.all(
			clients.map(async (client) => {
				const activities = await db
					.select()
					.from(schema.activity)
					.where(eq(schema.activity.clientId, client.id));
				return {
					...client,
					activities
				};
			})
		);

		return clientsWithActivities;
	}

	async update(id: string, data: Partial<ClientDto>) {
		const now = new Date().toISOString();

		const [updatedClient] = await db
			.update(schema.client)
			.set({
				gender: data.gender,
				invocation: data.invocation,
				updatedAt: now
			})
			.where(eq(schema.client.id, id))
			.returning();

		return updatedClient;
	}

	async updateProfile(
		id: string,
		data: {
			name?: string;
			nick?: string;
			source?: string;
			gender?: string;
			invocation?: string;
			description?: string;
		}
	) {
		const source = data.source ? await sourceService.getOrCreate(data.source) : undefined;
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.nick !== undefined) updateData.nick = data.nick || null;
		if (source) updateData.sourceId = source.id;
		if (data.gender !== undefined) updateData.gender = data.gender;
		if (data.invocation !== undefined) updateData.invocation = data.invocation;
		if (data.description !== undefined) updateData.description = data.description || null;

		const [updatedClient] = await db
			.update(schema.client)
			.set(updateData)
			.where(eq(schema.client.id, id))
			.returning();

		return updatedClient;
	}
}

export const clientService = new ClientService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

function serializeBigInt(value: bigint | number | null | undefined): string | undefined {
	if (value === null || value === undefined) return undefined;
	return value.toString();
}

export function serializeClient(client: Awaited<ReturnType<(typeof clientService)['getByUuid']>>) {
	if (!client) {
		return undefined;
	}

	return {
		...client,
		createdAt: serializeDate(client.createdAt),
		updatedAt: serializeDate(client.updatedAt),
		description: client.description ?? undefined,
		nick: client.nick ?? undefined,
		sourceId: serializeBigInt(client.sourceId),
		invocation: client.invocation ?? undefined,
		gender: client.gender ?? undefined,
		source: client.source
			? {
					...client.source,
					id: serializeBigInt(client.source.id),
					createdAt: serializeDate(client.source.createdAt),
					updatedAt: serializeDate(client.source.updatedAt)
				}
			: undefined,
		activities: client.activities
			? client.activities.map((activity: typeof schema.activity.$inferSelect) => ({
					...activity,
					createdAt: serializeDate(activity.createdAt),
					updatedAt: serializeDate(activity.updatedAt),
					scheduledDate: serializeDate(activity.scheduledDate),
					scheduledDay: serializeDate(activity.scheduledDay)
				}))
			: undefined
	};
}
