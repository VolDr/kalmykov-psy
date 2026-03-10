import dayjs from 'dayjs';
import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { serializeClient } from './client.server';

interface ActivityDto {
	disabled?: boolean;
	scheduledDate: Date | string;
	description?: string | null;
	rejectReason?: string | null;
	status: string;
	income?: number | string | null;
	clientId: string;
	gender?: string | null;
	invocation?: string | null;
}

class ActivityService {
	async create(payload: ActivityDto) {
		const now = new Date().toISOString();

		const [activity] = await db
			.insert(schema.activity)
			.values({
				id: crypto.randomUUID(),
				scheduledDate: new Date(payload.scheduledDate).toISOString(),
				scheduledDay: dayjs(payload.scheduledDate).startOf('day').toDate().toISOString(),
				description: payload.description,
				rejectReason: payload.rejectReason,
				status: payload.status,
				income: payload.income?.toString(),
				clientId: payload.clientId,
				disabled: payload.disabled ?? false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return activity;
	}

	async update(id: string, payload: Partial<ActivityDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.scheduledDate !== undefined) {
			updateData.scheduledDate = new Date(payload.scheduledDate).toISOString();
			updateData.scheduledDay = dayjs(payload.scheduledDate).startOf('day').toDate().toISOString();
		}

		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.rejectReason !== undefined) updateData.rejectReason = payload.rejectReason;
		if (payload.status !== undefined) updateData.status = payload.status;
		if (payload.income !== undefined) updateData.income = payload.income?.toString();
		if (payload.disabled !== undefined) updateData.disabled = payload.disabled;

		const [activity] = await db
			.update(schema.activity)
			.set(updateData)
			.where(eq(schema.activity.id, id))
			.returning();

		return activity;
	}

	async delete(id: string) {
		const [activity] = await db
			.delete(schema.activity)
			.where(eq(schema.activity.id, id))
			.returning();

		return activity;
	}

	async get(id: string, include: { client?: boolean }) {
		const [activity] = await db
			.select()
			.from(schema.activity)
			.where(eq(schema.activity.id, id))
			.limit(1);

		if (!activity) {
			return null;
		}

		const result: any = { ...activity };

		if (include?.client) {
			const [client] = await db
				.select()
				.from(schema.client)
				.where(eq(schema.client.id, activity.clientId))
				.limit(1);
			result.client = client;
		}

		return result;
	}

	async getAll(include: { client?: boolean; clientId?: number }) {
		let query = db.select().from(schema.activity);

		if (include?.clientId) {
			query = query.where(eq(schema.activity.clientId, include.clientId.toString())) as any;
		}

		const order = include?.clientId ? desc : asc;
		const activities = await query.orderBy(order(schema.activity.scheduledDate));

		if (!include?.client) {
			return activities;
		}

		const activitiesWithClient = await Promise.all(
			activities.map(async (activity) => {
				const [client] = await db
					.select()
					.from(schema.client)
					.where(eq(schema.client.id, activity.clientId))
					.limit(1);
				return {
					...activity,
					client
				};
			})
		);

		return activitiesWithClient;
	}

	async groupByDate() {
		const result = await db
			.select({
				scheduledDay: schema.activity.scheduledDay,
				_count: sql<number>`count(*)::int`
			})
			.from(schema.activity)
			.groupBy(schema.activity.scheduledDay)
			.orderBy(asc(schema.activity.scheduledDay));

		return result;
	}
}

export const activityService = new ActivityService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

function serializeDecimal(value: string | number | null | undefined): string | undefined {
	if (value === null || value === undefined) return undefined;
	return value.toString();
}

export function serializeActivity(activity: Awaited<ReturnType<(typeof activityService)['get']>>) {
	if (!activity) {
		return undefined;
	}

	return {
		...activity,
		createdAt: serializeDate(activity.createdAt),
		updatedAt: serializeDate(activity.updatedAt),
		client: serializeClient(activity.client),
		scheduledDate: serializeDate(activity.scheduledDate),
		scheduledDay: serializeDate(activity.scheduledDay),
		income: serializeDecimal(activity.income),
		description: activity.description ?? undefined,
		rejectReason: activity.rejectReason ?? undefined
	};
}
