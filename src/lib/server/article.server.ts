import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface ArticleDto {
	title: string;
	description?: string | null;
	uri: string;
	content: string;
	imageUrl?: string | null;
	descriptionMeta?: string | null;
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
		if (payload.descriptionMeta !== undefined) updateData.descriptionMeta = payload.descriptionMeta;

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
				viewCount: schema.article.viewCount
			})
			.from(schema.article)
			.orderBy(desc(schema.article.createdAt));

		return articles;
	}
}

export const articleService = new ArticleService();

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
		descriptionMeta: article.descriptionMeta ?? null
	};
}
