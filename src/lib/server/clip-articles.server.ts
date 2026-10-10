import { db } from '../..';
import * as schema from '../../db/schema';
import type { ClipArticlePage } from '../../db/schema';
import { asc, eq, sql } from 'drizzle-orm';

export type ClipArticle = typeof schema.clipArticles.$inferSelect;

/**
 * Статические страницы, на которых крутится тот же опросник, но записи в
 * clip_articles у них нет — тексты лежат в коде. Слаг такой страницы всё равно
 * нужен: он уходит в quiz_results и в параметр `article` целей Метрики, поэтому
 * /api/quiz-results принимает его наравне с клип-статьями.
 */
export const STATIC_QUIZ_SLUGS = new Set(['focus-attention-quiz']);

// Существующие статические роуты под /useful — клип-статья с таким slug была бы
// молча недоступна (в SvelteKit статический роут приоритетнее динамического [slug])
const RESERVED_SLUGS = new Set([
	'focus-attention',
	'organized-burnout',
	'vacation-did-not-help',
	'burnout-questionnaire',
	'discuss-result',
	// Страницы из списка выше — тоже статические роуты, так что резервируются
	// автоматически: забыть продублировать слаг здесь больше невозможно
	...STATIC_QUIZ_SLUGS
]);

/** Slug — часть URL /useful/<slug>: латиница в нижнем регистре, цифры и дефисы. */
export function validateSlug(slug: string): string | null {
	if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
		return 'Slug: латиница в нижнем регистре, цифры и дефисы (например, burnout-story)';
	}
	if (RESERVED_SLUGS.has(slug)) {
		return 'Этот slug занят существующей страницей — выберите другой';
	}
	return null;
}

/** URL картинки экрана: путь из static (/lmc/1.webp) или внешний https-адрес. */
function isValidImageUrl(url: string): boolean {
	return url.startsWith('/') || /^https:\/\//.test(url);
}

/**
 * Разбирает pages из формы админки (JSON-строка). Возвращает массив страниц
 * или текст ошибки. Пустые страницы отбрасываются, лишние поля срезаются.
 */
export function parsePagesJson(raw: string): { pages: ClipArticlePage[] } | { error: string } {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { error: 'Некорректный формат страниц' };
	}
	if (!Array.isArray(parsed)) return { error: 'Некорректный формат страниц' };

	const pages: ClipArticlePage[] = [];
	for (const item of parsed) {
		if (item === null || typeof item !== 'object') return { error: 'Некорректный формат страниц' };
		const { heading, text, buttonText, imageUrl } = item as Record<string, unknown>;
		if (typeof text !== 'string') return { error: 'Некорректный формат страниц' };
		const imageTrimmed = typeof imageUrl === 'string' ? imageUrl.trim() : '';
		// Экран без текста, но с картинкой — валиден; совсем пустой — отбрасываем
		if (!text.trim() && !imageTrimmed) continue;
		if (imageTrimmed && !isValidImageUrl(imageTrimmed)) {
			return { error: 'URL картинки: путь из static (/lmc/1.webp) или адрес на https://' };
		}
		pages.push({
			text: text.trim(),
			...(typeof heading === 'string' && heading.trim() ? { heading: heading.trim() } : {}),
			...(typeof buttonText === 'string' && buttonText.trim()
				? { buttonText: buttonText.trim() }
				: {}),
			...(imageTrimmed ? { imageUrl: imageTrimmed } : {})
		});
	}
	return { pages };
}

export async function listClipArticles() {
	return db.select().from(schema.clipArticles).orderBy(asc(schema.clipArticles.createdAt));
}

export async function getClipArticle(id: number): Promise<ClipArticle | null> {
	const [article] = await db
		.select()
		.from(schema.clipArticles)
		.where(eq(schema.clipArticles.id, id));
	return article ?? null;
}

/** Статья для публичной страницы — только включённая. */
export async function getEnabledClipArticleBySlug(slug: string): Promise<ClipArticle | null> {
	const [article] = await db
		.select()
		.from(schema.clipArticles)
		.where(eq(schema.clipArticles.slug, slug));
	return article && article.enabled ? article : null;
}

export function isSlugCollision(err: unknown): boolean {
	return err instanceof Error && err.message.includes('clip_articles_slug_key');
}

export async function createClipArticle(data: { slug: string; title: string }) {
	const [article] = await db.insert(schema.clipArticles).values(data).returning();
	return article;
}

export async function updateClipArticle(
	id: number,
	data: Partial<Omit<ClipArticle, 'id' | 'createdAt' | 'updatedAt'>>
) {
	await db
		.update(schema.clipArticles)
		.set({ ...data, updatedAt: sql`now()` })
		.where(eq(schema.clipArticles.id, id));
}

export async function deleteClipArticle(id: number) {
	await db.delete(schema.clipArticles).where(eq(schema.clipArticles.id, id));
}
