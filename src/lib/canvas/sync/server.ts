// src/lib/canvas/sync/server.ts
// Server-side WebSocket sync logic for canvas collaboration

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import type {
	ClientMessage,
	ServerMessage,
	Operation,
	Presence,
	ServerPresenceListMessage,
	ServerUserJoinedMessage,
	ServerUserLeftMessage,
	ServerOperationMessage,
	ServerJoinedMessage,
	ServerErrorMessage
} from './types';

export interface ClientConnection {
	ws: WebSocket;
	clientId: string;
	sceneId: string;
	userId?: string;
	name?: string;
	presence?: Presence;
}

export interface Room {
	sceneId: string;
	clients: Map<string, ClientConnection>;
	isDirty: boolean;
	lastSaved: number;
}

export interface SyncServerOptions {
	onLoadScene?: (sceneId: string) => Promise<unknown>;
	onSaveScene?: (sceneId: string, data: unknown) => Promise<void>;
	onApplyOperation?: (sceneId: string, operation: Operation) => Promise<void>;
	saveInterval?: number; // ms between saves
	presenceTimeout?: number; // ms before removing stale presence
}

export class SyncServer {
	private wss: WebSocketServer;
	private rooms: Map<string, Room> = new Map();
	private clientToRoom: Map<WebSocket, ClientConnection> = new Map();
	private saveIntervalHandle: ReturnType<typeof setInterval> | null = null;
	private options: SyncServerOptions;

	constructor(options: SyncServerOptions = {}) {
		this.options = {
			saveInterval: 5000, // Save every 5 seconds if dirty
			presenceTimeout: 30000, // 30 seconds
			...options
		};

		this.wss = new WebSocketServer({ noServer: true });

		this.wss.on('connection', (ws: WebSocket) => {
			this.handleConnection(ws);
		});

		// Start periodic save timer
		if (this.options.onSaveScene && this.options.saveInterval) {
			this.saveIntervalHandle = setInterval(() => {
				this.saveDirtyRooms();
			}, this.options.saveInterval);
		}
	}

