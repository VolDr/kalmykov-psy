import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { createHistoryStore } from './history';
import type { RectShape, Shape } from './shapes';

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

describe('createHistoryStore', () => {
	let store: ReturnType<typeof createHistoryStore>;

	beforeEach(() => {
		store = createHistoryStore(10);
	});

	describe('setAllShapes', () => {
		it('should set shapes without adding to history', () => {
			const shapes = [createTestRect('1'), createTestRect('2')];
			store.setAllShapes(shapes);

			const state = get(store);
			expect(state.shapes).toHaveLength(2);
			expect(state.undoStack).toHaveLength(0);
			expect(state.redoStack).toHaveLength(0);
		});
	});

	describe('addShapes', () => {
		it('should add shapes and record in history', () => {
			const rect = createTestRect('1');
			store.addShapes([rect]);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('1');
			expect(state.undoStack).toHaveLength(1);
			expect(state.undoStack[0].type).toBe('add');
			expect(state.undoStack[0].after).toEqual([rect]);
		});

		it('should clear redo stack when adding', () => {
			store.addShapes([createTestRect('1')]);
			store.undo();

			let state = get(store);
			expect(state.redoStack).toHaveLength(1);

			store.addShapes([createTestRect('2')]);
			state = get(store);
			expect(state.redoStack).toHaveLength(0);
		});

		it('should respect maxHistory limit', () => {
			for (let i = 0; i < 15; i++) {
				store.addShapes([createTestRect(`${i}`)]);
			}

			const state = get(store);
			expect(state.undoStack).toHaveLength(10);
		});
	});

	describe('updateShapes', () => {
		it('should update existing shapes', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);

			const updated = { ...rect, x: 100, y: 200 };
			store.updateShapes([updated]);

			const state = get(store);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[0].y).toBe(200);
			expect(state.undoStack).toHaveLength(2);
			expect(state.undoStack[1].type).toBe('update');
		});

		it('should not modify state if shape not found', () => {
			store.addShapes([createTestRect('1')]);
			const nonExistent = createTestRect('999', 100, 100);
			store.updateShapes([nonExistent]);

			const state = get(store);
			expect(state.undoStack).toHaveLength(1);
		});

		it('should record before and after states', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);

			const updated = { ...rect, x: 50 };
			store.updateShapes([updated]);

			const state = get(store);
			const entry = state.undoStack[1];
			expect(entry.before[0].x).toBe(0);
			expect(entry.after[0].x).toBe(50);
		});
	});

	describe('deleteShapes', () => {
		it('should delete shapes by id', () => {
			store.addShapes([createTestRect('1'), createTestRect('2')]);
			store.deleteShapes(['1']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('2');
		});

		it('should record deleted shapes in history', () => {
			const rect = createTestRect('1');
			store.addShapes([rect]);
			store.deleteShapes(['1']);

			const state = get(store);
			expect(state.undoStack[1].type).toBe('delete');
			expect(state.undoStack[1].before).toEqual([rect]);
		});

		it('should not modify state if no shapes match', () => {
			store.addShapes([createTestRect('1')]);
			store.deleteShapes(['999']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.undoStack).toHaveLength(1);
		});
	});

	describe('undo', () => {
		it('should undo add operation', () => {
			store.addShapes([createTestRect('1')]);
			store.undo();

			const state = get(store);
			expect(state.shapes).toHaveLength(0);
			expect(state.undoStack).toHaveLength(0);
			expect(state.redoStack).toHaveLength(1);
		});

		it('should undo delete operation', () => {
			store.addShapes([createTestRect('1')]);
			store.deleteShapes(['1']);
			store.undo();

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('1');
		});

		it('should undo update operation', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);
			store.updateShapes([{ ...rect, x: 100 }]);
			store.undo();

			const state = get(store);
			expect(state.shapes[0].x).toBe(0);
		});

		it('should do nothing if undo stack is empty', () => {
			store.undo();
			const state = get(store);
			expect(state.shapes).toHaveLength(0);
		});
	});

	describe('redo', () => {
		it('should redo add operation', () => {
			store.addShapes([createTestRect('1')]);
			store.undo();
			store.redo();

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('1');
		});

		it('should redo delete operation', () => {
			store.addShapes([createTestRect('1')]);
			store.deleteShapes(['1']);
			store.undo();
			store.redo();

			const state = get(store);
			expect(state.shapes).toHaveLength(0);
		});

		it('should redo update operation', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);
			store.updateShapes([{ ...rect, x: 100 }]);
			store.undo();
			store.redo();

			const state = get(store);
			expect(state.shapes[0].x).toBe(100);
		});

		it('should do nothing if redo stack is empty', () => {
			store.addShapes([createTestRect('1')]);
			store.redo();

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
		});

		it('should move entry back to undo stack', () => {
			store.addShapes([createTestRect('1')]);
			store.undo();
			store.redo();

			const state = get(store);
			expect(state.undoStack).toHaveLength(1);
			expect(state.redoStack).toHaveLength(0);
		});
	});

	describe('complex scenarios', () => {
		it('should handle multiple undo/redo cycles', () => {
			store.addShapes([createTestRect('1')]);
			store.addShapes([createTestRect('2')]);
			store.addShapes([createTestRect('3')]);

			store.undo(); // Remove 3
			store.undo(); // Remove 2

			let state = get(store);
			expect(state.shapes).toHaveLength(1);

			store.redo(); // Add back 2
			state = get(store);
			expect(state.shapes).toHaveLength(2);

			store.addShapes([createTestRect('4')]);
			state = get(store);
			expect(state.redoStack).toHaveLength(0);
			expect(state.shapes).toHaveLength(3);
		});
	});

	describe('applyRemoteAdd', () => {
		it('should add shapes without history entry', () => {
			const rect = createTestRect('1');
			store.applyRemoteAdd([rect]);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('1');
			expect(state.undoStack).toHaveLength(0);
			expect(state.redoStack).toHaveLength(0);
		});

		it('should preserve existing history', () => {
			store.addShapes([createTestRect('1')]); // Creates history entry

			const state1 = get(store);
			expect(state1.undoStack).toHaveLength(1);

			store.applyRemoteAdd([createTestRect('2')]); // No history entry

			const state2 = get(store);
			expect(state2.shapes).toHaveLength(2);
			expect(state2.undoStack).toHaveLength(1); // Still only 1 entry
		});

		it('should add multiple shapes', () => {
			store.applyRemoteAdd([createTestRect('1'), createTestRect('2'), createTestRect('3')]);

			const state = get(store);
			expect(state.shapes).toHaveLength(3);
			expect(state.undoStack).toHaveLength(0);
		});

		it('should preserve redo stack', () => {
			store.addShapes([createTestRect('1')]);
			store.undo();

			const state1 = get(store);
			expect(state1.redoStack).toHaveLength(1);

			store.applyRemoteAdd([createTestRect('2')]);

			const state2 = get(store);
			expect(state2.shapes).toHaveLength(1);
			expect(state2.redoStack).toHaveLength(1);
		});
	});

	describe('applyRemoteUpdate', () => {
		it('should update shapes without history entry', () => {
			const rect = createTestRect('1', 0, 0);
			store.setAllShapes([rect]);

			store.applyRemoteUpdate([{ ...rect, x: 100, y: 200 }]);

			const state = get(store);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[0].y).toBe(200);
			expect(state.undoStack).toHaveLength(0);
		});

		it('should preserve existing history', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]); // History entry

			store.applyRemoteUpdate([{ ...rect, x: 50 }]); // No history entry

			const state = get(store);
			expect(state.shapes[0].x).toBe(50);
			expect(state.undoStack).toHaveLength(1);
		});

		it('should update multiple shapes', () => {
			const rect1 = createTestRect('1', 0, 0);
			const rect2 = createTestRect('2', 10, 10);
			store.setAllShapes([rect1, rect2]);

			store.applyRemoteUpdate([
				{ ...rect1, x: 100 },
				{ ...rect2, y: 200 }
			]);

			const state = get(store);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[1].y).toBe(200);
		});

		it('should ignore non-existent shapes', () => {
			const rect = createTestRect('1', 0, 0);
			store.setAllShapes([rect]);

			store.applyRemoteUpdate([createTestRect('non-existent', 999, 999)]);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('1');
			expect(state.shapes[0].x).toBe(0);
		});
	});

	describe('applyRemoteDelete', () => {
		it('should delete shapes without history entry', () => {
			store.setAllShapes([createTestRect('1'), createTestRect('2')]);

			store.applyRemoteDelete(['1']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('2');
			expect(state.undoStack).toHaveLength(0);
		});

		it('should preserve existing history', () => {
			store.addShapes([createTestRect('1'), createTestRect('2')]);

			store.applyRemoteDelete(['2']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.undoStack).toHaveLength(1);
		});

		it('should delete multiple shapes', () => {
			store.setAllShapes([createTestRect('1'), createTestRect('2'), createTestRect('3')]);

			store.applyRemoteDelete(['1', '3']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('2');
		});

		it('should ignore non-existent IDs', () => {
			store.setAllShapes([createTestRect('1')]);

			store.applyRemoteDelete(['non-existent']);

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
		});

		it('should preserve redo stack', () => {
			store.addShapes([createTestRect('1'), createTestRect('2')]);
			store.undo();

			store.applyRemoteDelete(['2']);

			const state = get(store);
			expect(state.redoStack).toHaveLength(1);
		});
	});

	describe('remote operations isolation', () => {
		it('should not affect local undo after remote add', () => {
			store.addShapes([createTestRect('local-1')]);
			store.applyRemoteAdd([createTestRect('remote-1')]);

			store.undo(); // Should only undo local add

			const state = get(store);
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('remote-1');
		});

		it('should not affect local undo after remote update', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);
			store.updateShapes([{ ...rect, x: 50 }]);
			store.applyRemoteUpdate([{ ...rect, x: 100 }]);

			store.undo(); // Should undo local update to x=50, but remote set x=100

			const state = get(store);
			// After undo, we revert x back to 0 (from local update), but the shape was remotely set to x=100
			// Since we're reverting based on before state of local operation, x becomes 0
			expect(state.shapes[0].x).toBe(0);
		});

		it('should not affect local undo after remote delete', () => {
			store.addShapes([createTestRect('local-1')]);
			store.addShapes([createTestRect('local-2')]);
			store.applyRemoteDelete(['local-2']);

			store.undo(); // Should only undo second local add

			const state = get(store);
			// After undo, we try to remove local-2, but it's already gone
			// The operation still removes it from the 'after' list
			expect(state.shapes).toHaveLength(1);
			expect(state.shapes[0].id).toBe('local-1');
		});
	});

	describe('shape transformation (resize + rotate)', () => {
		it('should update shape dimensions (resize)', () => {
			const rect = createTestRect('1', 50, 50);
			store.addShapes([rect]);

			const resized = { ...rect, width: 200, height: 100 };
			store.updateShapes([resized]);

			const state = get(store);
			const shape = state.shapes[0] as RectShape;
			expect(shape.width).toBe(200);
			expect(shape.height).toBe(100);
			expect(state.undoStack[1].type).toBe('update');
		});

		it('should update shape rotation', () => {
			const rect = createTestRect('1', 50, 50);
			store.addShapes([rect]);

			const rotated = { ...rect, rotation: 45 };
			store.updateShapes([rotated]);

			const state = get(store);
			expect(state.shapes[0].rotation).toBe(45);
		});

		it('should update multiple transformation properties at once', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);

			const transformed = {
				...rect,
				x: 100,
				y: 100,
				width: 150,
				height: 75,
				rotation: 30
			};
			store.updateShapes([transformed]);

			const state = get(store);
			const shape = state.shapes[0] as RectShape;
			expect(shape.x).toBe(100);
			expect(shape.y).toBe(100);
			expect(shape.width).toBe(150);
			expect(shape.height).toBe(75);
			expect(shape.rotation).toBe(30);
		});

		it('should undo transformation correctly', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);

			const transformed = { ...rect, width: 200, height: 100, rotation: 45 };
			store.updateShapes([transformed]);

			store.undo();

			const state = get(store);
			const shape = state.shapes[0] as RectShape;
			expect(shape.width).toBe(100);
			expect(shape.height).toBe(50);
			expect(shape.rotation).toBe(0);
		});

		it('should redo transformation correctly', () => {
			const rect = createTestRect('1', 0, 0);
			store.addShapes([rect]);

			const transformed = { ...rect, width: 200, rotation: 90 };
			store.updateShapes([transformed]);
			store.undo();
			store.redo();

			const state = get(store);
			const shape = state.shapes[0] as RectShape;
			expect(shape.width).toBe(200);
			expect(shape.rotation).toBe(90);
		});

		it('should transform multiple shapes at once', () => {
			const rect1 = createTestRect('1', 0, 0);
			const rect2 = createTestRect('2', 100, 100);
			store.addShapes([rect1, rect2]);

			const transformed = [
				{ ...rect1, width: 200, rotation: 15 },
				{ ...rect2, width: 200, rotation: 15 }
			];
			store.updateShapes(transformed);

			const state = get(store);
			const shape1 = state.shapes[0] as RectShape;
			const shape2 = state.shapes[1] as RectShape;
			expect(shape1.width).toBe(200);
			expect(shape1.rotation).toBe(15);
			expect(shape2.width).toBe(200);
			expect(shape2.rotation).toBe(15);
		});

		it('should handle remote transformation updates', () => {
			const rect = createTestRect('1', 0, 0);
			store.setAllShapes([rect]);

			const remoteTransformed = { ...rect, width: 300, rotation: 60 };
			store.applyRemoteUpdate([remoteTransformed]);

			const state = get(store);
			const shape = state.shapes[0] as RectShape;
			expect(shape.width).toBe(300);
			expect(shape.rotation).toBe(60);
			expect(state.undoStack).toHaveLength(0); // Remote ops don't add to undo
		});
	});
});
