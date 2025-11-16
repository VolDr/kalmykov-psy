import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, desc, sql, asc, isNull } from 'drizzle-orm';

interface ArticleDto {
	title: string;
	description?: string | null;
	uri: string;
	content: string;
	imageUrl?: string | null;
	descriptionMeta?: string | null;
	categoryId?: string | null;
}

interface ArticleCategoryDto {
	name: string;
	slug: string;
	description?: string | null;
	sortOrder?: number;
}

class ArticleService {
	async create(payload: ArticleDto) {
		const now = new Date().toISOString();

		const [article] = await db
			.insert(schema.article)
			.values({
				id: crypto.randomUUID(),
				title: payload.title,
				description: payload.description,
				uri: payload.uri,
				content: { markdown: payload.content },
				imageUrl: payload.imageUrl,
				descriptionMeta: payload.descriptionMeta,
				categoryId: payload.categoryId,
				viewCount: 0,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return article;
	}

	async update(id: string, payload: Partial<ArticleDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.title !== undefined) updateData.title = payload.title;
		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.uri !== undefined) updateData.uri = payload.uri;
		if (payload.content !== undefined) updateData.content = { markdown: payload.content };
		if (payload.imageUrl !== undefined) updateData.imageUrl = payload.imageUrl;
		if (payload.descriptionMeta !== undefined)
			updateData.descriptionMeta = payload.descriptionMeta;
		if (payload.categoryId !== undefined) updateData.categoryId = payload.categoryId;

		const [article] = await db
			.update(schema.article)
			.set(updateData)
			.where(eq(schema.article.id, id))
			.returning();

		return article;
	}

	async delete(id: string) {
		const [article] = await db
			.delete(schema.article)
			.where(eq(schema.article.id, id))
			.returning();

		return article;
	}

	async get(id: string) {
		const [article] = await db
			.select()
			.from(schema.article)
			.where(eq(schema.article.id, id))
			.limit(1);

		return article;
	}

	async getByUri(uri: string) {
		const [article] = await db
			.select()
			.from(schema.article)
			.where(eq(schema.article.uri, uri))
			.limit(1);

		return article;
	}

	async incrementViewCount(id: string) {
		const [article] = await db
			.update(schema.article)
			.set({
				viewCount: sql`${schema.article.viewCount} + 1`
			})
			.where(eq(schema.article.id, id))
			.returning();

		return article;
	}

	async getAll() {
		const articles = await db
			.select({
				id: schema.article.id,
				title: schema.article.title,
				description: schema.article.description,
				uri: schema.article.uri,
				createdAt: schema.article.createdAt,
				viewCount: schema.article.viewCount,
				categoryId: schema.article.categoryId
			})
			.from(schema.article)
			.orderBy(desc(schema.article.createdAt));

		return articles;
	}

	async getAllWithCategories() {
		const articles = await db
			.select({
				id: schema.article.id,
				title: schema.article.title,
				description: schema.article.description,
				uri: schema.article.uri,
				createdAt: schema.article.createdAt,
				viewCount: schema.article.viewCount,
				categoryId: schema.article.categoryId,
				categoryName: schema.articleCategory.name,
				categorySlug: schema.articleCategory.slug
			})
			.from(schema.article)
			.leftJoin(schema.articleCategory, eq(schema.article.categoryId, schema.articleCategory.id))
			.orderBy(desc(schema.article.createdAt));

		return articles;
	}
}

class ArticleCategoryService {
	async create(payload: ArticleCategoryDto) {
		const now = new Date().toISOString();

		const [category] = await db
			.insert(schema.articleCategory)
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

	async update(id: string, payload: Partial<ArticleCategoryDto>) {
		const now = new Date().toISOString();

		const updateData: any = {
			updatedAt: now
		};

		if (payload.name !== undefined) updateData.name = payload.name;
		if (payload.slug !== undefined) updateData.slug = payload.slug;
		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;

		const [category] = await db
			.update(schema.articleCategory)
			.set(updateData)
			.where(eq(schema.articleCategory.id, id))
			.returning();

		return category;
	}

	async delete(id: string) {
		const [category] = await db
			.delete(schema.articleCategory)
			.where(eq(schema.articleCategory.id, id))
			.returning();

		return category;
	}

	async get(id: string) {
		const [category] = await db
			.select()
			.from(schema.articleCategory)
			.where(eq(schema.articleCategory.id, id))
			.limit(1);

		return category;
	}

	async getAll() {
		const categories = await db
			.select()
			.from(schema.articleCategory)
			.where(eq(schema.articleCategory.disabled, false))
			.orderBy(asc(schema.articleCategory.sortOrder), asc(schema.articleCategory.name));

		return categories;
	}
}

export const articleService = new ArticleService();
export const articleCategoryService = new ArticleCategoryService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

export function serializeArticle(article: any) {
	if (!article) {
		return null;
	}

	return {
		...article,
		createdAt: serializeDate(article.createdAt),
		updatedAt: serializeDate(article.updatedAt),
		description: article.description ?? null,
		imageUrl: article.imageUrl ?? null,
		descriptionMeta: article.descriptionMeta ?? null,
		categoryId: article.categoryId ?? null
	};
}

export function serializeArticleCategory(category: any) {
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
