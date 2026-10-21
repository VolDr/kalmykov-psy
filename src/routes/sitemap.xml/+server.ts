import { VITE_URL } from '$env/static/private';

const questionnaires = ['phq9', 'gad7', 'cpq', 'psi', 'ips', 'gps9', 'impostor', 'ipss3', 'bat12', 'bat23', 'bat4'];

export async function GET() {
	const baseUrl = (VITE_URL || 'https://kalmykov-psy.ru').replace(/\/+$/, '');

	// Modification dates are omitted until reliable per-page timestamps are available.

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/</loc>
	</url>
	<url>
		<loc>${baseUrl}/questionnaires</loc>
	</url>
	${questionnaires
		.map(
			(questionnaire) => `
	<url>
		<loc>${baseUrl}/questionnaires/${questionnaire}</loc>
	</url>`
		)
		.join('')}
	<url>
		<loc>${baseUrl}/info</loc>
	</url>
	<url>
		<loc>${baseUrl}/articles</loc>
	</url>
	<url>
		<loc>${baseUrl}/for-doctors</loc>
	</url>
	<url>
		<loc>${baseUrl}/online-therapy</loc>
	</url>
	<url>
		<loc>${baseUrl}/sos</loc>
	</url>
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
