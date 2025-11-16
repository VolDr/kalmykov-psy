// server/websocket.ts
// Standalone WebSocket server for canvas multiplayer
// Run with: npx ts-node server/websocket.ts
// Or: npx tsx server/websocket.ts

import { WebSocketServer, WebSocket } from 'ws';
import { createSyncServer, type ConnectedClient } from '../src/lib/canvas/sync/server';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

const wss = new WebSocketServer({ port: PORT });
const syncServer = createSyncServer({
	maxOperationsPerRoom: 100,
	presenceTimeoutMs: 30000
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
	console.log('Client connected');

	// Create client wrapper
	const client: ConnectedClient = {
		clientId: '',
		sceneId: '',
		lastSeen: Date.now(),
		send: (message) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(message));
			}
		}
	};

	ws.on('message', (data: Buffer) => {
		try {
			syncServer.handleClientMessage(client, data.toString());
		} catch (err) {
			console.error('Error handling message:', err);
		}
	});

	ws.on('close', () => {
		console.log(`Client ${client.clientId} disconnected`);
		syncServer.removeClient(client);
	});

	ws.on('error', (err) => {
		console.error('WebSocket error:', err);
	});
});

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('\nShutting down WebSocket server...');
	syncServer.destroy();
	wss.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

// Log stats every minute
setInterval(() => {
	console.log(`Active rooms: ${syncServer.getRoomCount()}`);
}, 60000);
