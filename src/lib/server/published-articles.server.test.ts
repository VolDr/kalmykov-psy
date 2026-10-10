import { describe, expect, it } from 'vitest';

import { publishedArticleService } from './published-articles.server';

describe('publishedArticleService', () => {
	it('publishes exactly the twelve reviewed articles', async () => {
		const articles = await publishedArticleService.getAll();

		expect(articles).toHaveLength(12);
		expect(new Set(articles.map(({ id }) => id)).size).toBe(12);
		expect(new Set(articles.map(({ uri }) => uri)).size).toBe(12);
		for (const { uri } of articles) {
			expect((await publishedArticleService.getByUri(uri))?.content.markdown).toContain('## ');
		}
	});

	it.each(['choice', 'procrastination', 'burnout', 'crisis'])(
		'does not publish the old /articles/%s address',
		async (uri) => {
			expect(await publishedArticleService.getByUri(uri)).toBeUndefined();
		}
	);

	it('keeps the reviewed slug and metadata for the lead article', async () => {
		const article = await publishedArticleService.getByUri('vygoranie-priznaki-i-vosstanovlenie');

		expect(article?.id).toBe('A01');
		expect(article?.title).toBe('Выгорание: признаки, стадии и как восстановиться');
		expect(article?.descriptionMeta.length).toBeGreaterThanOrEqual(120);
		expect(article?.descriptionMeta.length).toBeLessThanOrEqual(160);
	});

	it('provides contextual internal links without linking an article to itself', async () => {
		const articles = await publishedArticleService.getAll();

		for (const article of articles) {
			const related = await publishedArticleService.getRelated(article.uri);
			expect(related.length).toBeGreaterThanOrEqual(2);
			expect(related.some(({ uri }) => uri === article.uri)).toBe(false);
		}
	});

	it('keeps search titles concise and semantically aligned with article titles', async () => {
		const articles = await publishedArticleService.getAll();

		for (const article of articles) {
			expect(article.seoTitle.length).toBeLessThanOrEqual(56);
			expect(article.title.toLowerCase()).toContain(
				article.seoTitle.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
			);
		}
	});
});
