import { articleService } from '$lib/server/article.server';
import { VITE_URL } from '$env/static/private';

const surveys = ['phq9', 'gad7', 'cpq', 'psi', 'ips', 'bat12', 'bat23', 'bat4'];

export async function GET() {
	const articles = await articleService.getAll();
	const baseUrl = VITE_URL || 'https://kalmykov-psy.ru';

	// Use build time as last modified date for static pages
	// Update this date when you make significant changes to the site
	const lastBuildDate = new Date('2025-11-19').toISOString();

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${baseUrl}/articles</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>daily</changefreq>
		<priority>0.9</priority>
	</url>
	${articles
		.map(
			(article) => `
	<url>
		<loc>${baseUrl}/articles/${article.uri}</loc>
		<lastmod>${new Date(article.createdAt).toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>`
		)
		.join('')}
	<url>
		<loc>${baseUrl}/surveys</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>
	${surveys
		.map(
			(survey) => `
	<url>
		<loc>${baseUrl}/surveys/${survey}</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.7</priority>
	</url>`
		)
		.join('')}
	<url>
		<loc>${baseUrl}/for-doctors</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.7</priority>
	</url>
	<url>
		<loc>${baseUrl}/online-therapy</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.7</priority>
	</url>
	<url>
		<loc>${baseUrl}/sos</loc>
		<lastmod>${lastBuildDate}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.6</priority>
	</url>
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
