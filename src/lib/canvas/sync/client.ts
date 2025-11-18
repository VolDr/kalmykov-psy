// src/lib/canvas/sync/client.ts

import { writable, type Writable, get } from 'svelte/store';
import type { HistoryStore } from '../model/history';
import type { Camera } from '../model/shapes';
import type { Operation, Presence, ClientMessage, ServerMessage, generateClientId } from './types';
import {
	createAddShapesOp,
	createUpdateShapesOp,
	createDeleteShapesOp,
	createSetCameraOp
} from './types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface SyncClientOptions {
	url: string;
	sceneId: string;
	clientId: string;
	historyStore: HistoryStore;
	cameraStore: Writable<Camera>;
	userId?: string;
	userName?: string;
	reconnectAttempts?: number;
	reconnectDelay?: number;
	presenceDebounceMs?: number;
	maxOfflineQueueSize?: number;
	connectionTimeout?: number;
}

export interface SyncClient {
	connect: () => void;
	disconnect: () => void;
	sendOperation: (op: Operation) => void;
	sendPresence: (presence: Partial<Presence>) => void;
	status: Writable<ConnectionStatus>;
	remotePresences: Writable<Map<string, Presence>>;
	offlineQueueSize: () => number;
	destroy: () => void;
}

export function createSyncClient(options: SyncClientOptions): SyncClient {
	const {
		url,
		sceneId,
		clientId,
		historyStore,
		cameraStore,
		userId,
		userName,
		reconnectAttempts = 5,
		reconnectDelay = 1000,
		presenceDebounceMs = 50,
		maxOfflineQueueSize = 100,
		connectionTimeout = 5000
	} = options;

	let ws: WebSocket | null = null;
	let reconnectCount = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let hasLoggedError = false; // Track if we've logged an error to avoid spam

	// Offline queue for operations
	const offlineQueue: Operation[] = [];

	// Presence debounce
	let presenceDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
	let pendingPresence: Partial<Presence> | null = null;

	const status = writable<ConnectionStatus>('disconnected');
	const remotePresences = writable<Map<string, Presence>>(new Map());

	function connect() {
		if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
			return;
		}

		status.set('connecting');

		// Clear any existing connection timeout
		if (connectionTimeoutId) {
			clearTimeout(connectionTimeoutId);
		}

		ws = new WebSocket(url);

		// Set connection timeout to prevent hanging
		connectionTimeoutId = setTimeout(() => {
			if (ws && ws.readyState === WebSocket.CONNECTING) {
				if (!hasLoggedError) {
					console.warn('WebSocket connection timeout - server not responding', { url });
					hasLoggedError = true;
				}
				ws.close();
				ws = null;
				status.set('disconnected');
				attemptReconnect();
			}
		}, connectionTimeout);

		ws.onopen = () => {
			// Clear connection timeout on successful connection
			if (connectionTimeoutId) {
				clearTimeout(connectionTimeoutId);
				connectionTimeoutId = null;
			}

			status.set('connected');
			reconnectCount = 0;
			hasLoggedError = false; // Reset error flag on successful connection

			// Send join message
			const joinMessage: ClientMessage = {
				type: 'join',
				sceneId,
				clientId,
				userId,
				name: userName
			};
			ws?.send(JSON.stringify(joinMessage));

			// Flush offline queue
			flushOfflineQueue();
		};

		ws.onmessage = (event) => {
			try {
				const message: ServerMessage = JSON.parse(event.data);
				handleServerMessage(message);
			} catch (err) {
				console.error('Failed to parse server message:', err);
			}
		};

		ws.onclose = () => {
			// Clear connection timeout
			if (connectionTimeoutId) {
				clearTimeout(connectionTimeoutId);
				connectionTimeoutId = null;
			}

			ws = null;
			status.set('disconnected');
			attemptReconnect();
		};

		ws.onerror = (err) => {
			// Only log error once to avoid console spam during reconnection attempts
			if (!hasLoggedError) {
				console.error('WebSocket connection failed:', {
					url,
					error: err,
					message: 'Unable to connect to multiplayer server. Will retry automatically.'
				});
				hasLoggedError = true;
			}
		};
	}

	function disconnect() {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
		if (connectionTimeoutId) {
			clearTimeout(connectionTimeoutId);
			connectionTimeoutId = null;
		}
		reconnectCount = reconnectAttempts; // Prevent auto-reconnect

		if (ws) {
			// Send leave message before closing
			const leaveMessage: ClientMessage = {
				type: 'leave',
				sceneId,
				clientId
			};
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(leaveMessage));
			}
			ws.close();
			ws = null;
		}

		status.set('disconnected');
		remotePresences.set(new Map());
	}

	function attemptReconnect() {
		if (reconnectCount >= reconnectAttempts) {
			// All reconnection attempts failed
			if (!hasLoggedError) {
				console.warn('WebSocket: Maximum reconnection attempts reached. Multiplayer disabled.');
				hasLoggedError = true;
			}
			return;
		}

		status.set('reconnecting');
		reconnectCount++;

		const delay = reconnectDelay * Math.pow(2, reconnectCount - 1); // Exponential backoff
		reconnectTimeout = setTimeout(() => {
			connect();
		}, delay);
	}

	function handleServerMessage(message: ServerMessage) {
		switch (message.type) {
			case 'operation':
				applyRemoteOperation(message.operation);
				break;

			case 'presence':
				remotePresences.update((map) => {
					const newMap = new Map(map);
					newMap.set(message.presence.clientId, message.presence);
					return newMap;
				});
				break;

			case 'presenceList':
				remotePresences.update(() => {
					const newMap = new Map<string, Presence>();
					for (const presence of message.presences) {
						if (presence.clientId !== clientId) {
							newMap.set(presence.clientId, presence);
						}
					}
					return newMap;
				});
				break;

			case 'joined':
				// Successfully joined the room
				break;

			case 'userJoined':
				if (message.presence.clientId !== clientId) {
					remotePresences.update((map) => {
						const newMap = new Map(map);
						newMap.set(message.presence.clientId, message.presence);
						return newMap;
					});
				}
				break;

			case 'userLeft':
				remotePresences.update((map) => {
					const newMap = new Map(map);
					newMap.delete(message.clientId);
					return newMap;
				});
				break;

			case 'error':
				console.error('Server error:', message.message, message.code);
				break;
		}
	}

	function applyRemoteOperation(op: Operation) {
		// Only apply operations from other clients
		if (op.clientId === clientId) {
			return;
		}

		switch (op.type) {
			case 'addShapes':
				historyStore.applyRemoteAdd(op.shapes);
				break;

			case 'updateShapes':
				historyStore.applyRemoteUpdate(op.shapes);
				break;

			case 'deleteShapes':
				historyStore.applyRemoteDelete(op.ids);
				break;

			case 'setCamera':
				// Optionally sync camera (usually each user has their own view)
				// cameraStore.set(op.camera);
				break;
		}
	}

	function flushOfflineQueue() {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return;
		}

		while (offlineQueue.length > 0) {
			const op = offlineQueue.shift()!;
			const message: ClientMessage = {
				type: 'operation',
				operation: op
			};
			ws.send(JSON.stringify(message));
		}
	}

	function sendOperation(op: Operation) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			// Queue for later if offline
			if (offlineQueue.length < maxOfflineQueueSize) {
				offlineQueue.push(op);
			} else {
				console.warn('Offline queue full, dropping operation');
			}
			return;
		}

		const message: ClientMessage = {
			type: 'operation',
			operation: op
		};

		ws.send(JSON.stringify(message));
	}

	function sendPresenceImmediate(partialPresence: Partial<Presence>) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return;
		}

		const presence: Presence = {
			clientId,
			sceneId,
			lastSeen: Date.now(),
			userId,
			name: userName,
			...partialPresence
		};

		const message: ClientMessage = {
			type: 'presence',
			presence
		};

		ws.send(JSON.stringify(message));
	}

	function sendPresence(partialPresence: Partial<Presence>) {
		// Merge with pending presence
		pendingPresence = { ...pendingPresence, ...partialPresence };

		// Clear existing timeout
		if (presenceDebounceTimeout) {
			clearTimeout(presenceDebounceTimeout);
		}

		// Set new timeout
		presenceDebounceTimeout = setTimeout(() => {
			if (pendingPresence) {
				sendPresenceImmediate(pendingPresence);
				pendingPresence = null;
			}
			presenceDebounceTimeout = null;
		}, presenceDebounceMs);
	}

	function destroy() {
		if (presenceDebounceTimeout) {
			clearTimeout(presenceDebounceTimeout);
		}
		if (connectionTimeoutId) {
			clearTimeout(connectionTimeoutId);
			connectionTimeoutId = null;
		}
		disconnect();
	}

	return {
		connect,
		disconnect,
		sendOperation,
		sendPresence,
		status,
		remotePresences,
		offlineQueueSize: () => offlineQueue.length,
		destroy
	};
}

