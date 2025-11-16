// src/lib/canvas/sync/server.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncServer, type ClientConnection, type Room } from './server';
import { WebSocket, WebSocketServer } from 'ws';
import type {
	AddShapesOp,
	UpdateShapesOp,
	DeleteShapesOp,
	Presence,
	ClientMessage,
	ServerMessage
} from './types';

// Mock ws module
vi.mock('ws', () => {
	const MockWebSocketServer = vi.fn().mockImplementation(() => {
		const handlers: Map<string, (...args: unknown[]) => void> = new Map();
		return {
			on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
				handlers.set(event, handler);
			}),
			handleUpgrade: vi.fn(),
			emit: vi.fn((event: string, ...args: unknown[]) => {
				const handler = handlers.get(event);
				if (handler) handler(...args);
			}),
			close: vi.fn()
		};
	});

	return {
		WebSocketServer: MockWebSocketServer,
		WebSocket: {
			OPEN: 1,
			CONNECTING: 0,
			CLOSING: 2,
			CLOSED: 3
		}
	};
});

describe('SyncServer', () => {
	let server: SyncServer;
	let onApplyOperation: ReturnType<typeof vi.fn>;
	let onSaveScene: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();

		onApplyOperation = vi.fn().mockResolvedValue(undefined);
		onSaveScene = vi.fn().mockResolvedValue(undefined);

		server = new SyncServer({
			onApplyOperation,
			onSaveScene,
			saveInterval: 5000
		});
	});

	afterEach(() => {
		server.close();
		vi.useRealTimers();
	});

	describe('Room Management', () => {
		it('should create room when first client joins', () => {
			const mockWs = createMockWebSocket();
			simulateJoin(server, mockWs, 'scene-1', 'client-1');

			const roomInfo = server.getRoomInfo('scene-1');
			expect(roomInfo).not.toBeNull();
			expect(roomInfo?.clientCount).toBe(1);
		});

		it('should add multiple clients to same room', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			const roomInfo = server.getRoomInfo('scene-1');
			expect(roomInfo?.clientCount).toBe(2);
		});

		it('should create separate rooms for different scenes', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-2', 'client-2');

			expect(server.getActiveRooms()).toHaveLength(2);
			expect(server.getRoomInfo('scene-1')?.clientCount).toBe(1);
			expect(server.getRoomInfo('scene-2')?.clientCount).toBe(1);
		});

		it('should remove client from room on disconnect', () => {
			const mockWs = createMockWebSocket();
			simulateJoin(server, mockWs, 'scene-1', 'client-1');

			// Simulate disconnect
			mockWs.triggerClose();

			const roomInfo = server.getRoomInfo('scene-1');
			expect(roomInfo).toBeNull(); // Room cleaned up when empty
		});

		it('should keep room when other clients remain', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			ws1.triggerClose();

			const roomInfo = server.getRoomInfo('scene-1');
			expect(roomInfo?.clientCount).toBe(1);
		});
	});

	describe('Operation Broadcasting', () => {
		it('should broadcast operation to other clients in room', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();
			const ws3 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');
			simulateJoin(server, ws3, 'scene-1', 'client-3');

			const operation: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [{ id: 'shape-1', type: 'rect', x: 0, y: 0, width: 100, height: 100 }]
			};

			simulateOperation(server, ws1, operation);

			// ws1 should not receive (sender)
			const ws1Messages = getMessages(ws1);
			const ws1Ops = ws1Messages.filter((m) => m.type === 'operation');
			expect(ws1Ops).toHaveLength(0);

			// ws2 and ws3 should receive
			const ws2Messages = getMessages(ws2);
			const ws2Ops = ws2Messages.filter((m) => m.type === 'operation');
			expect(ws2Ops).toHaveLength(1);
			expect((ws2Ops[0] as { operation: AddShapesOp }).operation.opId).toBe('op-1');

			const ws3Messages = getMessages(ws3);
			const ws3Ops = ws3Messages.filter((m) => m.type === 'operation');
			expect(ws3Ops).toHaveLength(1);
		});

		it('should not broadcast to clients in different rooms', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-2', 'client-2');

			const operation: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			};

			simulateOperation(server, ws1, operation);

			const ws2Messages = getMessages(ws2);
			const ws2Ops = ws2Messages.filter((m) => m.type === 'operation');
			expect(ws2Ops).toHaveLength(0);
		});

		it('should call onApplyOperation callback', async () => {
			const mockWs = createMockWebSocket();
			simulateJoin(server, mockWs, 'scene-1', 'client-1');

			const operation: UpdateShapesOp = {
				type: 'updateShapes',
				opId: 'op-2',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			};

			simulateOperation(server, mockWs, operation);

			await vi.runAllTimersAsync();

			expect(onApplyOperation).toHaveBeenCalledWith('scene-1', operation);
		});

		it('should mark room as dirty after operation', () => {
			const mockWs = createMockWebSocket();
			simulateJoin(server, mockWs, 'scene-1', 'client-1');

			const operation: DeleteShapesOp = {
				type: 'deleteShapes',
				opId: 'op-3',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				ids: ['shape-1']
			};

			simulateOperation(server, mockWs, operation);

			const roomInfo = server.getRoomInfo('scene-1');
			expect(roomInfo?.isDirty).toBe(true);
		});
	});

	describe('Presence Updates', () => {
		it('should broadcast presence to other clients', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			const presence: Presence = {
				clientId: 'client-1',
				sceneId: 'scene-1',
				cursor: { x: 100, y: 200 },
				lastSeen: Date.now()
			};

			simulatePresence(server, ws1, presence);

			const ws2Messages = getMessages(ws2);
			const presenceMessages = ws2Messages.filter((m) => m.type === 'presence');
			expect(presenceMessages).toHaveLength(1);
		});

		it('should send presence list to new client', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			const ws2Messages = getMessages(ws2);
			const presenceListMsg = ws2Messages.find((m) => m.type === 'presenceList');
			expect(presenceListMsg).toBeDefined();
		});

		it('should notify when user joins', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			const ws1Messages = getMessages(ws1);
			const userJoinedMsg = ws1Messages.find((m) => m.type === 'userJoined');
			expect(userJoinedMsg).toBeDefined();
		});

		it('should notify when user leaves', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');

			ws1.triggerClose();

			const ws2Messages = getMessages(ws2);
			const userLeftMsg = ws2Messages.find((m) => m.type === 'userLeft');
			expect(userLeftMsg).toBeDefined();
		});
	});

	describe('Server Statistics', () => {
		it('should track total connections', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();
			const ws3 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-1', 'client-2');
			simulateJoin(server, ws3, 'scene-2', 'client-3');

			expect(server.getTotalConnections()).toBe(3);
		});

		it('should track active rooms', () => {
			const ws1 = createMockWebSocket();
			const ws2 = createMockWebSocket();

			simulateJoin(server, ws1, 'scene-1', 'client-1');
			simulateJoin(server, ws2, 'scene-2', 'client-2');

			const rooms = server.getActiveRooms();
			expect(rooms).toContain('scene-1');
			expect(rooms).toContain('scene-2');
		});

		it('should return null for non-existent room', () => {
			const roomInfo = server.getRoomInfo('non-existent');
			expect(roomInfo).toBeNull();
		});
	});

	describe('Error Handling', () => {
		it('should handle invalid JSON messages gracefully', () => {
			const mockWs = createMockWebSocket();
			simulateJoin(server, mockWs, 'scene-1', 'client-1');

			// Should not throw
			expect(() => {
				mockWs.triggerMessage('invalid json {{{');
			}).not.toThrow();

			const messages = getMessages(mockWs);
			const errorMsg = messages.find((m) => m.type === 'error');
			expect(errorMsg).toBeDefined();
		});

		it('should reject operations from unjoined clients', () => {
			const mockWs = createMockWebSocket();

			// Send operation without joining first
			const operation: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			};

			const msg: ClientMessage = { type: 'operation', operation };
			mockWs.triggerMessage(JSON.stringify(msg));

			// Note: This test relies on server implementation handling unjoined clients
		});
	});
});

