import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import {
	emptyTranslationEntry,
	type TranslationChange,
	type TranslationItem
} from '../data/translation';

const mockDb = vi.hoisted(() => ({
	select: vi.fn(),
	insert: vi.fn(),
	transaction: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}));
vi.mock('../../index', () => ({ db: mockDb }));
import {
	createReconciliation,
	getAdminReconciliation,
	getReviewerReconciliation,
	regenerateReviewerToken,
	updateReviewerProfile,
	validateReviewerProfile
} from './translation-reconciliation.server';
import { getEntries, getDocByToken, listDocs, saveChanges } from './translations.server';
import { POST as publicSave } from '../../routes/translate/[token]/save/+server';
import { load as publicLoad } from '../../routes/translate/[token]/+page.server';
import { GET as reviewState } from '../../routes/translate/[token]/state/+server';
import { GET as reviewAvatar } from '../../routes/translate/[token]/avatar/[slot]/+server';
import { POST as finalSave } from '../../routes/admin/translations/review/[id]/save/+server';
import { actions } from '../../routes/admin/translations/+page.server';
import { POST as commentPost } from '../../routes/translate/[token]/comments/+server';
import { createBackTranslation, getBackTranslation, regenerateBackTranslationToken } from './translation-back.server';
import {
	createExpertLink,
	createExpertRepeatLink,
	deleteExpertLink,
	createExpertAdminLink,
	listExperts,
	regenerateExpertToken,
	renameExpert
} from './translation-expert.server';
import { buildExpertItems, expertAnswer, expertResultRows, summarizeExpertItem } from '../data/translation-expert';

const pg = new PGlite();
let sourceId: number;
let sourceToken: string;
let items: TranslationItem[];
const markdown = readFileSync('src/lib/data/translation-second.md', 'utf8');
const meta = { ip: '192.0.2.1', userAgent: 'test' };
const change = (
	value: string,
	expectedVersion = 0,
	field: 'translation' | 'comment' = 'translation'
): TranslationChange => ({
	key: '1',
	field,
	value,
	expectedVersion,
	operationId: crypto.randomUUID()
});
const publicEvent = (token: string, changes: unknown[] = []) => ({
	params: { token },
	getClientAddress: () => meta.ip,
	request: new Request(`https://example.test/translate/${token}/save`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ changes })
	}),
	setHeaders: vi.fn()
});

beforeAll(async () => {
	for (const file of [
		'0024_translation_docs.sql',
		'0025_translation_save_versions.sql',
		'0026_translation_reconciliation.sql',
		'0027_translation_review_comments.sql',
		'0028_translation_back_translation.sql',
		'0029_translation_expert_reviews.sql',
		'0030_translation_expert_discussion.sql'
	])
		await pg.exec(readFileSync('drizzle/' + file, 'utf8'));
	const actual = drizzle(pg);
	mockDb.select.mockImplementation(actual.select.bind(actual));
	mockDb.insert.mockImplementation(actual.insert.bind(actual));
	mockDb.transaction.mockImplementation(actual.transaction.bind(actual));
	mockDb.update.mockImplementation(actual.update.bind(actual));
	mockDb.delete.mockImplementation(actual.delete.bind(actual));
	const source = (
		await pg.query<{ id: string; token: string; items: TranslationItem[] }>(
			"SELECT id, token, items FROM translation_docs WHERE kind='translation'"
		)
	).rows[0];
	sourceId = Number(source.id);
	sourceToken = source.token;
	items = source.items;
}, 30_000);
beforeEach(async () => {
	await pg.exec(
		'TRUNCATE translation_entries, translation_events, translation_operations, translation_review_comments, translation_reviewers, translation_back_translations, translation_expert_comments, translation_experts, translation_reconciliations'
	);
	await pg.exec("DELETE FROM translation_docs WHERE kind <> 'translation'");
	for (const item of items)
		await pg.query(
			'INSERT INTO translation_entries (doc_id,item_key,translation) VALUES ($1,$2,$3)',
			[sourceId, item.key, `First: ${item.key}`]
		);
});
afterAll(async () => {
	await pg.close();
});

async function round() {
	const id = await createReconciliation(sourceId, markdown, 'Test reconciliation');
	return (await getAdminReconciliation(sourceId, id))!;
}

