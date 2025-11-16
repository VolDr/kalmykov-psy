// src/lib/canvas/sync/server.ts
// WebSocket server for multiplayer canvas collaboration
// This is a reference implementation - can be used with Node.js ws library or SvelteKit adapter

import type {
	ClientMessage,
	ServerMessage,
	Presence,
	Operation,
	JoinMessage,
	LeaveMessage,
	OperationMessage,
	PresenceMessage
} from './types';

export interface ConnectedClient {
	clientId: string;
	sceneId: string;
	userId?: string;
	name?: string;
	lastSeen: number;
	send: (message: ServerMessage) => void;
}

export interface Room {
	sceneId: string;
	clients: Map<string, ConnectedClient>;
	// Optional: store recent operations for replay on join
	recentOperations: Operation[];
}

export interface SyncServerOptions {
	maxOperationsPerRoom?: number;
	presenceTimeoutMs?: number;
}

export function createSyncServer(options: SyncServerOptions = {}) {
	const { maxOperationsPerRoom = 100, presenceTimeoutMs = 30000 } = options;

	const rooms = new Map<string, Room>();

	function getOrCreateRoom(sceneId: string): Room {
		let room = rooms.get(sceneId);
		if (!room) {
			room = {
				sceneId,
				clients: new Map(),
				recentOperations: []
			};
			rooms.set(sceneId, room);
		}
		return room;
	}

	function handleJoin(client: ConnectedClient, message: JoinMessage) {
		const room = getOrCreateRoom(message.sceneId);

		// Update client info
		client.sceneId = message.sceneId;
		client.clientId = message.clientId;
		client.userId = message.userId;
		client.name = message.name;
		client.lastSeen = Date.now();

		// Add client to room
		room.clients.set(client.clientId, client);

		// Send joined confirmation
		client.send({
			type: 'joined',
			clientId: client.clientId,
			sceneId: message.sceneId
		});

		// Send current presence list
		const presences: Presence[] = [];
		for (const [, c] of room.clients) {
			presences.push({
				clientId: c.clientId,
				sceneId: c.sceneId,
				userId: c.userId,
				name: c.name,
				lastSeen: c.lastSeen
			});
		}
		client.send({
			type: 'presenceList',
			presences
		});

		// Notify other clients about new user
		const joinPresence: Presence = {
			clientId: client.clientId,
			sceneId: client.sceneId,
			userId: client.userId,
			name: client.name,
			lastSeen: client.lastSeen
		};

		broadcastToRoom(room, client.clientId, {
			type: 'userJoined',
			presence: joinPresence
		});
	}

	function handleLeave(client: ConnectedClient, _message: LeaveMessage) {
		const room = rooms.get(client.sceneId);
		if (!room) return;

		room.clients.delete(client.clientId);

		// Notify other clients
		broadcastToRoom(room, client.clientId, {
			type: 'userLeft',
			clientId: client.clientId
		});

		// Clean up empty rooms
		if (room.clients.size === 0) {
			rooms.delete(client.sceneId);
		}
	}

	function handleOperation(client: ConnectedClient, message: OperationMessage) {
		const room = rooms.get(client.sceneId);
		if (!room) {
			client.send({
				type: 'error',
				message: 'Not in a room',
				code: 'NOT_IN_ROOM'
			});
			return;
		}

		const operation = message.operation;

		// Store recent operations (for potential replay)
		room.recentOperations.push(operation);
		if (room.recentOperations.length > maxOperationsPerRoom) {
			room.recentOperations.shift();
		}

		// Broadcast operation to all clients in room (including sender for confirmation)
		broadcastToRoom(room, null, {
			type: 'operation',
			operation
		});
	}

	function handlePresence(client: ConnectedClient, message: PresenceMessage) {
		const room = rooms.get(client.sceneId);
		if (!room) return;

		client.lastSeen = Date.now();

		// Update presence and broadcast to others
		broadcastToRoom(room, client.clientId, {
			type: 'presence',
			presence: message.presence
		});
	}

	function broadcastToRoom(room: Room, excludeClientId: string | null, message: ServerMessage) {
		for (const [clientId, client] of room.clients) {
			if (clientId !== excludeClientId) {
				try {
					client.send(message);
				} catch (err) {
					console.error(`Failed to send to client ${clientId}:`, err);
				}
			}
		}
	}

	function handleClientMessage(client: ConnectedClient, rawMessage: string) {
		let message: ClientMessage;
		try {
			message = JSON.parse(rawMessage);
		} catch (err) {
			client.send({
				type: 'error',
				message: 'Invalid JSON',
				code: 'INVALID_JSON'
			});
			return;
		}

		switch (message.type) {
			case 'join':
				handleJoin(client, message);
				break;
			case 'leave':
				handleLeave(client, message);
				break;
			case 'operation':
				handleOperation(client, message);
				break;
			case 'presence':
				handlePresence(client, message);
				break;
			default:
				client.send({
					type: 'error',
					message: 'Unknown message type',
					code: 'UNKNOWN_MESSAGE_TYPE'
				});
		}
	}

	function removeClient(client: ConnectedClient) {
		const room = rooms.get(client.sceneId);
		if (room) {
			room.clients.delete(client.clientId);

			broadcastToRoom(room, client.clientId, {
				type: 'userLeft',
				clientId: client.clientId
			});

			if (room.clients.size === 0) {
				rooms.delete(client.sceneId);
			}
		}
	}

	function cleanupStalePresences() {
		const now = Date.now();

		for (const [, room] of rooms) {
			for (const [clientId, client] of room.clients) {
				if (now - client.lastSeen > presenceTimeoutMs) {
					room.clients.delete(clientId);

					broadcastToRoom(room, clientId, {
						type: 'userLeft',
						clientId
					});
				}
			}

			if (room.clients.size === 0) {
				rooms.delete(room.sceneId);
			}
		}
	}

	// Periodically clean up stale presences
	const cleanupInterval = setInterval(cleanupStalePresences, presenceTimeoutMs / 2);

	function destroy() {
		clearInterval(cleanupInterval);
		rooms.clear();
	}

	return {
		handleClientMessage,
		removeClient,
		getRoomCount: () => rooms.size,
		getClientCountInRoom: (sceneId: string) => rooms.get(sceneId)?.clients.size ?? 0,
		destroy
	};
}

// Example usage with Node.js ws library:
/*
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
const syncServer = createSyncServer();

wss.on('connection', (ws) => {
  const client: ConnectedClient = {
    clientId: '',
    sceneId: '',
    lastSeen: Date.now(),
    send: (message) => ws.send(JSON.stringify(message))
  };

  ws.on('message', (data) => {
    syncServer.handleClientMessage(client, data.toString());
  });

  ws.on('close', () => {
    syncServer.removeClient(client);
  });
});
*/
