import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { PgDialect } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';

const mockDb = vi.hoisted(() => ({ execute: vi.fn(), update: vi.fn() }));
vi.mock('../../index', () => ({ db: mockDb }));
vi.mock('./client.server', () => ({ serializeClient: (value: unknown) => value }));

import { consumeLimit, limits } from './request-limits.server';
import { feedbackService } from './feedback.server';
import { currentStateService } from './current-state.server';

const pg = new PGlite();
const dialect = new PgDialect();
beforeAll(async () => {
	await pg.exec(readFileSync('drizzle/0022_security_rate_limits.sql', 'utf8'));
	for (const [table, fields] of [
		['Feedback', ['attitude', 'goals', 'method']],
		['CurrentState', ['individual', 'family', 'social']]
	] as const) {
		await pg.exec(`CREATE TABLE "${table}" (id text PRIMARY KEY, "smallId" text UNIQUE,
			"createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now(),
			disabled boolean DEFAULT false, editable boolean DEFAULT true, generally double precision DEFAULT 5,
			"clientId" text DEFAULT 'fake-client', datetime timestamp DEFAULT now(),
			${fields.map((f) => `"${f}" double precision DEFAULT 5`).join(',')});`);
	}
	const actual = drizzle(pg);
	mockDb.update.mockImplementation(actual.update.bind(actual));
	mockDb.execute.mockImplementation((statement) => {
		const query = dialect.sqlToQuery(statement);
		return pg.query(query.sql, query.params);
	});
}, 30_000);
beforeEach(async () => {
	await pg.exec('TRUNCATE security_rate_limits, "Feedback", "CurrentState"');
});
afterAll(async () => {
	await pg.close();
});

describe('Drizzle identifier escaping regression (GHSA-gpj5-g38j-94v9)', () => {
	it('treats quotes and SQL fragments in an alias as one literal identifier', async () => {
		const alias = 'value"; DROP TABLE security_rate_limits; --';
		const query = dialect.sqlToQuery(sql`SELECT 1 AS ${sql.identifier(alias)}`);
		const result = await pg.query(query.sql, query.params);
		expect(result.rows).toEqual([{ [alias]: 1 }]);
		await expect(pg.query('SELECT count(*) FROM security_rate_limits')).resolves.toBeDefined();
	});
});

describe('shared rate counters using actual PostgreSQL SQL', () => {
	it('allows exactly five requests under concurrent load', async () => {
		const results = await Promise.all(
			Array.from({ length: 20 }, () => consumeLimit(limits.booking, '192.0.2.1'))
		);
		expect(results.filter((r) => r.allowed)).toHaveLength(5);
		expect(results.every((r) => r.retryAfter > 0)).toBe(true);
	});
	it('keeps limits after a worker is recreated', async () => {
		await consumeLimit(limits.mailRecipient, 'a@example.invalid');
		vi.resetModules();
		const worker = await import('./request-limits.server');
		expect((await worker.consumeLimit(limits.mailRecipient, 'a@example.invalid')).allowed).toBe(
			false
		);
	});
	it('isolates scopes and recipients, storing no raw email or IP', async () => {
		await consumeLimit(limits.mailRecipient, 'a@example.invalid');
		expect((await consumeLimit(limits.mailRecipient, 'b@example.invalid')).allowed).toBe(true);
		expect((await consumeLimit(limits.loginAccount, 'a@example.invalid')).allowed).toBe(true);
		const result = await pg.query<{ key_hash: string }>(
			'SELECT key_hash FROM security_rate_limits'
		);
		expect(result.rows.every((r) => /^[a-f0-9]{64}$/.test(r.key_hash))).toBe(true);
	});
	it('resets an expired counter using the database clock', async () => {
		await consumeLimit(limits.mailRecipient, 'a@example.invalid');
		await pg.exec("UPDATE security_rate_limits SET reset_at = now() - interval '1 second'");
		expect((await consumeLimit(limits.mailRecipient, 'a@example.invalid')).allowed).toBe(true);
	});
});

describe.each([
	[
		'Feedback',
		() => feedbackService.submit('TARGET', { attitude: 2, goals: 2, method: 2, generally: 2 })
	],
	[
		'CurrentState',
		() =>
			currentStateService.submit('TARGET', { individual: 2, family: 2, social: 2, generally: 2 })
	]
] as const)('%s public submission', (table, submit) => {
	beforeEach(async () => {
		await pg.exec(`INSERT INTO "${table}" (id, "smallId") VALUES ('fake-id', 'TARGET')`);
	});
	it('allows only one of two concurrent submissions', async () => {
		const results = await Promise.all([submit(), submit()]);
		expect(results.filter(Boolean)).toHaveLength(1);
		const row = (
			await pg.query<{ editable: boolean; generally: number }>(
				`SELECT editable, generally FROM "${table}"`
			)
		).rows[0];
		expect(row).toEqual({ editable: false, generally: 2 });
	});
	it.each(['disabled = true', 'editable = false'])(
		'rejects a closed form: %s',
		async (condition) => {
			await pg.exec(`UPDATE "${table}" SET ${condition}`);
			expect(await submit()).toBeUndefined();
			expect(
				(await pg.query<{ generally: number }>(`SELECT generally FROM "${table}"`)).rows[0]
					.generally
			).toBe(5);
		}
	);
});
