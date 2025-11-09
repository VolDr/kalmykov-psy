import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { serializeClient } from './client.server';

interface CurrentStateDto {
	disabled?: boolean;
	individual: number;
	family: number;
	social: number;
	generally: number;
	editable?: boolean;
	clientId: string;
	smallId: string;
	datetime: Date | string;
}

class CurrentStateService {
	async create(payload: CurrentStateDto) {
		const now = new Date().toISOString();

		const [currentState] = await db
			.insert(schema.currentState)
			.values({
				id: crypto.randomUUID(),
				smallId: payload.smallId,
				individual: payload.individual,
				family: payload.family,
				social: payload.social,
				generally: payload.generally,
				clientId: payload.clientId,
				datetime: typeof payload.datetime === 'string' ? payload.datetime : payload.datetime.toISOString(),
				disabled: payload.disabled ?? false,
				editable: payload.editable ?? true,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return currentState;
	}

	async update(id: string, payload: Partial<CurrentStateDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.individual !== undefined) updateData.individual = payload.individual;
		if (payload.family !== undefined) updateData.family = payload.family;
		if (payload.social !== undefined) updateData.social = payload.social;
		if (payload.generally !== undefined) updateData.generally = payload.generally;
		if (payload.editable !== undefined) updateData.editable = payload.editable;
		if (payload.disabled !== undefined) updateData.disabled = payload.disabled;
		if (payload.datetime !== undefined) {
			updateData.datetime = typeof payload.datetime === 'string' ? payload.datetime : payload.datetime.toISOString();
		}

		const [currentState] = await db
			.update(schema.currentState)
			.set(updateData)
			.where(eq(schema.currentState.smallId, id))
			.returning();

		return currentState;
	}

	async updateByClientIdAndDate(
		clientId: string,
		datetime: Date | string,
		payload: Partial<CurrentStateDto>
	) {
		const datetimeStr = typeof datetime === 'string' ? datetime : datetime.toISOString();

		const [currentState] = await db
			.select()
			.from(schema.currentState)
			.where(eq(schema.currentState.clientId, clientId))
			.limit(1);

		if (!currentState) {
			throw new Error(`Can't find currentState`);
		}

		return this.update(currentState.smallId, payload);
	}

	async get(id: string, include: { client?: boolean }) {
		const [currentState] = await db
			.select()
			.from(schema.currentState)
			.where(eq(schema.currentState.smallId, id))
			.limit(1);

		if (!currentState) {
			return null;
		}

		const result: any = { ...currentState };

		if (include?.client) {
			const [client] = await db
				.select()
				.from(schema.client)
				.where(eq(schema.client.id, currentState.clientId))
				.limit(1);
			result.client = client;
		}

		return result;
	}

	async getAllByClient(id: string, include: { client?: boolean }) {
		const currentStates = await db
			.select()
			.from(schema.currentState)
			.where(eq(schema.currentState.clientId, id));

		if (!include?.client) {
			return currentStates;
		}

		const currentStatesWithClient = await Promise.all(
			currentStates.map(async (currentState) => {
				const [client] = await db
					.select()
					.from(schema.client)
					.where(eq(schema.client.id, currentState.clientId))
					.limit(1);
				return {
					...currentState,
					client
				};
			})
		);

		return currentStatesWithClient;
	}
}

export const currentStateService = new CurrentStateService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

export function serializeCurrentState(
	currentState: Awaited<ReturnType<(typeof currentStateService)['get']>>
) {
	if (!currentState) {
		return undefined;
	}

	return {
		...currentState,
		createdAt: serializeDate(currentState.createdAt),
		updatedAt: serializeDate(currentState.updatedAt),
		datetime: serializeDate(currentState.datetime),
		client: serializeClient(currentState.client)
	};
}
