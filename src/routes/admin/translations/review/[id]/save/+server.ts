import { error } from '@sveltejs/kit';
import { requireAuth } from '#lib/server/protected.js';
import { getReconciliationSaveTarget } from '#lib/server/translation-reconciliation.server.js';
import { saveChanges } from '#lib/server/translations.server.js';
import { parseTranslationChanges } from '#lib/data/translation.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireAuth(event);
	const id = Number(event.params.id);
	const sourceId = Number(event.url.searchParams.get('sourceId'));
	if (!Number.isSafeInteger(id) || !Number.isSafeInteger(sourceId))
		error(404, 'Согласование не найдено');
	const review = await getReconciliationSaveTarget(sourceId, id);
	if (!review) error(404, 'Согласование не найдено');
	const bytes = await event.request.arrayBuffer();
	if (bytes.byteLength > 131_072)
		return Response.json({ ok: false, error: 'Запрос слишком большой' }, { status: 413 });
	let raw: unknown;
	try {
		raw = JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return Response.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
	}
	const parsed = parseTranslationChanges(raw, new Set(review.items.map((item) => item.key)));
	if (!parsed.ok) return Response.json(parsed, { status: 400 });
	const results = await saveChanges(review.finalDocId, parsed.changes, {
		ip: event.getClientAddress(),
		userAgent: event.request.headers.get('user-agent')?.slice(0, 300) ?? null
	});
	const conflict = results.some((result) => result.status === 'conflict');
	return Response.json(
		{ ok: !conflict, results },
		{ status: conflict ? 409 : 200, headers: { 'Cache-Control': 'no-store' } }
	);
};
