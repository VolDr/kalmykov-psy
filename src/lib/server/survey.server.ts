import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import type { SurveyConfig } from '$lib/data/surveys/types';

interface SurveyDto {
	title: string;
	slug: string;
	description?: string | null;
	categoryId?: string | null;
	config: SurveyConfig;
	isPublished?: boolean;
	sortOrder?: number;
}

interface SurveyCategoryDto {
	name: string;
	slug: string;
	description?: string | null;
	sortOrder?: number;
}

class SurveyService {
	async create(payload: SurveyDto) {
		const now = new Date().toISOString();

		const [survey] = await db
			.insert(schema.survey)
			.values({
				id: crypto.randomUUID(),
				title: payload.title,
				slug: payload.slug,
				description: payload.description,
				categoryId: payload.categoryId,
				config: payload.config,
				isPublished: payload.isPublished ?? false,
				sortOrder: payload.sortOrder ?? 0,
				disabled: false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return survey;
	}

	async update(id: string, payload: Partial<SurveyDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.title !== undefined) updateData.title = payload.title;
		if (payload.slug !== undefined) updateData.slug = payload.slug;
		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.categoryId !== undefined) updateData.categoryId = payload.categoryId;
		if (payload.config !== undefined) updateData.config = payload.config;
		if (payload.isPublished !== undefined) updateData.isPublished = payload.isPublished;
		if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;

		const [survey] = await db
			.update(schema.survey)
			.set(updateData)
			.where(eq(schema.survey.id, id))
			.returning();

		return survey;
	}

	async delete(id: string) {
		const [survey] = await db.delete(schema.survey).where(eq(schema.survey.id, id)).returning();

		return survey;
	}

	async get(id: string) {
		const [survey] = await db.select().from(schema.survey).where(eq(schema.survey.id, id)).limit(1);

		return survey;
	}

	async getBySlug(slug: string) {
		const [survey] = await db
			.select()
			.from(schema.survey)
			.where(eq(schema.survey.slug, slug))
			.limit(1);

		return survey;
	}

	async getAll() {
		const surveys = await db
			.select()
			.from(schema.survey)
			.where(eq(schema.survey.disabled, false))
			.orderBy(asc(schema.survey.sortOrder), desc(schema.survey.createdAt));

		return surveys;
	}

	async getAllWithCategories() {
		const surveys = await db
			.select({
				id: schema.survey.id,
				title: schema.survey.title,
				slug: schema.survey.slug,
				description: schema.survey.description,
				categoryId: schema.survey.categoryId,
				isPublished: schema.survey.isPublished,
				sortOrder: schema.survey.sortOrder,
				createdAt: schema.survey.createdAt,
				updatedAt: schema.survey.updatedAt,
				categoryName: schema.surveyCategory.name,
				categorySlug: schema.surveyCategory.slug
			})
			.from(schema.survey)
			.leftJoin(schema.surveyCategory, eq(schema.survey.categoryId, schema.surveyCategory.id))
			.where(eq(schema.survey.disabled, false))
			.orderBy(asc(schema.survey.sortOrder), desc(schema.survey.createdAt));

		return surveys;
	}

	async getPublished() {
		const surveys = await db
			.select()
			.from(schema.survey)
			.where(and(eq(schema.survey.disabled, false), eq(schema.survey.isPublished, true)))
			.orderBy(asc(schema.survey.sortOrder), desc(schema.survey.createdAt));

		return surveys;
	}
}

class SurveyCategoryService {
	async create(payload: SurveyCategoryDto) {
		const now = new Date().toISOString();

		const [category] = await db
			.insert(schema.surveyCategory)
			.values({
				id: crypto.randomUUID(),
				name: payload.name,
				slug: payload.slug,
				description: payload.description,
				sortOrder: payload.sortOrder ?? 0,
				disabled: false,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return category;
	}

	async update(id: string, payload: Partial<SurveyCategoryDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.name !== undefined) updateData.name = payload.name;
		if (payload.slug !== undefined) updateData.slug = payload.slug;
		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;

		const [category] = await db
			.update(schema.surveyCategory)
			.set(updateData)
			.where(eq(schema.surveyCategory.id, id))
			.returning();

		return category;
	}

	async delete(id: string) {
		const [category] = await db
			.delete(schema.surveyCategory)
			.where(eq(schema.surveyCategory.id, id))
			.returning();

		return category;
	}

	async get(id: string) {
		const [category] = await db
			.select()
			.from(schema.surveyCategory)
			.where(eq(schema.surveyCategory.id, id))
			.limit(1);

		return category;
	}

	async getAll() {
		const categories = await db
			.select()
			.from(schema.surveyCategory)
			.where(eq(schema.surveyCategory.disabled, false))
			.orderBy(asc(schema.surveyCategory.sortOrder), asc(schema.surveyCategory.name));

		return categories;
	}
}

export const surveyService = new SurveyService();
export const surveyCategoryService = new SurveyCategoryService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

export function serializeSurvey(survey: any) {
	if (!survey) {
		return null;
	}

	return {
		...survey,
		createdAt: serializeDate(survey.createdAt),
		updatedAt: serializeDate(survey.updatedAt),
		description: survey.description ?? null,
		categoryId: survey.categoryId ?? null
	};
}

export function serializeSurveyCategory(category: any) {
	if (!category) {
		return null;
	}

	return {
		...category,
		createdAt: serializeDate(category.createdAt),
		updatedAt: serializeDate(category.updatedAt),
		description: category.description ?? null
	};
}