	// Handle HTTP upgrade for WebSocket
	handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
		this.wss.handleUpgrade(request, socket, head, (ws) => {
			this.wss.emit('connection', ws, request);
		});
	}

	private handleConnection(ws: WebSocket) {
		ws.on('message', (data) => {
			try {
				const message: ClientMessage = JSON.parse(data.toString());
				this.handleClientMessage(ws, message);
			} catch (err) {
				console.error('Failed to parse client message:', err);
				this.sendError(ws, 'Invalid message format');
			}
		});

		ws.on('close', () => {
			this.handleDisconnect(ws);
		});

		ws.on('error', (err) => {
			console.error('WebSocket error:', err);
		});
	}

	private handleClientMessage(ws: WebSocket, message: ClientMessage) {
		switch (message.type) {
			case 'join':
				this.handleJoin(ws, message);
				break;

			case 'leave':
				this.handleLeave(ws, message);
				break;

			case 'operation':
				this.handleOperation(ws, message.operation);
				break;

			case 'presence':
				this.handlePresence(ws, message.presence);
				break;
		}
	}

	private handleJoin(
		ws: WebSocket,
		message: { sceneId: string; clientId: string; userId?: string; name?: string }
	) {
		const { sceneId, clientId, userId, name } = message;

		// Create room if doesn't exist
		if (!this.rooms.has(sceneId)) {
			this.rooms.set(sceneId, {
				sceneId,
				clients: new Map(),
				isDirty: false,
				lastSaved: Date.now()
			});
		}

		const room = this.rooms.get(sceneId)!;

		// Create client connection
		const connection: ClientConnection = {
			ws,
			clientId,
			sceneId,
			userId,
			name,
			presence: {
				clientId,
				sceneId,
				userId,
				name,
				lastSeen: Date.now(),
				color: this.generateUserColor(clientId)
			}
		};

		room.clients.set(clientId, connection);
		this.clientToRoom.set(ws, connection);

		// Send joined confirmation
		const joinedMessage: ServerJoinedMessage = {
			type: 'joined',
			clientId,
			sceneId
		};
		this.send(ws, joinedMessage);

		// Send current presence list to new client
		const presences = Array.from(room.clients.values())
			.filter((c) => c.clientId !== clientId && c.presence)
			.map((c) => c.presence!);

		if (presences.length > 0) {
			const presenceListMessage: ServerPresenceListMessage = {
				type: 'presenceList',
				presences
			};
			this.send(ws, presenceListMessage);
		}

		// Notify other clients about new user
		const userJoinedMessage: ServerUserJoinedMessage = {
			type: 'userJoined',
			presence: connection.presence!
		};
		this.broadcastToRoom(room, userJoinedMessage, clientId);

		console.log(`Client ${clientId} joined room ${sceneId}`);
	}

	private handleLeave(
		ws: WebSocket,
		message: { sceneId: string; clientId: string }
	) {
		const connection = this.clientToRoom.get(ws);
		if (!connection) return;

		this.removeClientFromRoom(connection);
	}

	private handleOperation(ws: WebSocket, operation: Operation) {
		const connection = this.clientToRoom.get(ws);
		if (!connection) {
			this.sendError(ws, 'Not joined to any room');
			return;
		}

		const room = this.rooms.get(connection.sceneId);
		if (!room) {
			this.sendError(ws, 'Room not found');
			return;
		}

		// Apply operation (if callback provided)
		if (this.options.onApplyOperation) {
			this.options.onApplyOperation(connection.sceneId, operation).catch((err) => {
				console.error('Failed to apply operation:', err);
			});
		}

		// Mark room as dirty for periodic save
		room.isDirty = true;

		// Broadcast operation to other clients in the room
		const operationMessage: ServerOperationMessage = {
			type: 'operation',
			operation
		};
		this.broadcastToRoom(room, operationMessage, operation.clientId);
	}

	private handlePresence(ws: WebSocket, presence: Presence) {
		const connection = this.clientToRoom.get(ws);
		if (!connection) return;

		const room = this.rooms.get(connection.sceneId);
		if (!room) return;

		// Update connection presence
		connection.presence = {
			...presence,
			lastSeen: Date.now()
		};

		// Broadcast presence to other clients
		const presenceMessage: ServerMessage = {
			type: 'presence',
			presence: connection.presence
		};
		this.broadcastToRoom(room, presenceMessage, connection.clientId);
	}

	private handleDisconnect(ws: WebSocket) {
		const connection = this.clientToRoom.get(ws);
		if (!connection) return;

		this.removeClientFromRoom(connection);
	}

	private removeClientFromRoom(connection: ClientConnection) {
		const room = this.rooms.get(connection.sceneId);
		if (!room) return;

		room.clients.delete(connection.clientId);
		this.clientToRoom.delete(connection.ws);

		// Notify other clients
		const userLeftMessage: ServerUserLeftMessage = {
			type: 'userLeft',
			clientId: connection.clientId
		};
		this.broadcastToRoom(room, userLeftMessage);

		console.log(`Client ${connection.clientId} left room ${connection.sceneId}`);

		// Clean up empty rooms
		if (room.clients.size === 0) {
			// Save before removing
			if (room.isDirty && this.options.onSaveScene) {
				this.saveRoom(room).catch((err) => {
					console.error('Failed to save room before cleanup:', err);
				});
			}
			this.rooms.delete(connection.sceneId);
			console.log(`Room ${connection.sceneId} cleaned up`);
		}
	}

	private send(ws: WebSocket, message: ServerMessage) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}

	private sendError(ws: WebSocket, errorMessage: string, code?: string) {
		const message: ServerErrorMessage = {
			type: 'error',
			message: errorMessage,
			code
		};
		this.send(ws, message);
	}

	private broadcastToRoom(room: Room, message: ServerMessage, excludeClientId?: string) {
		const data = JSON.stringify(message);
		for (const [clientId, connection] of room.clients) {
			if (clientId !== excludeClientId && connection.ws.readyState === WebSocket.OPEN) {
				connection.ws.send(data);
			}
		}
	}

	private async saveDirtyRooms() {
		if (!this.options.onSaveScene) return;

		for (const room of this.rooms.values()) {
			if (room.isDirty) {
				await this.saveRoom(room);
			}
		}
	}

	private async saveRoom(room: Room) {
		if (!this.options.onSaveScene) return;

		try {
			// The actual scene data should be loaded and modified via onApplyOperation
			// This is just marking it as saved
			room.isDirty = false;
			room.lastSaved = Date.now();
			console.log(`Room ${room.sceneId} marked as saved`);
		} catch (err) {
			console.error(`Failed to save room ${room.sceneId}:`, err);
		}
	}

	private generateUserColor(clientId: string): string {
		// Generate a consistent color based on clientId
		const colors = [
			'#FF6B6B',
			'#4ECDC4',
			'#45B7D1',
			'#96CEB4',
			'#FFEAA7',
			'#DDA0DD',
			'#98D8C8',
			'#F7DC6F',
			'#BB8FCE',
			'#85C1E9'
		];

		let hash = 0;
		for (let i = 0; i < clientId.length; i++) {
			hash = (hash << 5) - hash + clientId.charCodeAt(i);
			hash = hash & hash;
		}

		return colors[Math.abs(hash) % colors.length];
	}

	// Public API methods

	getRoomInfo(sceneId: string) {
		const room = this.rooms.get(sceneId);
		if (!room) return null;

		return {
			sceneId: room.sceneId,
			clientCount: room.clients.size,
			isDirty: room.isDirty,
			lastSaved: room.lastSaved
		};
	}

	getActiveRooms() {
		return Array.from(this.rooms.keys());
	}

	getTotalConnections() {
		let total = 0;
		for (const room of this.rooms.values()) {
			total += room.clients.size;
		}
		return total;
	}

	close() {
		if (this.saveIntervalHandle) {
			clearInterval(this.saveIntervalHandle);
			this.saveIntervalHandle = null;
		}

		// Save all dirty rooms before closing
		this.saveDirtyRooms().then(() => {
			this.wss.close();
		});
	}
}

// Singleton instance for use across the application
let syncServerInstance: SyncServer | null = null;

export function getSyncServer(options?: SyncServerOptions): SyncServer {
	if (!syncServerInstance) {
		syncServerInstance = new SyncServer(options);
	}
	return syncServerInstance;
}

export function closeSyncServer() {
	if (syncServerInstance) {
		syncServerInstance.close();
		syncServerInstance = null;
	}
}