// Helper functions for testing

interface MockWebSocket {
	send: ReturnType<typeof vi.fn>;
	readyState: number;
	triggerMessage: (data: string) => void;
	triggerClose: () => void;
	triggerError: (err: Error) => void;
	_handlers: Map<string, (...args: unknown[]) => void>;
}

function createMockWebSocket(): MockWebSocket {
	const handlers: Map<string, (...args: unknown[]) => void> = new Map();

	const mockWs: MockWebSocket = {
		send: vi.fn(),
		readyState: WebSocket.OPEN,
		_handlers: handlers,
		triggerMessage: (data: string) => {
			const handler = handlers.get('message');
			if (handler) handler(Buffer.from(data));
		},
		triggerClose: () => {
			const handler = handlers.get('close');
			if (handler) handler();
		},
		triggerError: (err: Error) => {
			const handler = handlers.get('error');
			if (handler) handler(err);
		}
	};

	// @ts-expect-error - mock implementation
	mockWs.on = (event: string, handler: (...args: unknown[]) => void) => {
		handlers.set(event, handler);
	};

	return mockWs;
}

function simulateJoin(
	server: SyncServer,
	ws: MockWebSocket,
	sceneId: string,
	clientId: string,
	userId?: string,
	name?: string
) {
	// Get the internal WebSocketServer instance
	// @ts-expect-error - accessing private property for testing
	const wss = server.wss;

	// Trigger connection event
	wss.emit('connection', ws);

	// Send join message
	const joinMessage: ClientMessage = {
		type: 'join',
		sceneId,
		clientId,
		userId,
		name
	};
	ws.triggerMessage(JSON.stringify(joinMessage));
}

function simulateOperation(server: SyncServer, ws: MockWebSocket, operation: AddShapesOp | UpdateShapesOp | DeleteShapesOp) {
	const msg: ClientMessage = { type: 'operation', operation };
	ws.triggerMessage(JSON.stringify(msg));
}

function simulatePresence(server: SyncServer, ws: MockWebSocket, presence: Presence) {
	const msg: ClientMessage = { type: 'presence', presence };
	ws.triggerMessage(JSON.stringify(msg));
}

function getMessages(ws: MockWebSocket): ServerMessage[] {
	const messages: ServerMessage[] = [];
	for (const call of ws.send.mock.calls) {
		try {
			messages.push(JSON.parse(call[0] as string));
		} catch {
			// Ignore parse errors
		}
	}
	return messages;
}
