import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { serializeClient } from './client.server';

interface FeedbackDto {
	disabled?: boolean;
	attitude: number;
	goals: number;
	method: number;
	generally: number;
	editable?: boolean;
	clientId: string;
	smallId: string;
	datetime: Date | string;
}

class FeedbackService {
	async create(payload: FeedbackDto) {
		const now = new Date().toISOString();

		const [feedback] = await db
			.insert(schema.feedback)
			.values({
				id: crypto.randomUUID(),
				smallId: payload.smallId,
				attitude: payload.attitude,
				goals: payload.goals,
				method: payload.method,
				generally: payload.generally,
				clientId: payload.clientId,
				datetime: typeof payload.datetime === 'string' ? payload.datetime : payload.datetime.toISOString(),
				disabled: payload.disabled ?? false,
				editable: payload.editable ?? true,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return feedback;
	}

	async update(id: string, payload: Partial<FeedbackDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.attitude !== undefined) updateData.attitude = payload.attitude;
		if (payload.goals !== undefined) updateData.goals = payload.goals;
		if (payload.method !== undefined) updateData.method = payload.method;
		if (payload.generally !== undefined) updateData.generally = payload.generally;
		if (payload.editable !== undefined) updateData.editable = payload.editable;
		if (payload.disabled !== undefined) updateData.disabled = payload.disabled;
		if (payload.datetime !== undefined) {
			updateData.datetime = typeof payload.datetime === 'string' ? payload.datetime : payload.datetime.toISOString();
		}

		const [feedback] = await db
			.update(schema.feedback)
			.set(updateData)
			.where(eq(schema.feedback.smallId, id))
			.returning();

		return feedback;
	}

	async updateByClientIdAndDate(
		clientId: string,
		datetime: Date | string,
		payload: Partial<FeedbackDto>
	) {
		const datetimeStr = typeof datetime === 'string' ? datetime : datetime.toISOString();

		const [feedback] = await db
			.select()
			.from(schema.feedback)
			.where(eq(schema.feedback.clientId, clientId))
			.limit(1);

		if (!feedback) {
			throw new Error(`Can't find feedback`);
		}

		return this.update(feedback.smallId, payload);
	}

	async get(id: string, include: { client?: boolean }) {
		const [feedback] = await db
			.select()
			.from(schema.feedback)
			.where(eq(schema.feedback.smallId, id))
			.limit(1);

		if (!feedback) {
			return null;
		}

		const result: any = { ...feedback };

		if (include?.client) {
			const [client] = await db
				.select()
				.from(schema.client)
				.where(eq(schema.client.id, feedback.clientId))
				.limit(1);
			result.client = client;
		}

		return result;
	}

	async getAllByClient(id: string, include: { client?: boolean }) {
		const feedbacks = await db
			.select()
			.from(schema.feedback)
			.where(eq(schema.feedback.clientId, id));

		if (!include?.client) {
			return feedbacks;
		}

		const feedbacksWithClient = await Promise.all(
			feedbacks.map(async (feedback) => {
				const [client] = await db
					.select()
					.from(schema.client)
					.where(eq(schema.client.id, feedback.clientId))
					.limit(1);
				return {
					...feedback,
					client
				};
			})
		);

		return feedbacksWithClient;
	}

	async getAll(include: { client?: boolean }) {
		const feedbacks = await db
			.select()
			.from(schema.feedback)
			.orderBy(asc(schema.feedback.datetime));

		if (!include?.client) {
			return feedbacks;
		}

		const feedbacksWithClient = await Promise.all(
			feedbacks.map(async (feedback) => {
				const [client] = await db
					.select()
					.from(schema.client)
					.where(eq(schema.client.id, feedback.clientId))
					.limit(1);
				return {
					...feedback,
					client
				};
			})
		);

		return feedbacksWithClient;
	}
}

export const feedbackService = new FeedbackService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

export function serializeFeedback(
	feedback: Awaited<ReturnType<(typeof feedbackService)['get']>>
) {
	if (!feedback) {
		return undefined;
	}

	return {
		...feedback,
		createdAt: serializeDate(feedback.createdAt),
		updatedAt: serializeDate(feedback.updatedAt),
		datetime: serializeDate(feedback.datetime),
		client: serializeClient(feedback.client)
	};
}
