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
});