// Helper wrapper that integrates with existing stores
export function createSyncedHistoryStore(
	historyStore: HistoryStore,
	syncClient: SyncClient,
	sceneId: string,
	clientId: string
) {
	return {
		subscribe: historyStore.subscribe,
		setAllShapes: historyStore.setAllShapes,

		addShapes: (shapes: Parameters<typeof historyStore.addShapes>[0]) => {
			historyStore.addShapes(shapes);
			const op = createAddShapesOp(sceneId, clientId, shapes);
			syncClient.sendOperation(op);
		},

		updateShapes: (shapes: Parameters<typeof historyStore.updateShapes>[0]) => {
			historyStore.updateShapes(shapes);
			const op = createUpdateShapesOp(sceneId, clientId, shapes);
			syncClient.sendOperation(op);
		},

		deleteShapes: (ids: Parameters<typeof historyStore.deleteShapes>[0]) => {
			historyStore.deleteShapes(ids);
			const op = createDeleteShapesOp(sceneId, clientId, ids);
			syncClient.sendOperation(op);
		},

		undo: historyStore.undo,
		redo: historyStore.redo,
		applyRemoteAdd: historyStore.applyRemoteAdd,
		applyRemoteUpdate: historyStore.applyRemoteUpdate,
		applyRemoteDelete: historyStore.applyRemoteDelete
	};
}
