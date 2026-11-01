import { parseTranslationChanges } from '#lib/data/translation.js';
import { getDocByToken, saveChanges } from '#lib/server/translations.server.js';
import type { RequestHandler } from './$types';

const noStore = { 'Cache-Control': 'no-store' };

// Тело читаем как текст: при закрытии вкладки клиент шлёт keepalive-запрос.
export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const doc = await getDocByToken(params.token);
	if (!doc)
		return Response.json({ ok: false, error: 'Не найдено' }, { status: 404, headers: noStore });

	let raw: unknown;
	try {
		raw = JSON.parse(await request.text());
	} catch {
		return Response.json(
			{ ok: false, error: 'Некорректный запрос' },
			{ status: 400, headers: noStore }
		);
	}

	const parsed = parseTranslationChanges(raw, new Set(doc.items.map((item) => item.key)));
	if (!parsed.ok) return Response.json(parsed, { status: 400, headers: noStore });

	const results = await saveChanges(doc.id, parsed.changes, {
		ip: getClientAddress(),
		userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null
	});
	const conflict = results.some((result) => result.status === 'conflict');
	return Response.json(
		{ ok: !conflict, results },
		{ status: conflict ? 409 : 200, headers: noStore }
	);
};