describe('independent translation reconciliation', () => {
	it('creates two distinct secret links and freezes both variants without changing the source', async () => {
		const review = await round();
		expect(review.participants).toHaveLength(2);
		expect(new Set([sourceToken, ...review.participants.map((p) => p.token)]).size).toBe(3);
		expect(review.participants.every((p) => /^[a-f0-9]{32}$/.test(p.token))).toBe(true);
		expect(review.variantA['1']).toBe('First: 1');
		expect(review.variantB['1']).toContain('Я обычно не берусь');
		await saveChanges(sourceId, [change('changed source')], meta);
		expect((await getAdminReconciliation(sourceId, review.id))?.variantA['1']).toBe('First: 1');
		expect(await listDocs()).toHaveLength(1);
	});
	it('stores a choice and comment per person with the existing versions and retry receipts', async () => {
		const review = await round();
		const a = review.participants[0],
			b = review.participants[1];
		const original = change('a');
		await saveChanges(a.docId, [original, change('comment A', 0, 'comment')], meta);
		await saveChanges(b.docId, [change('b'), change('comment B', 0, 'comment')], meta);
		expect((await getEntries(a.docId))['1']).toEqual({
			...emptyTranslationEntry(),
			translation: 'a',
			comment: 'comment A',
			translationVersion: 1,
			commentVersion: 1
		});
		expect((await getEntries(b.docId))['1'].translation).toBe('b');
		expect((await saveChanges(a.docId, [original], meta))[0].status).toBe('saved');
		expect((await saveChanges(a.docId, [change('b')], meta))[0].status).toBe('conflict');
	});
	it('shares comments and choices while keeping other tokens and document IDs private', async () => {
		const review = await round();
		const [a, b] = review.participants;
		await saveChanges(b.docId, [change('private other comment', 0, 'comment')], meta);
		const data = await publicLoad(publicEvent(a.token) as never);
		const serialized = JSON.stringify(data);
		expect(serialized).not.toContain(b.token);
		expect(serialized).toContain('private other comment');
		expect(serialized).not.toContain('finalDocId');
		expect(serialized).not.toContain('docId');
		expect((await getReviewerReconciliation(a.docId))?.slot).toBe(1);
	});
	it('refreshes peer comments without a page load and supports conditional requests', async () => {
		const review = await round();
		const [a, b] = review.participants;
		const event = publicEvent(a.token);
		const initial = await reviewState(event as never);
		const etag = initial.headers.get('etag')!;
		event.request.headers.set('If-None-Match', etag);
		expect((await reviewState(event as never)).status).toBe(304);
		await saveChanges(b.docId, [change('b'), change('Live comment', 0, 'comment')], meta);
		const response = await reviewState(event as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('etag')).not.toBe(etag);
		const body = await response.text();
		expect(body).toContain('Live comment');
		expect(body).not.toContain(b.token);
		expect(body).not.toContain('docId');
		expect(body).not.toContain('variantA');
		await regenerateReviewerToken(sourceId, review.id, 1);
		await expect(reviewState(event as never)).rejects.toMatchObject({ status: 404 });
		await expect(reviewState(publicEvent(sourceToken) as never)).rejects.toMatchObject({
			status: 404
		});
	});
	it('shares avatars by a URL scoped to the current link rather than repeated base64 data', async () => {
		const review = await round();
		const [a, b] = review.participants;
		const avatar =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6aS8AAAAASUVORK5CYII=';
		await updateReviewerProfile(sourceId, review.id, 2, { name: 'Peer', avatar });
		const state = await (await reviewState(publicEvent(a.token) as never)).text();
		expect(state).toContain(`/translate/${a.token}/avatar/2?v=`);
		expect(state).not.toContain(b.token);
		expect(state).not.toContain('base64');
		const event = { ...publicEvent(a.token), params: { token: a.token, slot: '2' } };
		const response = await reviewAvatar(event as never);
		expect(response.headers.get('content-type')).toBe('image/png');
		expect(new Uint8Array(await response.arrayBuffer()).slice(0, 8)).toEqual(
			new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
		);
		event.request.headers.set('If-None-Match', response.headers.get('etag')!);
		expect((await reviewAvatar(event as never)).status).toBe(304);
		await expect(
			reviewAvatar({ ...event, params: { token: a.token, slot: '3' } } as never)
		).rejects.toMatchObject({ status: 404 });
		await expect(
			reviewAvatar({ ...event, params: { token: sourceToken, slot: '2' } } as never)
		).rejects.toMatchObject({ status: 404 });
	});
	it('ignores forged peer targeting when saving through a personal link', async () => {
		const review = await round();
		const [a, b] = review.participants;
		const event = publicEvent(a.token);
		event.request = new Request(event.request.url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				docId: b.docId,
				slot: 2,
				changes: [{ ...change('b'), docId: b.docId, slot: 2 }]
			})
		});
		expect((await publicSave(event as never)).status).toBe(200);
		expect((await getEntries(a.docId))['1'].translation).toBe('b');
		expect((await getEntries(b.docId))['1']?.translation ?? '').toBe('');
	});
	it('validates choices on the server and preserves other saved fields on rejection', async () => {
		const review = await round();
		const token = review.participants[0].token;
		expect((await publicSave(publicEvent(token, [change('anything')]) as never)).status).toBe(400);
		// Старая вкладка не может сохранить комментарий в прежнее, невидимое поле
		const legacy = await publicSave(
			publicEvent(token, [change('a'), change('old tab', 0, 'comment')]) as never
		);
		expect(legacy.status).toBe(400);
		expect((await legacy.json()).error).toContain('Обновите');
		expect((await getEntries(review.participants[0].docId))['1']).toBeUndefined();
		expect((await publicSave(publicEvent(token, [change('a')]) as never)).status).toBe(200);
		expect((await publicSave(publicEvent(token, [change('b')]) as never)).status).toBe(409);
		// Обычный перевод по-прежнему сохраняет комментарии переводчика
		expect(
			(await publicSave(publicEvent(sourceToken, [change('note', 0, 'comment')]) as never)).status
		).toBe(200);
	});
	it('rotates only one link and keeps its choices intact', async () => {
		const review = await round();
		await saveChanges(review.participants[0].docId, [change('a')], meta);
		await regenerateReviewerToken(sourceId, review.id, 1);
		expect(await getDocByToken(review.participants[0].token)).toBeNull();
		expect(await getDocByToken(review.participants[1].token)).not.toBeNull();
		expect((await getEntries(review.participants[0].docId))['1'].translation).toBe('a');
	});
	it('does not expose the administrator consensus document through public routes', async () => {
		const review = await round();
		const token = (
			await pg.query<{ token: string }>('SELECT token FROM translation_docs WHERE id=$1', [
				review.finalDocId
			])
		).rows[0].token;
		expect((await publicSave(publicEvent(token, [change('attack')]) as never)).status).toBe(404);
		await expect(publicLoad(publicEvent(token) as never)).rejects.toMatchObject({ status: 404 });
	});
	it('does not create partial links when import or the first translation is incomplete', async () => {
		await expect(createReconciliation(sourceId, '{}', 'bad')).rejects.toThrow('Не хватает');
		await pg.query('DELETE FROM translation_entries WHERE doc_id=$1 AND item_key=$2', [
			sourceId,
			'1'
		]);
		await expect(createReconciliation(sourceId, markdown, 'incomplete')).rejects.toThrow(
			'непустой'
		);
		expect((await pg.query('SELECT * FROM translation_reconciliations')).rows).toHaveLength(0);
		expect((await pg.query('SELECT * FROM translation_docs')).rows).toHaveLength(1);
	});
	it('keeps previous rounds and their answers when another second translation is loaded', async () => {
		const first = await round();
		await saveChanges(first.participants[0].docId, [change('a')], meta);
		const next = await round();
		expect(next.id).not.toBe(first.id);
		expect(
			(await getAdminReconciliation(sourceId, first.id))?.participants[0].entries['1'].translation
		).toBe('a');
		expect(next.participants[0].entries).toEqual({});
	});
});

