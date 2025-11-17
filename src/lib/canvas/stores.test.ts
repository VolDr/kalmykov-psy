import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	shapesHistory,
	selection,
	camera,
	setSelection,
	toggleSelection,
	clearSelection,
	currentTool,
	setTool,
	getToolCursor
} from './stores';

describe('canvas stores', () => {
	beforeEach(() => {
		// Reset stores to initial state
		selection.set({ ids: new Set() });
		camera.set({ x: 0, y: 0, scale: 1 });
	});

	describe('selection store', () => {
		describe('setSelection', () => {
			it('should set selection from array of ids', () => {
				setSelection(['id1', 'id2', 'id3']);
				const state = get(selection);
				expect(state.ids.size).toBe(3);
				expect(state.ids.has('id1')).toBe(true);
				expect(state.ids.has('id2')).toBe(true);
				expect(state.ids.has('id3')).toBe(true);
			});

			it('should replace existing selection', () => {
				setSelection(['id1']);
				setSelection(['id2', 'id3']);
				const state = get(selection);
				expect(state.ids.size).toBe(2);
				expect(state.ids.has('id1')).toBe(false);
				expect(state.ids.has('id2')).toBe(true);
			});

			it('should handle empty array', () => {
				setSelection(['id1', 'id2']);
				setSelection([]);
				const state = get(selection);
				expect(state.ids.size).toBe(0);
			});

			it('should handle duplicate ids', () => {
				setSelection(['id1', 'id1', 'id2']);
				const state = get(selection);
				expect(state.ids.size).toBe(2);
			});
		});

		describe('toggleSelection', () => {
			describe('single selection mode (multi=false)', () => {
				it('should select single item', () => {
					toggleSelection('id1', false);
					const state = get(selection);
					expect(state.ids.size).toBe(1);
					expect(state.ids.has('id1')).toBe(true);
				});

				it('should replace selection with new item', () => {
					toggleSelection('id1', false);
					toggleSelection('id2', false);
					const state = get(selection);
					expect(state.ids.size).toBe(1);
					expect(state.ids.has('id2')).toBe(true);
					expect(state.ids.has('id1')).toBe(false);
				});

				it('should deselect if clicking same item when only one selected', () => {
					toggleSelection('id1', false);
					toggleSelection('id1', false);
					const state = get(selection);
					expect(state.ids.size).toBe(0);
				});

				it('should select item if already selected with multiple items', () => {
					setSelection(['id1', 'id2', 'id3']);
					toggleSelection('id2', false);
					const state = get(selection);
					expect(state.ids.size).toBe(1);
					expect(state.ids.has('id2')).toBe(true);
				});
			});

			describe('multi selection mode (multi=true)', () => {
				it('should add to existing selection', () => {
					toggleSelection('id1', true);
					toggleSelection('id2', true);
					const state = get(selection);
					expect(state.ids.size).toBe(2);
					expect(state.ids.has('id1')).toBe(true);
					expect(state.ids.has('id2')).toBe(true);
				});

				it('should remove if already selected', () => {
					toggleSelection('id1', true);
					toggleSelection('id2', true);
					toggleSelection('id1', true);
					const state = get(selection);
					expect(state.ids.size).toBe(1);
					expect(state.ids.has('id2')).toBe(true);
				});

				it('should toggle multiple items independently', () => {
					toggleSelection('id1', true);
					toggleSelection('id2', true);
					toggleSelection('id3', true);
					toggleSelection('id2', true);

					const state = get(selection);
					expect(state.ids.size).toBe(2);
					expect(state.ids.has('id1')).toBe(true);
					expect(state.ids.has('id3')).toBe(true);
					expect(state.ids.has('id2')).toBe(false);
				});
			});
		});

		describe('clearSelection', () => {
			it('should clear all selections', () => {
				setSelection(['id1', 'id2', 'id3']);
				clearSelection();
				const state = get(selection);
				expect(state.ids.size).toBe(0);
			});

			it('should be safe to call when already empty', () => {
				clearSelection();
				const state = get(selection);
				expect(state.ids.size).toBe(0);
			});
		});
	});

	describe('camera store', () => {
		it('should have default values', () => {
			const cam = get(camera);
			expect(cam.x).toBe(0);
			expect(cam.y).toBe(0);
			expect(cam.scale).toBe(1);
		});

		it('should update position', () => {
			camera.set({ x: 100, y: 200, scale: 1 });
			const cam = get(camera);
			expect(cam.x).toBe(100);
			expect(cam.y).toBe(200);
		});

		it('should update scale', () => {
			camera.set({ x: 0, y: 0, scale: 2.5 });
			const cam = get(camera);
			expect(cam.scale).toBe(2.5);
		});

		it('should handle negative positions', () => {
			camera.set({ x: -100, y: -200, scale: 0.5 });
			const cam = get(camera);
			expect(cam.x).toBe(-100);
			expect(cam.y).toBe(-200);
			expect(cam.scale).toBe(0.5);
		});

		it('should update partially using update function', () => {
			camera.set({ x: 10, y: 20, scale: 1.5 });
			camera.update((c) => ({ ...c, x: c.x + 50 }));
			const cam = get(camera);
			expect(cam.x).toBe(60);
			expect(cam.y).toBe(20);
			expect(cam.scale).toBe(1.5);
		});
	});

	describe('shapesHistory store', () => {
		it('should be initialized', () => {
			const state = get(shapesHistory);
			expect(state).toBeDefined();
			expect(Array.isArray(state.shapes)).toBe(true);
			expect(Array.isArray(state.undoStack)).toBe(true);
			expect(Array.isArray(state.redoStack)).toBe(true);
		});

		it('should expose history methods', () => {
			expect(typeof shapesHistory.addShapes).toBe('function');
			expect(typeof shapesHistory.updateShapes).toBe('function');
			expect(typeof shapesHistory.deleteShapes).toBe('function');
			expect(typeof shapesHistory.undo).toBe('function');
			expect(typeof shapesHistory.redo).toBe('function');
			expect(typeof shapesHistory.setAllShapes).toBe('function');
		});
	});

	describe('currentTool store', () => {
		beforeEach(() => {
			setTool('select');
		});

		it('should initialize with select tool', () => {
			const tool = get(currentTool);
			expect(tool).toBe('select');
		});

		describe('setTool', () => {
			it('should set tool to rect', () => {
				setTool('rect');
				const tool = get(currentTool);
				expect(tool).toBe('rect');
			});

			it('should set tool to ellipse', () => {
				setTool('ellipse');
				const tool = get(currentTool);
				expect(tool).toBe('ellipse');
			});

			it('should set tool to arrow', () => {
				setTool('arrow');
				const tool = get(currentTool);
				expect(tool).toBe('arrow');
			});

			it('should set tool to text', () => {
				setTool('text');
				const tool = get(currentTool);
				expect(tool).toBe('text');
			});

			it('should set tool to pan', () => {
				setTool('pan');
				const tool = get(currentTool);
				expect(tool).toBe('pan');
			});

			it('should switch between tools', () => {
				setTool('rect');
				expect(get(currentTool)).toBe('rect');
				setTool('ellipse');
				expect(get(currentTool)).toBe('ellipse');
				setTool('select');
				expect(get(currentTool)).toBe('select');
			});
		});

		describe('getToolCursor', () => {
			it('should return default cursor for select tool', () => {
				expect(getToolCursor('select')).toBe('default');
			});

			it('should return crosshair cursor for rect tool', () => {
				expect(getToolCursor('rect')).toBe('crosshair');
			});

			it('should return crosshair cursor for ellipse tool', () => {
				expect(getToolCursor('ellipse')).toBe('crosshair');
			});

			it('should return crosshair cursor for arrow tool', () => {
				expect(getToolCursor('arrow')).toBe('crosshair');
			});

			it('should return crosshair cursor for text tool', () => {
				expect(getToolCursor('text')).toBe('crosshair');
			});

			it('should return grab cursor for pan tool', () => {
				expect(getToolCursor('pan')).toBe('grab');
			});
		});
	});
});
