// src/lib/server/db.server.ts
import pg from 'pg';
import { env } from '$env/dynamic/private';

const pool = new pg.Pool({
	connectionString: env.DATABASE_URL
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
	const res = await pool.query(text, params);
	return res.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
	const rows = await query<T>(text, params);
	return rows[0] ?? null;
}