describe('administrator access and participant profiles', () => {
	it('imports a Markdown file through the administrator action and redirects to the new links', async () => {
		const form = new FormData();
		form.set('sourceId', String(sourceId));
		form.set('title', 'Imported file');
		form.set('secondText', '{}');
		form.set('secondFile', new File([markdown], 'translation.md', { type: 'text/markdown' }));
		await expect(
			actions.createReconciliation!({
				locals: { user: { username: 'admin' } },
				request: new Request('https://example.test/admin/translations?/createReconciliation', {
					method: 'POST',
					body: form
				})
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringContaining(`/admin/translations?id=${sourceId}&review=`)
		});
		expect((await pg.query('SELECT * FROM translation_reviewers')).rows).toHaveLength(2);
	});
	it('protects all administrator actions and the final save endpoint', async () => {
		for (const action of Object.values(actions))
			await expect(action!({ locals: { user: null } } as never)).rejects.toMatchObject({
				status: 404
			});
		await expect(finalSave({ locals: { user: null } } as never)).rejects.toMatchObject({
			status: 404
		});
	});
	it('saves the final text with the same version and idempotency protocol', async () => {
		const review = await round();
		const event = {
			...publicEvent('unused', [change('final')]),
			params: { id: String(review.id) },
			locals: { user: { username: 'admin' } },
			url: new URL(
				`https://example.test/admin/translations/review/${review.id}/save?sourceId=${sourceId}`
			)
		};
		expect((await finalSave(event as never)).status).toBe(200);
		expect((await getEntries(review.finalDocId))['1'].translation).toBe('final');
		expect((await getEntries(sourceId))['1'].translation).toBe('First: 1');
		expect(await getAdminReconciliation(sourceId + 1000, review.id)).toBeNull();
	});
	it('updates only the requested reviewer profile, without touching answers', async () => {
		const review = await round();
		const avatar =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
		await updateReviewerProfile(sourceId, review.id, 1, { name: 'Анна', avatar: '' });
		await updateReviewerProfile(sourceId, review.id, 1, { name: 'Анна', avatar });
		expect((await getReviewerReconciliation(review.participants[0].docId))?.profile.name).toBe(
			'Анна'
		);
		expect((await getReviewerReconciliation(review.participants[0].docId))?.profile.avatar).toBe(
			avatar
		);
		expect((await getReviewerReconciliation(review.participants[1].docId))?.profile.name).toBe(
			'Участник 2'
		);
		await expect(
			updateReviewerProfile(sourceId + 1000, review.id, 1, { name: 'wrong', avatar: '' })
		).rejects.toThrow();
	});
	it('accepts raster avatars and rejects script URLs, SVG and oversized uploads', () => {
		const png =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
		expect(validateReviewerProfile(' Анна ', png)).toEqual({ name: 'Анна', avatar: png });
		for (const avatar of [
			'javascript:alert(1)',
			'data:image/svg+xml;base64,PHN2Zz4=',
			'x'.repeat(240001),
			'data:image/png;base64,YWJjZGVmZ2hpamts'
		])
			expect(() => validateReviewerProfile('name', avatar)).toThrow();
	});
});

describe('back translation from the final wording', () => {
	async function finalizedRound() {
		const review = await round();
		await saveChanges(review.finalDocId, review.items.map((item) => ({
			...change(`Итоговая формулировка ${item.key}`), key: item.key
		})), meta);
		return review;
	}
	it('uses all final Russian wordings and never sends the English original or reviewer data', async () => {
		const review = await finalizedRound();
		await createBackTranslation(sourceId, review.id);
		const back = (await getBackTranslation(sourceId, review.id))!;
		const data = await publicLoad(publicEvent(back.token) as never) as {
			kind: string; items: TranslationItem[]; reconciliation: unknown; entries: Record<string, unknown>;
		};
		expect(data.kind).toBe('backtranslation');
		expect(data.items).toHaveLength(37);
		expect(data.items.every((item) => item.source === `Итоговая формулировка ${item.key}`)).toBe(true);
		expect(data.reconciliation).toBeNull();
		expect(data.entries).toEqual({});
		expect(JSON.stringify(data)).not.toContain(review.items[0].source);
		expect(JSON.stringify(data)).not.toContain(review.participants[0].token);
		expect(await listDocs()).toHaveLength(1);
	});
	it('refuses incomplete or unrelated rounds without creating a partial document', async () => {
		const review = await round();
		const count = (await pg.query('SELECT id FROM translation_docs')).rows.length;
		await expect(createBackTranslation(sourceId, review.id)).rejects.toThrow('итоговую формулировку');
		await expect(createBackTranslation(sourceId + 1000, review.id)).rejects.toThrow('не найдено');
		expect(await getBackTranslation(sourceId, review.id)).toBeNull();
		expect((await pg.query('SELECT id FROM translation_docs')).rows).toHaveLength(count);
	});
	it('uses an agreed choice when no manual override is needed', async () => {
		const review = await round();
		for (const participant of review.participants)
			await saveChanges(participant.docId, review.items.map((item) => ({ ...change('b'), key: item.key })), meta);
		await createBackTranslation(sourceId, review.id);
		const back = (await getBackTranslation(sourceId, review.id))!;
		expect(back.items.every((item) => item.source === review.variantB[item.key])).toBe(true);
	});
	it('keeps one frozen source and preserves answers on repeated creation', async () => {
		const review = await finalizedRound();
		const id = await createBackTranslation(sourceId, review.id);
		await saveChanges(id, [change('Back translated wording')], meta);
		await saveChanges(review.finalDocId, [change('Новый итог', 1)], meta);
		expect(await createBackTranslation(sourceId, review.id)).toBe(id);
		const back = (await getBackTranslation(sourceId, review.id))!;
		expect(back.items.find((item) => item.key === '1')?.source).toBe('Итоговая формулировка 1');
		expect(back.entries['1'].translation).toBe('Back translated wording');
		expect(await getBackTranslation(sourceId + 1000, review.id)).toBeNull();
	});
	it('shares the normal save, retry and conflict protocol with independent comments and logs', async () => {
		const review = await finalizedRound();
		await createBackTranslation(sourceId, review.id);
		const back = (await getBackTranslation(sourceId, review.id))!;
		const changes = [change('English translation'), change('A note', 0, 'comment')];
		expect((await publicSave(publicEvent(back.token, changes) as never)).status).toBe(200);
		expect((await publicSave(publicEvent(back.token, changes) as never)).status).toBe(200);
		expect((await publicSave(publicEvent(back.token, [change('Stale edit')]) as never)).status).toBe(409);
		expect((await getEntries(back.id))['1']).toMatchObject({ translation: 'English translation', comment: 'A note', translationVersion: 1 });
		expect((await getEntries(sourceId))['1'].translation).toBe('First: 1');
		expect((await getEntries(review.finalDocId))['1'].translation).toBe('Итоговая формулировка 1');
		expect((await getBackTranslation(sourceId, review.id))?.events).toHaveLength(2);
		await expect(reviewState(publicEvent(back.token) as never)).rejects.toMatchObject({ status: 404 });
	});
	it('rotates only the back translator link and retains saved work', async () => {
		const review = await finalizedRound();
		const id = await createBackTranslation(sourceId, review.id);
		const before = (await getBackTranslation(sourceId, review.id))!;
		await saveChanges(id, [change('Saved English')], meta);
		await regenerateBackTranslationToken(sourceId, review.id);
		const after = (await getBackTranslation(sourceId, review.id))!;
		expect(after.token).not.toBe(before.token);
		await expect(publicLoad(publicEvent(before.token) as never)).rejects.toMatchObject({ status: 404 });
		expect(after.entries['1'].translation).toBe('Saved English');
		expect(await getDocByToken(review.participants[0].token)).not.toBeNull();
	});
});

describe('reconciliation comment threads', () => {
	const commentEvent = (token: string, body: unknown) => ({
		params: { token },
		request: new Request(`https://example.test/translate/${token}/comments`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		})
	});
	const post = async (token: string, body: unknown) => {
		const response = await commentPost(commentEvent(token, body) as never);
		return { status: response.status, body: await response.json() };
	};
	const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

	it('keeps several comments per person in the order they were added', async () => {
		const review = await round();
		const [a, b] = review.participants;
		expect(
			(await post(a.token, { op: 'add', id: id(1), itemKey: '1', body: ' Первый ' })).status
		).toBe(200);
		await post(b.token, { op: 'add', id: id(2), itemKey: '1', body: 'Ответ коллеги' });
		await post(a.token, { op: 'add', id: id(3), itemKey: '1', body: 'Второй' });
		const comments = (await getReviewerReconciliation(b.docId))?.comments;
		expect(comments?.map((c) => [c.slot, c.body])).toEqual([
			[1, 'Первый'],
			[2, 'Ответ коллеги'],
			[1, 'Второй']
		]);
		expect(JSON.stringify(comments)).not.toContain('created');
		expect((await getAdminReconciliation(sourceId, review.id))?.comments).toHaveLength(3);
		const state = await (await reviewState(publicEvent(b.token) as never)).text();
		expect(state).toContain('Ответ коллеги');
	});
	it('does not duplicate a retried comment and never lets one person delete another', async () => {
		const review = await round();
		const [a, b] = review.participants;
		const add = { op: 'add', id: id(5), itemKey: '2', body: 'Текст' };
		await post(a.token, add);
		expect((await post(a.token, add)).body.comment.id).toBe(id(5));
		expect((await post(b.token, add)).status).toBe(409);
		expect((await post(b.token, { op: 'delete', id: id(5) })).status).toBe(200);
		expect((await getReviewerReconciliation(a.docId))?.comments).toHaveLength(1);
		expect((await post(a.token, { op: 'delete', id: id(5) })).status).toBe(200);
		expect((await getReviewerReconciliation(a.docId))?.comments).toEqual([]);
		// Повтор отправки после удаления не воскрешает комментарий
		expect((await post(a.token, add)).status).toBe(409);
		expect((await getReviewerReconciliation(a.docId))?.comments).toEqual([]);
	});
	it('rejects empty, unknown and malformed comments and closed links', async () => {
		const review = await round();
		const [a] = review.participants;
		expect((await post(a.token, { op: 'add', id: id(1), itemKey: '1', body: '   ' })).status).toBe(
			400
		);
		expect((await post(a.token, { op: 'add', id: id(1), itemKey: 'nope', body: 'x' })).status).toBe(
			400
		);
		expect(
			(await post(a.token, { op: 'add', id: 'not-a-uuid', itemKey: '1', body: 'x' })).status
		).toBe(400);
		expect(
			(await post(a.token, { op: 'add', id: id(1), itemKey: '1', body: 'x'.repeat(5001) })).status
		).toBe(400);
		expect(
			(await post(sourceToken, { op: 'add', id: id(1), itemKey: '1', body: 'x' })).status
		).toBe(404);
		expect(
			(await post(review.participants[1].token.replace(/./, 'z'), { op: 'delete', id: id(1) }))
				.status
		).toBe(404);
	});
	it('moves existing single comments into threads once, without touching the old fields', async () => {
		const review = await round();
		const [a, b] = review.participants;
		await saveChanges(a.docId, [change('Старый комментарий', 0, 'comment')], meta);
		// Сначала пишет второй участник: порядок после переноса всё равно по номеру участника
		await saveChanges(b.docId, [change('Ответ второго', 0, 'comment')], meta);
		await saveChanges(a.docId, [change('Старый комментарий', 0, 'comment')], meta);
		await saveChanges(b.docId, [{ ...change('  ', 0, 'comment'), key: '2' }], meta);
		const migration = readFileSync('drizzle/0027_translation_review_comments.sql', 'utf8');
		await pg.exec(migration);
		await pg.exec(migration);
		const comments = (await getReviewerReconciliation(b.docId))?.comments;
		expect(comments?.map((c) => [c.slot, c.itemKey, c.body])).toEqual([
			[1, '1', 'Старый комментарий'],
			[2, '1', 'Ответ второго']
		]);
		expect((await getEntries(a.docId))['1'].comment).toBe('Старый комментарий');
	});
});

