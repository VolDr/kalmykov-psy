// src/lib/canvas/sync/client.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { createSyncClient, createSyncedHistoryStore } from './client';
import { createHistoryStore } from '../model/history';
import { writable } from 'svelte/store';
import type { Camera, RectShape } from '../model/shapes';
import type { ServerMessage, Presence } from './types';
import { createAddShapesOp, createUpdateShapesOp, createDeleteShapesOp } from './types';

// Mock WebSocket
class MockWebSocket {
	static CONNECTING = 0;
	static OPEN = 1;
	static CLOSING = 2;
	static CLOSED = 3;

	url: string;
	readyState: number = MockWebSocket.CONNECTING;
	onopen: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	sentMessages: string[] = [];

	constructor(url: string) {
		this.url = url;
	}

	send(data: string) {
		if (this.readyState !== MockWebSocket.OPEN) {
			throw new Error('WebSocket is not open');
		}
		this.sentMessages.push(data);
	}

	close() {
		this.readyState = MockWebSocket.CLOSED;
		if (this.onclose) {
			this.onclose(new CloseEvent('close'));
		}
	}

	// Test helpers
	simulateOpen() {
		this.readyState = MockWebSocket.OPEN;
		if (this.onopen) {
			this.onopen(new Event('open'));
		}
	}

	simulateMessage(data: ServerMessage) {
		if (this.onmessage) {
			this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
		}
	}

	simulateError() {
		if (this.onerror) {
			this.onerror(new Event('error'));
		}
	}
}

// Store the mock instance for tests
let mockWsInstance: MockWebSocket | null = null;

function createTestRect(id: string, x = 0, y = 0): RectShape {
	return {
		id,
		type: 'rect',
		x,
		y,
		width: 100,
		height: 50,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000',
		strokeWidth: 2
	};
}

