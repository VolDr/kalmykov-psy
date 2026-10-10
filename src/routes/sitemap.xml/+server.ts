import { VITE_URL } from '$env/static/private';

const questionnaires = ['phq9', 'gad7', 'cpq', 'psi', 'ips', 'bat12', 'bat23', 'bat4'];

export async function GET() {
	const baseUrl = VITE_URL || 'https://kalmykov-psy.ru';

	// Use build time as last modified date for static pages
	// Update this date when you make significant changes to the site
	const lastBuildDate = new Date('2026-09-08').toISOString();

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>
	<url>
		<loc>${baseUrl}/questionnaires</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>
	${questionnaires
		.map(
			(questionnaire) => `
	<url>
		<loc>${baseUrl}/questionnaires/${questionnaire}</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>`
		)
		.join('')}
	<url>
		<loc>${baseUrl}/for-doctors</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>
	<url>
		<loc>${baseUrl}/online-therapy</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>
	<url>
		<loc>${baseUrl}/sos</loc>
		<lastmod>${lastBuildDate}</lastmod>
	</url>
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
