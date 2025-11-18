#!/usr/bin/env node

/**
 * Migration script to populate survey categories and surveys from hardcoded data.
 * Run with: node scripts/populate-surveys.js
 */

import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL
});

// Survey categories to insert
const categories = [
	{
		name: 'Депрессия и тревожность',
		slug: 'depression-anxiety',
		description: 'Опросники для оценки депрессии и тревоги',
		sortOrder: 1
	},
	{
		name: 'Перфекционизм',
		slug: 'perfectionism',
		description: 'Опросники для оценки перфекционизма',
		sortOrder: 2
	},
	{
		name: 'Прокрастинация',
		slug: 'procrastination',
		description: 'Опросники для оценки прокрастинации',
		sortOrder: 3
	},
	{
		name: 'Профессиональное выгорание',
		slug: 'burnout',
		description: 'Опросники для оценки профессионального выгорания',
		sortOrder: 4
	}
];

async function main() {
	const client = await pool.connect();

	try {
		console.log('Starting survey categories and surveys population...\n');

		await client.query('BEGIN');

		// Insert/update categories
		console.log('Inserting/updating survey categories...');
		for (const category of categories) {
			const result = await client.query(
				`
				INSERT INTO "SurveyCategory" (id, name, slug, description, "sortOrder", disabled, "createdAt", "updatedAt")
				VALUES (gen_random_uuid()::text, $1, $2, $3, $4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				ON CONFLICT (slug) DO UPDATE SET
					name = EXCLUDED.name,
					description = EXCLUDED.description,
					"sortOrder" = EXCLUDED."sortOrder",
					"updatedAt" = CURRENT_TIMESTAMP
				RETURNING id, name, slug
				`,
				[category.name, category.slug, category.description, category.sortOrder]
			);
			console.log(`  ✓ ${result.rows[0].slug}: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
		}

		console.log('\n✅ Successfully populated survey categories!');
		console.log(
			'📝 To populate surveys, they should already exist from migration 0004_populate_surveys.sql'
		);
		console.log('   If not, run: psql $DATABASE_URL < drizzle/0004_populate_surveys.sql\n');

		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('❌ Error populating survey data:', error);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

main();