describe('createSyncClient', () => {
	let historyStore: ReturnType<typeof createHistoryStore>;
	let cameraStore: ReturnType<typeof writable<Camera>>;

	beforeEach(() => {
		historyStore = createHistoryStore(50);
		cameraStore = writable({ x: 0, y: 0, scale: 1 });

		// Mock global WebSocket using a class wrapper
		const OriginalMockWebSocket = MockWebSocket;
		const MockWebSocketConstructor = function (this: MockWebSocket, url: string) {
			mockWsInstance = new OriginalMockWebSocket(url);
			return mockWsInstance;
		} as unknown as typeof WebSocket;

		// Copy static properties
		Object.assign(MockWebSocketConstructor, {
			CONNECTING: MockWebSocket.CONNECTING,
			OPEN: MockWebSocket.OPEN,
			CLOSING: MockWebSocket.CLOSING,
			CLOSED: MockWebSocket.CLOSED
		});

		vi.stubGlobal('WebSocket', MockWebSocketConstructor);

		vi.useFakeTimers();
	});

	afterEach(() => {
		mockWsInstance = null;
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	describe('connect', () => {
		it('should create WebSocket connection', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();

			expect(mockWsInstance).not.toBeNull();
			expect(mockWsInstance!.url).toBe('ws://localhost:3000');
			expect(get(client.status)).toBe('connecting');
		});

		it('should set status to connected on open', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			expect(get(client.status)).toBe('connected');
		});

		it('should send join message on open', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				userId: 'user-1',
				userName: 'Alice'
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			expect(mockWsInstance!.sentMessages).toHaveLength(1);
			const msg = JSON.parse(mockWsInstance!.sentMessages[0]);
			expect(msg.type).toBe('join');
			expect(msg.sceneId).toBe('scene-1');
			expect(msg.clientId).toBe('client-1');
			expect(msg.userId).toBe('user-1');
			expect(msg.name).toBe('Alice');
		});

		it('should not create duplicate connections', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			const firstInstance = mockWsInstance;

			client.connect(); // Try to connect again

			// Should still be the same instance
			expect(mockWsInstance).toBe(firstInstance);
		});
	});

	describe('disconnect', () => {
		it('should send leave message and close connection', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			client.disconnect();

			// Should have sent join + leave
			expect(mockWsInstance!.sentMessages).toHaveLength(2);
			const leaveMsg = JSON.parse(mockWsInstance!.sentMessages[1]);
			expect(leaveMsg.type).toBe('leave');
			expect(get(client.status)).toBe('disconnected');
		});

		it('should clear remote presences on disconnect', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			// Add some presences
			mockWsInstance!.simulateMessage({
				type: 'userJoined',
				presence: {
					clientId: 'client-2',
					sceneId: 'scene-1',
					lastSeen: Date.now()
				}
			});

			expect(get(client.remotePresences).size).toBe(1);

			client.disconnect();

			expect(get(client.remotePresences).size).toBe(0);
		});
	});

	describe('reconnection', () => {
		it('should attempt reconnection on close', () => {
			let connectionCount = 0;
			const OriginalMockWebSocket = MockWebSocket;
			const CountingMockWebSocketConstructor = function (this: MockWebSocket, url: string) {
				connectionCount++;
				mockWsInstance = new OriginalMockWebSocket(url);
				return mockWsInstance;
			} as unknown as typeof WebSocket;
			Object.assign(CountingMockWebSocketConstructor, MockWebSocket);
			vi.stubGlobal('WebSocket', CountingMockWebSocketConstructor);

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				reconnectDelay: 1000
			});

			client.connect();
			mockWsInstance!.simulateOpen();
			mockWsInstance!.close();

			expect(get(client.status)).toBe('reconnecting');

			// Fast-forward time
			vi.advanceTimersByTime(1000);

			// Should have tried to create new connection
			expect(connectionCount).toBe(2);
		});

		it('should use exponential backoff for reconnection', () => {
			let connectionCount = 0;
			const OriginalMockWebSocket = MockWebSocket;
			const CountingMockWebSocketConstructor = function (this: MockWebSocket, url: string) {
				connectionCount++;
				mockWsInstance = new OriginalMockWebSocket(url);
				return mockWsInstance;
			} as unknown as typeof WebSocket;
			Object.assign(CountingMockWebSocketConstructor, MockWebSocket);
			vi.stubGlobal('WebSocket', CountingMockWebSocketConstructor);

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				reconnectDelay: 1000,
				reconnectAttempts: 3
			});

			client.connect();
			mockWsInstance!.simulateOpen();
			mockWsInstance!.close();

			// First reconnect after 1000ms
			vi.advanceTimersByTime(1000);
			expect(connectionCount).toBe(2);

			mockWsInstance!.close();

			// Second reconnect after 2000ms
			vi.advanceTimersByTime(2000);
			expect(connectionCount).toBe(3);

			mockWsInstance!.close();

			// Third reconnect after 4000ms
			vi.advanceTimersByTime(4000);
			expect(connectionCount).toBe(4);
		});

		it('should stop reconnecting after max attempts', () => {
			let connectionCount = 0;
			const OriginalMockWebSocket = MockWebSocket;
			const CountingMockWebSocketConstructor = function (this: MockWebSocket, url: string) {
				connectionCount++;
				mockWsInstance = new OriginalMockWebSocket(url);
				return mockWsInstance;
			} as unknown as typeof WebSocket;
			Object.assign(CountingMockWebSocketConstructor, MockWebSocket);
			vi.stubGlobal('WebSocket', CountingMockWebSocketConstructor);

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				reconnectDelay: 100,
				reconnectAttempts: 2
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			// Exhaust reconnect attempts
			mockWsInstance!.close();
			vi.advanceTimersByTime(100);
			mockWsInstance!.close();
			vi.advanceTimersByTime(200);
			mockWsInstance!.close();

			// Should not reconnect anymore
			vi.advanceTimersByTime(10000);
			expect(connectionCount).toBe(3);
		});
	});

	describe('remote operations', () => {
		it('should apply remote add operation', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			const rect = createTestRect('remote-rect');
			const op = createAddShapesOp('scene-1', 'client-2', [rect]);

			mockWsInstance!.simulateMessage({
				type: 'operation',
				operation: op
			});

			const state = get(historyStore);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('remote-rect');
			expect(state.undoStack).toHaveLength(0); // Remote ops don't add to history
		});

		it('should apply remote update operation', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			const rect = createTestRect('rect-1', 0, 0);
			historyStore.setAllShapes([rect]);

			client.connect();
			mockWsInstance!.simulateOpen();

			const updatedRect = { ...rect, x: 100, y: 200 };
			const op = createUpdateShapesOp('scene-1', 'client-2', [updatedRect]);

			mockWsInstance!.simulateMessage({
				type: 'operation',
				operation: op
			});

			const state = get(historyStore);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[0].y).toBe(200);
		});

		it('should apply remote delete operation', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			historyStore.setAllShapes([createTestRect('rect-1'), createTestRect('rect-2')]);

			client.connect();
			mockWsInstance!.simulateOpen();

			const op = createDeleteShapesOp('scene-1', 'client-2', ['rect-1']);

			mockWsInstance!.simulateMessage({
				type: 'operation',
				operation: op
			});

			const state = get(historyStore);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('rect-2');
		});

		it('should ignore operations from self', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			const rect = createTestRect('self-rect');
			const op = createAddShapesOp('scene-1', 'client-1', [rect]); // Same client ID

			mockWsInstance!.simulateMessage({
				type: 'operation',
				operation: op
			});

			const state = get(historyStore);
			expect(state.shapes).toHaveLength(0); // Should not be added
		});
	});

	describe('presence management', () => {
		it('should update presence from server', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			const presence: Presence = {
				clientId: 'client-2',
				sceneId: 'scene-1',
				cursor: { x: 100, y: 200 },
				lastSeen: Date.now()
			};

			mockWsInstance!.simulateMessage({
				type: 'presence',
				presence
			});

			const presences = get(client.remotePresences);
			expect(presences.size).toBe(1);
			expect(presences.get('client-2')?.cursor).toEqual({ x: 100, y: 200 });
		});

		it('should handle presence list message', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			mockWsInstance!.simulateMessage({
				type: 'presenceList',
				presences: [
					{ clientId: 'client-2', sceneId: 'scene-1', lastSeen: Date.now() },
					{ clientId: 'client-3', sceneId: 'scene-1', lastSeen: Date.now() },
					{ clientId: 'client-1', sceneId: 'scene-1', lastSeen: Date.now() } // Self
				]
			});

			const presences = get(client.remotePresences);
			expect(presences.size).toBe(2); // Should exclude self
			expect(presences.has('client-2')).toBe(true);
			expect(presences.has('client-3')).toBe(true);
			expect(presences.has('client-1')).toBe(false);
		});

		it('should handle userJoined message', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			mockWsInstance!.simulateMessage({
				type: 'userJoined',
				presence: {
					clientId: 'client-2',
					sceneId: 'scene-1',
					name: 'Bob',
					lastSeen: Date.now()
				}
			});

			const presences = get(client.remotePresences);
			expect(presences.get('client-2')?.name).toBe('Bob');
		});

		it('should handle userLeft message', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			// Add user first
			mockWsInstance!.simulateMessage({
				type: 'userJoined',
				presence: { clientId: 'client-2', sceneId: 'scene-1', lastSeen: Date.now() }
			});

			expect(get(client.remotePresences).size).toBe(1);

			// User leaves
			mockWsInstance!.simulateMessage({
				type: 'userLeft',
				clientId: 'client-2'
			});

			expect(get(client.remotePresences).size).toBe(0);
		});
	});

	describe('sendOperation', () => {
		it('should send operation message', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			const rect = createTestRect('rect-1');
			const op = createAddShapesOp('scene-1', 'client-1', [rect]);

			client.sendOperation(op);

			// Should have join + operation
			expect(mockWsInstance!.sentMessages).toHaveLength(2);
			const msg = JSON.parse(mockWsInstance!.sentMessages[1]);
			expect(msg.type).toBe('operation');
			expect(msg.operation.type).toBe('addShapes');
		});

		it('should queue operation when disconnected (offline queue)', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			const op = createAddShapesOp('scene-1', 'client-1', []);
			client.sendOperation(op);

			// Should be queued
			expect(client.offlineQueueSize()).toBe(1);
		});

		it('should flush offline queue on reconnect', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			const rect = createTestRect('rect-1');
			const op = createAddShapesOp('scene-1', 'client-1', [rect]);
			client.sendOperation(op);

			expect(client.offlineQueueSize()).toBe(1);

			// Connect
			client.connect();
			mockWsInstance!.simulateOpen();

			// Queue should be flushed
			expect(client.offlineQueueSize()).toBe(0);
			// Should have join + flushed operation
			expect(mockWsInstance!.sentMessages).toHaveLength(2);
		});

		it('should drop operations when offline queue is full', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				maxOfflineQueueSize: 2
			});

			client.sendOperation(createAddShapesOp('scene-1', 'client-1', []));
			client.sendOperation(createAddShapesOp('scene-1', 'client-1', []));
			client.sendOperation(createAddShapesOp('scene-1', 'client-1', []));

			expect(client.offlineQueueSize()).toBe(2);
			expect(consoleSpy).toHaveBeenCalledWith('Offline queue full, dropping operation');
			consoleSpy.mockRestore();
		});
	});

	describe('sendPresence', () => {
		it('should send presence message with debounce', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				userName: 'Alice',
				presenceDebounceMs: 50
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			client.sendPresence({ cursor: { x: 50, y: 100 } });

			// Should not be sent immediately due to debounce
			expect(mockWsInstance!.sentMessages).toHaveLength(1); // Only join message

			// Advance timers to trigger debounce
			vi.advanceTimersByTime(50);

			expect(mockWsInstance!.sentMessages).toHaveLength(2);
			const msg = JSON.parse(mockWsInstance!.sentMessages[1]);
			expect(msg.type).toBe('presence');
			expect(msg.presence.cursor).toEqual({ x: 50, y: 100 });
			expect(msg.presence.clientId).toBe('client-1');
			expect(msg.presence.sceneId).toBe('scene-1');
			expect(msg.presence.name).toBe('Alice');
		});

		it('should merge multiple presence updates within debounce window', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore,
				presenceDebounceMs: 100
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			client.sendPresence({ cursor: { x: 10, y: 20 } });
			vi.advanceTimersByTime(30);
			client.sendPresence({ cursor: { x: 50, y: 100 } });
			vi.advanceTimersByTime(30);
			client.sendPresence({ selectedIds: ['shape-1'] });

			// Still within debounce window
			expect(mockWsInstance!.sentMessages).toHaveLength(1);

			vi.advanceTimersByTime(100);

			// Should have merged all updates
			expect(mockWsInstance!.sentMessages).toHaveLength(2);
			const msg = JSON.parse(mockWsInstance!.sentMessages[1]);
			expect(msg.presence.cursor).toEqual({ x: 50, y: 100 });
			expect(msg.presence.selectedIds).toEqual(['shape-1']);
		});

		it('should not send when disconnected', () => {
			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.sendPresence({ cursor: { x: 0, y: 0 } });
			vi.advanceTimersByTime(100);

			// No messages sent
			expect(mockWsInstance).toBeNull();
		});
	});

	describe('error handling', () => {
		it('should log server errors', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateOpen();

			mockWsInstance!.simulateMessage({
				type: 'error',
				message: 'Scene not found',
				code: 'SCENE_NOT_FOUND'
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				'Server error:',
				'Scene not found',
				'SCENE_NOT_FOUND'
			);
			consoleSpy.mockRestore();
		});

		it('should log WebSocket errors', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const client = createSyncClient({
				url: 'ws://localhost:3000',
				sceneId: 'scene-1',
				clientId: 'client-1',
				historyStore,
				cameraStore
			});

			client.connect();
			mockWsInstance!.simulateError();

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});

describe('createSyncedHistoryStore', () => {
	let historyStore: ReturnType<typeof createHistoryStore>;
	let mockSyncClient: ReturnType<typeof createSyncClient>;
	let sentOperations: any[];

	beforeEach(() => {
		historyStore = createHistoryStore(50);
		sentOperations = [];

		mockSyncClient = {
			connect: vi.fn(),
			disconnect: vi.fn(),
			sendOperation: vi.fn((op) => sentOperations.push(op)),
			sendPresence: vi.fn(),
			status: writable('connected'),
			remotePresences: writable(new Map()),
			destroy: vi.fn()
		} as any;
	});

	it('should add shapes and send operation', () => {
		const syncedStore = createSyncedHistoryStore(
			historyStore,
			mockSyncClient,
			'scene-1',
			'client-1'
		);

		const rect = createTestRect('rect-1');
		syncedStore.addShapes([rect]);

		const state = get(historyStore);
		expect(state.shapes).toHaveLength(1);
		expect(sentOperations).toHaveLength(1);
		expect(sentOperations[0].type).toBe('addShapes');
	});

	it('should update shapes and send operation', () => {
		const syncedStore = createSyncedHistoryStore(
			historyStore,
			mockSyncClient,
			'scene-1',
			'client-1'
		);

		const rect = createTestRect('rect-1', 0, 0);
		historyStore.setAllShapes([rect]);

		syncedStore.updateShapes([{ ...rect, x: 100 }]);

		const state = get(historyStore);
		expect(state.shapes[0].x).toBe(100);
		expect(sentOperations).toHaveLength(1);
		expect(sentOperations[0].type).toBe('updateShapes');
	});

	it('should delete shapes and send operation', () => {
		const syncedStore = createSyncedHistoryStore(
			historyStore,
			mockSyncClient,
			'scene-1',
			'client-1'
		);

		historyStore.setAllShapes([createTestRect('rect-1')]);
		syncedStore.deleteShapes(['rect-1']);

		const state = get(historyStore);
		expect(state.shapes).toHaveLength(0);
		expect(sentOperations).toHaveLength(1);
		expect(sentOperations[0].type).toBe('deleteShapes');
	});

	it('should pass through undo/redo without sending', () => {
		const syncedStore = createSyncedHistoryStore(
			historyStore,
			mockSyncClient,
			'scene-1',
			'client-1'
		);

		const rect = createTestRect('rect-1');
		syncedStore.addShapes([rect]);
		sentOperations = [];

		syncedStore.undo();

		const state = get(historyStore);
		expect(state.shapes).toHaveLength(0);
		expect(sentOperations).toHaveLength(0); // No operation sent for undo
	});

	it('should pass through remote operations', () => {
		const syncedStore = createSyncedHistoryStore(
			historyStore,
			mockSyncClient,
			'scene-1',
			'client-1'
		);

		syncedStore.applyRemoteAdd([createTestRect('remote-1')]);

		const state = get(historyStore);
		expect(state.shapes).toHaveLength(1);
		expect(state.undoStack).toHaveLength(0);
		expect(sentOperations).toHaveLength(0);
	});
});
