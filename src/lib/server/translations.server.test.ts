import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import type { TranslationChange } from '../data/translation';

const mockDb = vi.hoisted(() => ({
	select: vi.fn(),
	insert: vi.fn(),
	transaction: vi.fn(),
	update: vi.fn()
}));
vi.mock('../../index', () => ({ db: mockDb }));
import { getEntries, saveChanges } from './translations.server';
import { POST } from '../../routes/translate/[token]/save/+server';

const pg = new PGlite();
let docId: number;
let token: string;
const meta = { ip: '192.0.2.1', userAgent: 'test' };
const change = (
	value: string,
	expectedVersion = 0,
	key = '1',
	field: 'translation' | 'comment' = 'translation'
): TranslationChange => ({ key, field, value, expectedVersion, operationId: crypto.randomUUID() });

beforeAll(async () => {
	await pg.exec(readFileSync('drizzle/0024_translation_docs.sql', 'utf8'));
	await pg.exec(readFileSync('drizzle/0025_translation_save_versions.sql', 'utf8'));
	const actual = drizzle(pg);
	mockDb.select.mockImplementation(actual.select.bind(actual));
	mockDb.insert.mockImplementation(actual.insert.bind(actual));
	mockDb.transaction.mockImplementation(actual.transaction.bind(actual));
	mockDb.update.mockImplementation(actual.update.bind(actual));
	const docs = await pg.query<{ id: string; token: string }>(
		'SELECT id, token FROM translation_docs'
	);
	docId = Number(docs.rows[0].id);
	token = docs.rows[0].token;
}, 30_000);
beforeEach(async () => {
	await pg.exec('TRUNCATE translation_entries, translation_operations, translation_events');
});
afterAll(async () => {
	await pg.close();
});

describe('versioned translation saves using PostgreSQL', () => {
	it('confirms the same operation twice without changing its version or duplicating the journal', async () => {
		const original = change('once');
		const first = await saveChanges(docId, [original], meta);
		expect(await saveChanges(docId, [original], meta)).toEqual(first);
		expect((await getEntries(docId))['1'].translationVersion).toBe(1);
		expect((await pg.query('SELECT * FROM translation_operations')).rows).toHaveLength(1);
		expect((await pg.query('SELECT * FROM translation_events')).rows).toHaveLength(1);
	});
	it('migrates existing entries without losing text, and migration is repeatable', async () => {
		await pg.query(
			'INSERT INTO translation_entries (doc_id, item_key, translation) VALUES ($1, $2, $3)',
			[docId, '1', 'existing']
		);
		await pg.exec(readFileSync('drizzle/0025_translation_save_versions.sql', 'utf8'));
		expect((await getEntries(docId))['1']).toEqual({
			translation: 'existing',
			comment: '',
			translationVersion: 0,
			commentVersion: 0
		});
	});

	it('versions translation and comment independently', async () => {
		await saveChanges(docId, [change('translation')], meta);
		await saveChanges(docId, [change('comment', 0, '1', 'comment')], meta);
		expect((await getEntries(docId))['1']).toEqual({
			translation: 'translation',
			comment: 'comment',
			translationVersion: 1,
			commentVersion: 1
		});
	});

	it('rejects a stale edit and a stale clear without changing the saved value', async () => {
		await saveChanges(docId, [change('fresh')], meta);
		for (const text of ['stale', '']) {
			const [result] = await saveChanges(docId, [change(text)], meta);
			expect(result).toMatchObject({ status: 'conflict', value: 'fresh', version: 1 });
		}
		expect((await getEntries(docId))['1'].translation).toBe('fresh');
		expect((await pg.query('SELECT * FROM translation_operations')).rows).toHaveLength(1);
	});

	it('recognizes a replay even after another translator saves a later version', async () => {
		const original = change('A');
		await saveChanges(docId, [original], meta);
		await saveChanges(docId, [change('B', 1)], { ...meta, ip: '192.0.2.2' });
		const [receipt] = await saveChanges(docId, [original], meta);
		expect(receipt).toMatchObject({ status: 'conflict', value: 'B', version: 2 });
		expect((await getEntries(docId))['1'].translation).toBe('B');
		expect((await pg.query('SELECT * FROM translation_operations')).rows).toHaveLength(2);
		expect((await pg.query('SELECT * FROM translation_events')).rows).toHaveLength(2);
	});

	it('does not accept reuse of an operation ID with a different payload', async () => {
		const original = change('A');
		await saveChanges(docId, [original], meta);
		const [result] = await saveChanges(
			docId,
			[{ ...original, value: 'wrong', expectedVersion: 1 }],
			meta
		);
		expect(result.status).toBe('conflict');
		expect((await getEntries(docId))['1'].translation).toBe('A');
	});

	it('returns results for both accepted and conflicting fields in one batch', async () => {
		await saveChanges(docId, [change('fresh')], meta);
		const result = await saveChanges(docId, [change('stale'), change('other', 0, '2')], meta);
		expect(result.map((entry) => entry.status)).toEqual(['conflict', 'saved']);
		expect((await getEntries(docId))['2'].translation).toBe('other');
	});

	it('records the actual previous value for the first competing edit', async () => {
		await saveChanges(docId, [change('first')], meta);
		await saveChanges(docId, [change('second', 1)], { ...meta, ip: '192.0.2.2' });
		const { rows } = await pg.query(
			'SELECT old_value, new_value FROM translation_events ORDER BY id'
		);
		expect(rows).toEqual([
			{ old_value: '', new_value: 'first' },
			{ old_value: 'first', new_value: 'second' }
		]);
	});

	it('rolls back the value and receipt if audit logging fails', async () => {
		await pg.exec(`CREATE FUNCTION translation_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
			CREATE TRIGGER translation_test_failure BEFORE INSERT ON translation_events FOR EACH ROW EXECUTE FUNCTION translation_test_failure();`);
		try {
			await expect(saveChanges(docId, [change('rollback')], meta)).rejects.toThrow();
			expect(await getEntries(docId)).toEqual({});
			expect((await pg.query('SELECT * FROM translation_operations')).rows).toHaveLength(0);
		} finally {
			await pg.exec(
				'DROP TRIGGER translation_test_failure ON translation_events; DROP FUNCTION translation_test_failure();'
			);
		}
	});
});

describe('translation HTTP protocol', () => {
	const post = (changes: unknown) =>
		POST({
			params: { token },
			request: new Request(`https://example.test/translate/${token}/save`, {
				method: 'POST',
				body: JSON.stringify({ changes })
			}),
			getClientAddress: () => meta.ip
		} as never);
	it('returns 409 with recoverable conflicts and confirms accepted changes', async () => {
		expect((await post([change('A')])).status).toBe(200);
		const response = await post([change('B'), change('comment', 0, '1', 'comment')]);
		expect(response.status).toBe(409);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(
			(await response.json()).results.map((result: { status: string }) => result.status)
		).toEqual(['conflict', 'saved']);
	});
	it('rejects old clients missing version metadata without writing data', async () => {
		expect((await post([{ key: '1', field: 'translation', value: 'legacy' }])).status).toBe(400);
		expect(await getEntries(docId)).toEqual({});
	});
});
