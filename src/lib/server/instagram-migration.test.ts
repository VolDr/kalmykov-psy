import { it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

it('adds nullable button fields without changing existing rules and can be reapplied safely', async () => {
	const pg = new PGlite();
	try {
		await pg.exec(
			"CREATE TABLE instagram_rules (id serial PRIMARY KEY, dm_text text); INSERT INTO instagram_rules (dm_text) VALUES ('Existing reply');"
		);
		const migration = await readFile(
			new URL('../../../drizzle/0023_instagram_link_button.sql', import.meta.url),
			'utf8'
		);
		await pg.exec(migration);
		await pg.exec(migration);
		expect((await pg.query('SELECT * FROM instagram_rules')).rows).toEqual([
			{ id: 1, dm_text: 'Existing reply', dm_button_title: null, dm_button_url: null }
		]);
		await pg.query(
			'UPDATE instagram_rules SET dm_button_title = $1, dm_button_url = $2 WHERE id = 1',
			['Открыть', 'https://example.com']
		);
		expect((await pg.query('SELECT dm_button_title FROM instagram_rules')).rows).toEqual([
			{ dm_button_title: 'Открыть' }
		]);
	} finally {
		await pg.close();
	}
}, 30_000);
