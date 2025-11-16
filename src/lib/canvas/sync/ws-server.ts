// src/lib/canvas/sync/ws-server.ts
// Standalone WebSocket server for canvas collaboration
// Run this alongside SvelteKit app

import { createServer } from 'http';
import { SyncServer } from './server';
import { SceneManager } from './scene-manager';
import pg from 'pg';
import type { SceneData } from '../model/shapes';

const DEFAULT_PORT = 3001;

export interface WSServerConfig {
	port?: number;
	databaseUrl?: string;
	saveInterval?: number;
}

export async function startWebSocketServer(config: WSServerConfig = {}) {
	const port = config.port ?? DEFAULT_PORT;
	const databaseUrl = config.databaseUrl ?? process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL is required');
	}

	// Create database pool
	const pool = new pg.Pool({ connectionString: databaseUrl });

	// Create scene manager
	const sceneManager = new SceneManager({
		loadScene: async (sceneId: string): Promise<SceneData | null> => {
			const result = await pool.query('SELECT data FROM scenes WHERE id = $1', [sceneId]);
			if (result.rows.length === 0) {
				return null;
			}
			return result.rows[0].data as SceneData;
		},

		saveScene: async (sceneId: string, data: SceneData): Promise<void> => {
			await pool.query(
				`
				INSERT INTO scenes (id, data)
				VALUES ($1, $2)
				ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
				`,
				[sceneId, data]
			);
			console.log(`Scene ${sceneId} saved to database`);
		}
	});

	// Create sync server
	const syncServer = new SyncServer({
		onApplyOperation: async (sceneId, operation) => {
			await sceneManager.applyOperation(sceneId, operation);
		},
		onSaveScene: async (sceneId) => {
			await sceneManager.saveScene(sceneId);
		},
		saveInterval: config.saveInterval ?? 5000
	});

	// Create HTTP server for WebSocket upgrade
	const httpServer = createServer((req, res) => {
		// Health check endpoint
		if (req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					status: 'ok',
					rooms: syncServer.getActiveRooms().length,
					connections: syncServer.getTotalConnections()
				})
			);
			return;
		}

		// Info endpoint
		if (req.url === '/info') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					rooms: syncServer.getActiveRooms(),
					totalConnections: syncServer.getTotalConnections()
				})
			);
			return;
		}

		res.writeHead(404);
		res.end('Not Found');
	});

	// Handle WebSocket upgrade
	httpServer.on('upgrade', (request, socket, head) => {
		// Validate path (e.g., /ws/scenes/:id)
		const url = new URL(request.url ?? '', `http://${request.headers.host}`);

		if (url.pathname.startsWith('/ws/scenes/')) {
			syncServer.handleUpgrade(request, socket, head);
		} else {
			socket.destroy();
		}
	});

	// Start server
	httpServer.listen(port, () => {
		console.log(`🔌 WebSocket server running on ws://localhost:${port}`);
		console.log(`   Health check: http://localhost:${port}/health`);
		console.log(`   Info: http://localhost:${port}/info`);
	});

	// Graceful shutdown
	const shutdown = async () => {
		console.log('\n🛑 Shutting down WebSocket server...');

		// Save all dirty scenes
		await sceneManager.saveDirtyScenes();

		// Close sync server
		syncServer.close();

		// Close HTTP server
		httpServer.close();

		// Close database pool
		await pool.end();

		console.log('✅ WebSocket server shut down gracefully');
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	return {
		httpServer,
		syncServer,
		sceneManager,
		shutdown
	};
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
	startWebSocketServer({
		port: parseInt(process.env.WS_PORT ?? '3001', 10),
		databaseUrl: process.env.DATABASE_URL
	}).catch((err) => {
		console.error('Failed to start WebSocket server:', err);
		process.exit(1);
	});
}
