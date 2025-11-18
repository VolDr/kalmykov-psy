// src/lib/server/db.server.ts
import pg from 'pg';
import { env } from '$env/dynamic/private';

const pool = new pg.Pool({
	connectionString: env.DATABASE_URL,
	// Add timeouts to prevent hanging
	connectionTimeoutMillis: 5000, // 5 seconds to establish connection
	idleTimeoutMillis: 30000, // 30 seconds idle time
	query_timeout: 10000, // 10 seconds query timeout
	statement_timeout: 10000 // 10 seconds statement timeout
});

// Log pool errors
pool.on('error', (err) => {
	console.error('[Database Pool] Unexpected error on idle client:', err);
});

pool.on('connect', () => {
	console.log('[Database Pool] New client connected');
});

pool.on('acquire', () => {
	console.log('[Database Pool] Client acquired from pool');
});

pool.on('remove', () => {
	console.log('[Database Pool] Client removed from pool');
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
	const startTime = Date.now();
	console.log(`[Database Query] Starting query: ${text.substring(0, 100)}...`);
	console.log(`[Database Query] Params:`, params);

	try {
		const res = await pool.query(text, params);
		const queryTime = Date.now() - startTime;
		console.log(`[Database Query] Query completed in ${queryTime}ms, rows: ${res.rows.length}`);
		return res.rows as T[];
	} catch (err) {
		const queryTime = Date.now() - startTime;
		console.error(`[Database Query] Query failed after ${queryTime}ms:`, err);
		throw err;
	}
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
	const rows = await query<T>(text, params);
	return rows[0] ?? null;
}