describe('expert discussion with a separate administrator link', () => {
	async function setup() {
		const review = await round();
		await saveChanges(review.finalDocId, review.items.map((item) => ({ ...change(`Русский итог ${item.key}`), key: item.key })), meta);
		await updateReviewerProfile(sourceId, review.id, 1, { name: 'Андрей', avatar: '' });
		await createExpertLink(sourceId, review.id, 'Елена');
		return { review, expert: (await listExperts(sourceId, review.id))[0] };
	}
	const post = (token: string, body: unknown) => commentPost({
		params: { token }, request: new Request(`https://example.test/translate/${token}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
	} as never);
	it('uses the reviewer profile for admin and the expert initial, without leaking the admin token', async () => {
		const { expert } = await setup();
		expect(expert.adminToken).toBeTruthy();
		expect(expert.adminToken).not.toBe(expert.token);
		const data = await publicLoad(publicEvent(expert.token) as never) as { discussion: { slot: number; profiles: Record<number, { name: string; avatar: string }> } };
		expect(data.discussion.slot).toBe(2);
		expect(data.discussion.profiles[1].name).toBe('Андрей');
		expect(data.discussion.profiles[2]).toEqual({ name: 'Елена', avatar: '' });
		expect(JSON.stringify(data)).not.toContain(expert.adminToken);
		expect(JSON.stringify(data)).not.toContain('expertDocId');
	});
	it('serves the first reviewer avatar through either discussion link', async () => {
		const { review, expert } = await setup();
		const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6aS8AAAAASUVORK5CYII=';
		await updateReviewerProfile(sourceId, review.id, 1, { name: 'Андрей', avatar });
		for (const token of [expert.token, expert.adminToken!]) {
			const data = await publicLoad(publicEvent(token) as never);
			expect(JSON.stringify(data)).toContain(`/translate/${token}/avatar/1?v=`);
			expect(JSON.stringify(data)).not.toContain('base64');
			const image = await reviewAvatar({ ...publicEvent(token), params: { token, slot: '1' } } as never);
			expect(image.headers.get('content-type')).toBe('image/png');
		}
	});
	it('shares messages live, retries safely and allows deleting only your own messages', async () => {
		const { expert } = await setup();
		const expertMessage = { op: 'add', id: crypto.randomUUID(), itemKey: '1', body: 'Предлагаю уточнить' };
		const adminMessage = { op: 'add', id: crypto.randomUUID(), itemKey: '1', body: 'Спасибо, исправлю' };
		expect((await post(expert.token, expertMessage)).status).toBe(200);
		expect((await post(expert.token, expertMessage)).status).toBe(200);
		expect((await post(expert.adminToken!, adminMessage)).status).toBe(200);
		const snapshot = await (await reviewState(publicEvent(expert.token) as never)).json();
		expect(snapshot.discussion.comments.map((entry: { slot: number; body: string }) => [entry.slot, entry.body])).toEqual([[2, expertMessage.body], [1, adminMessage.body]]);
		await post(expert.token, { op: 'delete', id: adminMessage.id });
		const unchanged = await (await reviewState(publicEvent(expert.token) as never)).json();
		expect(unchanged.discussion.comments).toHaveLength(2);
		await post(expert.token, { op: 'delete', id: expertMessage.id });
		const deleted = await (await reviewState(publicEvent(expert.adminToken!) as never)).json();
		expect(deleted.discussion.comments.map((entry: { body: string }) => entry.body)).toEqual([adminMessage.body]);
		expect((await post(expert.token, expertMessage)).status).toBe(409);
	});
	it('blocks rating changes through the administrator link and isolates conversations', async () => {
		const { review, expert } = await setup();
		expect((await publicSave(publicEvent(expert.adminToken!, [change('clear')]) as never)).status).toBe(404);
		await expect(saveChanges((await getDocByToken(expert.adminToken!))!.id, [change('clear')], meta)).rejects.toThrow('только комментарии');
		await createExpertLink(sourceId, review.id, 'Другой эксперт');
		const second = (await listExperts(sourceId, review.id))[1];
		await post(expert.token, { op: 'add', id: crypto.randomUUID(), itemKey: '1', body: 'Только в моём обсуждении' });
		const other = await (await reviewState(publicEvent(second.token) as never)).text();
		expect(other).not.toContain('Только в моём обсуждении');
		expect((await post(expert.token, { op: 'add', id: crypto.randomUUID(), itemKey: 'unknown', body: 'x' })).status).toBe(400);
	});
	it('keeps existing remarks and proposed wording through the migration, once', async () => {
		const { expert } = await setup();
		await saveChanges(expert.docId, [change('Старый комментарий', 0, 'comment'), { ...change('Новая формулировка'), key: '1/rewrite' }], meta);
		const migration = readFileSync('drizzle/0030_translation_expert_discussion.sql', 'utf8');
		await pg.exec(migration);
		await pg.exec(migration);
		const state = await (await reviewState(publicEvent(expert.token) as never)).json();
		expect(state.discussion.comments.map((entry: { body: string }) => entry.body).sort()).toEqual(['Предложенная формулировка: Новая формулировка', 'Старый комментарий'].sort());
		for (const comment of state.discussion.comments) await post(expert.token, { op: 'delete', id: comment.id });
		const deleted = await (await reviewState(publicEvent(expert.token) as never)).text();
		expect(deleted).not.toContain('Старый комментарий');
		expect(deleted).not.toContain('Новая формулировка');
	});
	it('creates an admin link for old expert records and removes both links with the assessment', async () => {
		const { review, expert } = await setup();
		const adminDoc = (await getDocByToken(expert.adminToken!))!;
		await pg.query('UPDATE translation_experts SET admin_doc_id = NULL WHERE id = $1', [expert.id]);
		await pg.query('DELETE FROM translation_docs WHERE id = $1', [adminDoc.id]);
		const id = await createExpertAdminLink(sourceId, review.id, expert.id);
		expect(await createExpertAdminLink(sourceId, review.id, expert.id)).toBe(id);
		const current = (await listExperts(sourceId, review.id))[0];
		await deleteExpertLink(sourceId, review.id, expert.id);
		expect(await getDocByToken(current.token)).toBeNull();
		expect(await getDocByToken(current.adminToken!)).toBeNull();
	});
});

describe('expert review of the final wording', () => {
	async function finalizedRound(prefix = 'Итог') {
		const review = await round();
		await saveChanges(review.finalDocId, review.items.map((item) => ({
			...change(`${prefix} ${item.key}`), key: item.key
		})), meta);
		return review;
	}
	const expertChange = (key: string, value: string, field: 'translation' | 'comment' = 'translation', expectedVersion = 0) =>
		({ ...change(value, expectedVersion, field), key });

	it('freezes the final text with one response-format item and keeps statements grouped by key', async () => {
		const review = await finalizedRound();
		await createExpertLink(sourceId, review.id, '  Анна  ');
		const [expert] = await listExperts(sourceId, review.id);
		expect(expert.name).toBe('Анна');
		expect(expert.items.map((item) => item.key).slice(0, 3)).toEqual(['instruction', 'format', '1']);
		expect(expert.items).toHaveLength(32);
		expect(expert.items.find((item) => item.key === 'format')?.source).toBe(
			[1, 2, 3, 4, 5, 6].map((n) => `${n} — Итог option${n}`).join('\n')
		);
		const data = await publicLoad(publicEvent(expert.token) as never) as {
			kind: string; guide: string; reconciliation: unknown; items: TranslationItem[];
		};
		expect(data.kind).toBe('expert');
		expect(data.guide).toContain('Релевантность');
		expect(data.reconciliation).toBeNull();
		expect(JSON.stringify(data)).not.toContain(review.items[1].source);
		expect(JSON.stringify(data)).not.toContain(review.participants[0].token);
		await saveChanges(review.finalDocId, [change('Новый итог', 1)], meta);
		expect((await listExperts(sourceId, review.id))[0].items.find((item) => item.key === '1')?.source).toBe('Итог 1');
	});
	it('requires a name and a complete final text, and creates nothing otherwise', async () => {
		const review = await round();
		const count = (await pg.query('SELECT id FROM translation_docs')).rows.length;
		await expect(createExpertLink(sourceId, review.id, 'Анна')).rejects.toThrow('итоговую формулировку');
		await expect(createExpertLink(sourceId, review.id, '   ')).rejects.toThrow('имя');
		await expect(createExpertLink(sourceId + 1000, review.id, 'Анна')).rejects.toThrow('не найдено');
		expect((await pg.query('SELECT id FROM translation_docs')).rows).toHaveLength(count);
	});
	it('saves clarity, rewrite, relevance and comment through the versioned public endpoint', async () => {
		const review = await finalizedRound();
		await createExpertLink(sourceId, review.id, 'Анна');
		const [expert] = await listExperts(sourceId, review.id);
		const changes = [
			expertChange('1', 'unclear'),
			expertChange('1/relevance', '3'),
			expertChange('format', 'clear')
		];
		expect((await publicSave(publicEvent(expert.token, changes) as never)).status).toBe(200);
		expect((await publicSave(publicEvent(expert.token, changes) as never)).status).toBe(200);
		expect((await publicSave(publicEvent(expert.token, [expertChange('1/relevance', '4')]) as never)).status).toBe(409);
		const [saved] = await listExperts(sourceId, review.id);
		expect(expertAnswer(saved.entries, '1')).toEqual({ clarity: 'unclear', rewrite: '', relevance: '3', comment: '' });
		expect((await publicSave(publicEvent(expert.token, [expertChange('1/rewrite', 'Старая форма')]) as never)).status).toBe(400);
		expect((await publicSave(publicEvent(expert.token, [expertChange('1', 'Старый комментарий', 'comment')]) as never)).status).toBe(400);
		for (const bad of [
			expertChange('1', 'maybe'),
			expertChange('1/relevance', '5'),
			expertChange('instruction/relevance', '4'),
			expertChange('format/relevance', '4'),
			expertChange('1/rewrite', 'x', 'comment'),
			expertChange('option1', 'clear'),
			expertChange('1/other', 'x')
		])
			expect((await publicSave(publicEvent(expert.token, [bad]) as never)).status).toBe(400);
		await expect(saveChanges(expert.docId, [expertChange('2/relevance', '9')], meta)).rejects.toThrow('от 1 до 4');
	});
	it('keeps experts independent, renames and rotates one link without losing answers', async () => {
		const review = await finalizedRound();
		await createExpertLink(sourceId, review.id, 'Анна');
		await createExpertLink(sourceId, review.id, 'Борис');
		const [anna, boris] = await listExperts(sourceId, review.id);
		expect(anna.token).not.toBe(boris.token);
		await saveChanges(anna.docId, [expertChange('2/relevance', '4')], meta);
		await saveChanges(boris.docId, [expertChange('2/relevance', '1')], meta);
		await regenerateExpertToken(sourceId, review.id, anna.id);
		await renameExpert(sourceId, review.id, anna.id, 'Анна П.');
		await expect(regenerateExpertToken(sourceId + 1000, review.id, anna.id)).rejects.toThrow('не найден');
		const [after, other] = await listExperts(sourceId, review.id);
		expect(after.token).not.toBe(anna.token);
		expect(after.name).toBe('Анна П.');
		expect(other.token).toBe(boris.token);
		await expect(publicLoad(publicEvent(anna.token) as never)).rejects.toMatchObject({ status: 404 });
		expect(expertAnswer(after.entries, '2').relevance).toBe('4');
		const item = after.items.find((entry) => entry.key === '2')!;
		expect(summarizeExpertItem(item, [after, other])).toMatchObject({ rated: 2, relevant: 1, cvi: 0.5 });
	});
	it('does not mix ratings of an earlier wording into the summary of the new one', async () => {
		const review = await finalizedRound();
		await createExpertLink(sourceId, review.id, 'Анна');
		await saveChanges(review.finalDocId, [change('Исправленный пункт 1', 1)], meta);
		await createExpertLink(sourceId, review.id, 'Борис');
		const experts = await listExperts(sourceId, review.id);
		const row = expertResultRows(experts).find((entry) => entry.item.key === '1')!;
		expect(row.item.source).toBe('Исправленный пункт 1');
		expect(row.experts.map((expert) => expert.name)).toEqual(['Борис']);
		expect(row.answers.find((answer) => answer.link.id === experts[0].id)?.current).toBe(false);
		expect(expertResultRows(experts).find((entry) => entry.item.key === '2')?.experts).toHaveLength(2);
	});
	it('re-evaluates only changed items and counts each expert once', async () => {
		const review = await finalizedRound();
		const anna = await createExpertLink(sourceId, review.id, 'Анна');
		await createExpertLink(sourceId, review.id, 'Борис');
		const [first, boris] = await listExperts(sourceId, review.id);
		await saveChanges(first.docId, [expertChange('1/relevance', '1'), expertChange('2/relevance', '4')], meta);
		await saveChanges(boris.docId, [expertChange('1/relevance', '4'), expertChange('2/relevance', '4')], meta);
		await expect(createExpertRepeatLink(sourceId, review.id, anna)).rejects.toThrow('не менялись');
		await saveChanges(review.finalDocId, [change('Исправленный пункт 1', 1)], meta);
		const repeat = await createExpertRepeatLink(sourceId, review.id, anna);
		let experts = await listExperts(sourceId, review.id);
		const second = experts.find((expert) => expert.id === repeat)!;
		expect(second.personId).toBe(anna);
		expect(second.name).toBe('Анна');
		expect(second.items.map((item) => item.key)).toEqual(['1']);
		const data = await publicLoad(publicEvent(second.token) as never) as { guide: string };
		expect(data.guide).toContain('повторная оценка');
		await saveChanges(second.docId, [expertChange('1/relevance', '3')], meta);
		experts = await listExperts(sourceId, review.id);
		const rows = expertResultRows(experts);
		const one = rows.find((row) => row.item.key === '1')!;
		const two = rows.find((row) => row.item.key === '2')!;
		// Анна и Борис — два эксперта, а не три ссылки
		expect(one.answers).toHaveLength(2);
		expect(two.answers).toHaveLength(2);
		expect(two.experts.map((link) => link.id)).toEqual([anna, boris.id]);
		// Новая формулировка: Анна оценила повторно, Борис ещё нет
		expect(one.experts.map((link) => link.id)).toEqual([repeat]);
		expect(summarizeExpertItem(one.item, one.experts)).toMatchObject({ rated: 1, relevant: 1 });
		await renameExpert(sourceId, review.id, repeat, 'Анна П.');
		expect((await listExperts(sourceId, review.id)).filter((e) => e.personId === anna).map((e) => e.name)).toEqual(['Анна П.', 'Анна П.']);
		await expect(createExpertRepeatLink(sourceId, review.id, anna)).rejects.toThrow('не менялись');
	});
	it('deletes one link with its answers and restores the earlier rating of that expert', async () => {
		const review = await finalizedRound();
		const anna = await createExpertLink(sourceId, review.id, 'Анна');
		const [first] = await listExperts(sourceId, review.id);
		await saveChanges(first.docId, [expertChange('1/relevance', '2')], meta);
		await saveChanges(review.finalDocId, [change('Исправленный пункт 1', 1)], meta);
		const repeat = await createExpertRepeatLink(sourceId, review.id, anna);
		const second = (await listExperts(sourceId, review.id)).find((e) => e.id === repeat)!;
		await saveChanges(second.docId, [expertChange('1/relevance', '4')], meta);
		await expect(deleteExpertLink(sourceId + 1000, review.id, repeat)).rejects.toThrow('не найден');
		await deleteExpertLink(sourceId, review.id, repeat);
		await expect(publicLoad(publicEvent(second.token) as never)).rejects.toMatchObject({ status: 404 });
		expect((await pg.query('SELECT * FROM translation_entries WHERE doc_id = $1', [second.docId])).rows).toHaveLength(0);
		const experts = await listExperts(sourceId, review.id);
		expect(experts.map((e) => e.id)).toEqual([anna]);
		const current = (await getAdminReconciliation(sourceId, review.id))!;
		const finalItems = buildExpertItems(current.items, (key) => current.finalEntries[key]?.translation ?? '');
		const row = expertResultRows(experts, finalItems).find((entry) => entry.item.key === '1')!;
		expect(row.answers).toEqual([expect.objectContaining({ current: false })]);
		expect(expertAnswer(row.answers[0].link.entries, '1').relevance).toBe('2');
		// Удалённую повторную оценку можно выдать заново
		expect(await createExpertRepeatLink(sourceId, review.id, anna)).toBeGreaterThan(repeat);
		await deleteExpertLink(sourceId, review.id, anna);
		expect((await listExperts(sourceId, review.id)).map((e) => e.personId)).toEqual([anna]);
	});
});
