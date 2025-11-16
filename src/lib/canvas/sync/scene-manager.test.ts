// src/lib/canvas/sync/scene-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneManager } from './scene-manager';
import type { SceneData, Shape, RectShape } from '../model/shapes';
import type { AddShapesOp, UpdateShapesOp, DeleteShapesOp, SetCameraOp } from './types';

describe('SceneManager', () => {
	let manager: SceneManager;
	let loadScene: ReturnType<typeof vi.fn>;
	let saveScene: ReturnType<typeof vi.fn>;

	const createRect = (id: string, x = 0, y = 0): RectShape => ({
		id,
		type: 'rect',
		x,
		y,
		width: 100,
		height: 50
	});

	beforeEach(() => {
		loadScene = vi.fn();
		saveScene = vi.fn().mockResolvedValue(undefined);

		manager = new SceneManager({
			loadScene,
			saveScene
		});
	});

	describe('applyOperation - addShapes', () => {
		it('should load scene from database on first operation', async () => {
			const existingScene: SceneData = {
				shapes: [createRect('rect-1')]
			};
			loadScene.mockResolvedValue(existingScene);

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-2')]
			};

			await manager.applyOperation('scene-1', op);

			expect(loadScene).toHaveBeenCalledWith('scene-1');
			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(2);
		});

		it('should add shapes to existing scene', async () => {
			loadScene.mockResolvedValue({ shapes: [createRect('rect-1')] });

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-2'), createRect('rect-3')]
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(3);
			expect(data?.shapes.map((s) => s.id)).toEqual(['rect-1', 'rect-2', 'rect-3']);
		});

		it('should create empty scene if not found', async () => {
			loadScene.mockResolvedValue(null);

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1')]
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(1);
		});

		it('should cache scene after first load', async () => {
			loadScene.mockResolvedValue({ shapes: [] });

			const op1: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1')]
			};

			const op2: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-2',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-2')]
			};

			await manager.applyOperation('scene-1', op1);
			await manager.applyOperation('scene-1', op2);

			// Should only load once
			expect(loadScene).toHaveBeenCalledTimes(1);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(2);
		});
	});

	describe('applyOperation - updateShapes', () => {
		it('should update existing shapes', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1', 0, 0), createRect('rect-2', 50, 50)]
			});

			const op: UpdateShapesOp = {
				type: 'updateShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1', 100, 100)]
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			const rect1 = data?.shapes.find((s) => s.id === 'rect-1') as RectShape;
			expect(rect1.x).toBe(100);
			expect(rect1.y).toBe(100);
		});

		it('should not affect shapes not in update', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1', 0, 0), createRect('rect-2', 50, 50)]
			});

			const op: UpdateShapesOp = {
				type: 'updateShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1', 100, 100)]
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			const rect2 = data?.shapes.find((s) => s.id === 'rect-2') as RectShape;
			expect(rect2.x).toBe(50);
			expect(rect2.y).toBe(50);
		});

		it('should handle updating non-existent shape gracefully', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1')]
			});

			const op: UpdateShapesOp = {
				type: 'updateShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-999', 100, 100)]
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(1);
			expect(data?.shapes[0].id).toBe('rect-1');
		});
	});

	describe('applyOperation - deleteShapes', () => {
		it('should delete specified shapes', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1'), createRect('rect-2'), createRect('rect-3')]
			});

			const op: DeleteShapesOp = {
				type: 'deleteShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				ids: ['rect-2']
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(2);
			expect(data?.shapes.map((s) => s.id)).toEqual(['rect-1', 'rect-3']);
		});

		it('should handle deleting multiple shapes', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1'), createRect('rect-2'), createRect('rect-3')]
			});

			const op: DeleteShapesOp = {
				type: 'deleteShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				ids: ['rect-1', 'rect-3']
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(1);
			expect(data?.shapes[0].id).toBe('rect-2');
		});

		it('should handle deleting non-existent shape gracefully', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1')]
			});

			const op: DeleteShapesOp = {
				type: 'deleteShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				ids: ['rect-999']
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(1);
		});
	});

	describe('applyOperation - setCamera', () => {
		it('should not modify shapes for camera operation', async () => {
			loadScene.mockResolvedValue({
				shapes: [createRect('rect-1')]
			});

			const op: SetCameraOp = {
				type: 'setCamera',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				camera: { x: 100, y: 100, zoom: 2 }
			};

			await manager.applyOperation('scene-1', op);

			const data = manager.getSceneData('scene-1');
			expect(data?.shapes).toHaveLength(1);
		});
	});

	describe('dirty tracking', () => {
		it('should mark scene as dirty after operation', async () => {
			loadScene.mockResolvedValue({ shapes: [] });

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1')]
			};

			await manager.applyOperation('scene-1', op);

			expect(manager.isDirty('scene-1')).toBe(true);
		});

		it('should clear dirty flag after save', async () => {
			loadScene.mockResolvedValue({ shapes: [] });

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1')]
			};

			await manager.applyOperation('scene-1', op);
			await manager.saveScene('scene-1');

			expect(manager.isDirty('scene-1')).toBe(false);
		});

		it('should call saveScene with current data', async () => {
			loadScene.mockResolvedValue({ shapes: [createRect('rect-1')] });

			const op: AddShapesOp = {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-2')]
			};

			await manager.applyOperation('scene-1', op);
			await manager.saveScene('scene-1');

			expect(saveScene).toHaveBeenCalledWith(
				'scene-1',
				expect.objectContaining({
					shapes: expect.arrayContaining([
						expect.objectContaining({ id: 'rect-1' }),
						expect.objectContaining({ id: 'rect-2' })
					])
				})
			);
		});
	});

	describe('saveDirtyScenes', () => {
		it('should save all dirty scenes', async () => {
			loadScene.mockResolvedValue({ shapes: [] });

			// Create two dirty scenes
			await manager.applyOperation('scene-1', {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-1')]
			});

			await manager.applyOperation('scene-2', {
				type: 'addShapes',
				opId: 'op-2',
				sceneId: 'scene-2',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: [createRect('rect-2')]
			});

			await manager.saveDirtyScenes();

			expect(saveScene).toHaveBeenCalledTimes(2);
			expect(manager.isDirty('scene-1')).toBe(false);
			expect(manager.isDirty('scene-2')).toBe(false);
		});
	});

	describe('cache management', () => {
		it('should clear cache for specific scene', async () => {
			loadScene.mockResolvedValue({ shapes: [createRect('rect-1')] });

			await manager.applyOperation('scene-1', {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			});

			manager.clearCache('scene-1');

			expect(manager.getSceneData('scene-1')).toBeUndefined();
			expect(manager.isDirty('scene-1')).toBe(false);
		});

		it('should reload scene after cache clear', async () => {
			loadScene.mockResolvedValue({ shapes: [] });

			await manager.applyOperation('scene-1', {
				type: 'addShapes',
				opId: 'op-1',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			});

			manager.clearCache('scene-1');

			await manager.applyOperation('scene-1', {
				type: 'addShapes',
				opId: 'op-2',
				sceneId: 'scene-1',
				clientId: 'client-1',
				timestamp: Date.now(),
				shapes: []
			});

			expect(loadScene).toHaveBeenCalledTimes(2);
		});
	});
});
