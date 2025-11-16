// src/lib/canvas/sync/types.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
	generateOpId,
	generateClientId,
	createAddShapesOp,
	createUpdateShapesOp,
	createDeleteShapesOp,
	createSetCameraOp,
	type Operation,
	type AddShapesOp,
	type UpdateShapesOp,
	type DeleteShapesOp,
	type SetCameraOp,
	type Presence,
	type ClientMessage,
	type ServerMessage
} from './types';
import type { RectShape, Camera } from '../model/shapes';

describe('sync/types', () => {
	describe('generateOpId', () => {
		it('should generate a valid UUID', () => {
			const id = generateOpId();
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should generate unique IDs', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateOpId());
			}
			expect(ids.size).toBe(100);
		});
	});

	describe('generateClientId', () => {
		it('should generate a valid UUID', () => {
			const id = generateClientId();
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should generate unique IDs', () => {
			const id1 = generateClientId();
			const id2 = generateClientId();
			expect(id1).not.toBe(id2);
		});
	});

	describe('createAddShapesOp', () => {
		it('should create a valid AddShapesOp', () => {
			const sceneId = 'scene-123';
			const clientId = 'client-456';
			const shapes: RectShape[] = [
				{
					id: 'rect-1',
					type: 'rect',
					x: 10,
					y: 20,
					width: 100,
					height: 50,
					rotation: 0,
					scaleX: 1,
					scaleY: 1,
					stroke: '#000',
					strokeWidth: 2
				}
			];

			const op = createAddShapesOp(sceneId, clientId, shapes);

			expect(op.type).toBe('addShapes');
			expect(op.sceneId).toBe(sceneId);
			expect(op.clientId).toBe(clientId);
			expect(op.shapes).toEqual(shapes);
			expect(op.opId).toBeTruthy();
			expect(op.timestamp).toBeLessThanOrEqual(Date.now());
			expect(op.timestamp).toBeGreaterThan(Date.now() - 1000);
		});

		it('should handle multiple shapes', () => {
			const shapes: RectShape[] = [
				{
					id: 'rect-1',
					type: 'rect',
					x: 0,
					y: 0,
					width: 10,
					height: 10,
					rotation: 0,
					scaleX: 1,
					scaleY: 1,
					stroke: '#000',
					strokeWidth: 1
				},
				{
					id: 'rect-2',
					type: 'rect',
					x: 20,
					y: 20,
					width: 30,
					height: 30,
					rotation: 0,
					scaleX: 1,
					scaleY: 1,
					stroke: '#f00',
					strokeWidth: 2
				}
			];

			const op = createAddShapesOp('scene', 'client', shapes);
			expect(op.shapes).toHaveLength(2);
		});
	});

	describe('createUpdateShapesOp', () => {
		it('should create a valid UpdateShapesOp', () => {
			const shapes: RectShape[] = [
				{
					id: 'rect-1',
					type: 'rect',
					x: 100,
					y: 200,
					width: 150,
					height: 75,
					rotation: 45,
					scaleX: 1,
					scaleY: 1,
					stroke: '#f00',
					strokeWidth: 3
				}
			];

			const op = createUpdateShapesOp('scene-1', 'client-1', shapes);

			expect(op.type).toBe('updateShapes');
			expect(op.shapes).toEqual(shapes);
			expect(op.opId).toBeTruthy();
		});
	});

	describe('createDeleteShapesOp', () => {
		it('should create a valid DeleteShapesOp', () => {
			const ids = ['shape-1', 'shape-2', 'shape-3'];
			const op = createDeleteShapesOp('scene-1', 'client-1', ids);

			expect(op.type).toBe('deleteShapes');
			expect(op.ids).toEqual(ids);
			expect(op.opId).toBeTruthy();
		});

		it('should handle empty array', () => {
			const op = createDeleteShapesOp('scene', 'client', []);
			expect(op.ids).toEqual([]);
		});
	});

	describe('createSetCameraOp', () => {
		it('should create a valid SetCameraOp', () => {
			const camera: Camera = { x: 100, y: -50, scale: 1.5 };
			const op = createSetCameraOp('scene-1', 'client-1', camera);

			expect(op.type).toBe('setCamera');
			expect(op.camera).toEqual(camera);
			expect(op.opId).toBeTruthy();
		});
	});

	describe('Operation type discrimination', () => {
		it('should discriminate AddShapesOp', () => {
			const op: Operation = createAddShapesOp('s', 'c', []);
			if (op.type === 'addShapes') {
				expect(op.shapes).toEqual([]);
			} else {
				throw new Error('Type discrimination failed');
			}
		});

		it('should discriminate UpdateShapesOp', () => {
			const op: Operation = createUpdateShapesOp('s', 'c', []);
			if (op.type === 'updateShapes') {
				expect(op.shapes).toEqual([]);
			} else {
				throw new Error('Type discrimination failed');
			}
		});

		it('should discriminate DeleteShapesOp', () => {
			const op: Operation = createDeleteShapesOp('s', 'c', ['id1']);
			if (op.type === 'deleteShapes') {
				expect(op.ids).toEqual(['id1']);
			} else {
				throw new Error('Type discrimination failed');
			}
		});

		it('should discriminate SetCameraOp', () => {
			const camera: Camera = { x: 0, y: 0, scale: 1 };
			const op: Operation = createSetCameraOp('s', 'c', camera);
			if (op.type === 'setCamera') {
				expect(op.camera).toEqual(camera);
			} else {
				throw new Error('Type discrimination failed');
			}
		});
	});

	describe('Presence type', () => {
		it('should support minimal presence', () => {
			const presence: Presence = {
				clientId: 'client-1',
				sceneId: 'scene-1',
				lastSeen: Date.now()
			};

			expect(presence.clientId).toBe('client-1');
			expect(presence.sceneId).toBe('scene-1');
			expect(presence.cursor).toBeUndefined();
		});

		it('should support full presence', () => {
			const presence: Presence = {
				clientId: 'client-1',
				userId: 'user-1',
				sceneId: 'scene-1',
				cursor: { x: 100, y: 200 },
				selectedIds: ['shape-1', 'shape-2'],
				color: '#ff0000',
				name: 'Alice',
				lastSeen: Date.now()
			};

			expect(presence.cursor).toEqual({ x: 100, y: 200 });
			expect(presence.selectedIds).toHaveLength(2);
			expect(presence.color).toBe('#ff0000');
			expect(presence.name).toBe('Alice');
		});
	});

	describe('ClientMessage types', () => {
		it('should support join message', () => {
			const msg: ClientMessage = {
				type: 'join',
				sceneId: 'scene-1',
				clientId: 'client-1',
				userId: 'user-1',
				name: 'Bob'
			};

			expect(msg.type).toBe('join');
		});

		it('should support leave message', () => {
			const msg: ClientMessage = {
				type: 'leave',
				sceneId: 'scene-1',
				clientId: 'client-1'
			};

			expect(msg.type).toBe('leave');
		});

		it('should support operation message', () => {
			const op = createAddShapesOp('scene', 'client', []);
			const msg: ClientMessage = {
				type: 'operation',
				operation: op
			};

			expect(msg.type).toBe('operation');
			expect(msg.operation).toBe(op);
		});

		it('should support presence message', () => {
			const presence: Presence = {
				clientId: 'client-1',
				sceneId: 'scene-1',
				cursor: { x: 50, y: 50 },
				lastSeen: Date.now()
			};
			const msg: ClientMessage = {
				type: 'presence',
				presence
			};

			expect(msg.type).toBe('presence');
			expect(msg.presence.cursor).toEqual({ x: 50, y: 50 });
		});
	});

	describe('ServerMessage types', () => {
		it('should support server operation message', () => {
			const op = createUpdateShapesOp('scene', 'client', []);
			const msg: ServerMessage = {
				type: 'operation',
				operation: op
			};

			expect(msg.type).toBe('operation');
		});

		it('should support server presence message', () => {
			const msg: ServerMessage = {
				type: 'presence',
				presence: {
					clientId: 'c1',
					sceneId: 's1',
					cursor: { x: 10, y: 20 },
					lastSeen: Date.now()
				}
			};

			expect(msg.type).toBe('presence');
		});

		it('should support presence list message', () => {
			const msg: ServerMessage = {
				type: 'presenceList',
				presences: [
					{ clientId: 'c1', sceneId: 's1', lastSeen: Date.now() },
					{ clientId: 'c2', sceneId: 's1', lastSeen: Date.now() }
				]
			};

			expect(msg.presences).toHaveLength(2);
		});

		it('should support joined message', () => {
			const msg: ServerMessage = {
				type: 'joined',
				clientId: 'client-1',
				sceneId: 'scene-1'
			};

			expect(msg.type).toBe('joined');
		});

		it('should support userJoined message', () => {
			const msg: ServerMessage = {
				type: 'userJoined',
				presence: {
					clientId: 'c1',
					sceneId: 's1',
					name: 'Charlie',
					lastSeen: Date.now()
				}
			};

			expect(msg.type).toBe('userJoined');
		});

		it('should support userLeft message', () => {
			const msg: ServerMessage = {
				type: 'userLeft',
				clientId: 'client-1'
			};

			expect(msg.type).toBe('userLeft');
		});

		it('should support error message', () => {
			const msg: ServerMessage = {
				type: 'error',
				message: 'Scene not found',
				code: 'SCENE_NOT_FOUND'
			};

			expect(msg.type).toBe('error');
			expect(msg.message).toBe('Scene not found');
			expect(msg.code).toBe('SCENE_NOT_FOUND');
		});
	});
});
