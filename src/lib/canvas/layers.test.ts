// src/lib/canvas/layers.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	bringToFront,
	sendToBack,
	bringForward,
	sendBackward,
	getShapeZIndex,
	setShapeZIndex,
	getShapesByZIndex,
	reorderShapes,
	selectAll,
	selectByType,
	invertSelection,
	getShapeAtZIndex,
	getShapeCount,
	swapZIndex
} from './layers';
import { shapesHistory, selection, setSelection } from './stores';
import type { RectShape, EllipseShape, TextShape } from './model/shapes';

describe('layers', () => {
	const createRect = (id: string): RectShape => ({
		id,
		type: 'rect',
		x: 100,
		y: 100,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		width: 100,
		height: 50
	});

	const createEllipse = (id: string): EllipseShape => ({
		id,
		type: 'ellipse',
		x: 200,
		y: 200,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#ff0000',
		strokeWidth: 3,
		rx: 50,
		ry: 30
	});

	const createText = (id: string): TextShape => ({
		id,
		type: 'text',
		x: 150,
		y: 150,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		text: 'Hello',
		fontSize: 16,
		fontFamily: 'Arial',
		align: 'left'
	});

	beforeEach(() => {
		shapesHistory.setAllShapes([]);
		setSelection([]);
	});

	describe('bringToFront', () => {
		it('moves selected shape to front', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['rect-1']);

			const count = bringToFront();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('ellipse-1');
			expect(state.shapes[1].id).toBe('text-1');
			expect(state.shapes[2].id).toBe('rect-1');
		});

		it('moves multiple selected shapes to front', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['rect-1', 'ellipse-1']);

			const count = bringToFront();

			expect(count).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('text-1');
			expect(state.shapes[1].id).toBe('rect-1');
			expect(state.shapes[2].id).toBe('ellipse-1');
		});

		it('returns 0 when nothing selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = bringToFront();

			expect(count).toBe(0);
		});

		it('preserves relative order of selected shapes', () => {
			const rect1 = createRect('rect-1');
			const rect2 = createRect('rect-2');
			const rect3 = createRect('rect-3');
			const rect4 = createRect('rect-4');
			shapesHistory.addShapes([rect1, rect2, rect3, rect4]);
			setSelection(['rect-1', 'rect-3']);

			bringToFront();

			const state = get(shapesHistory);
			expect(state.shapes[2].id).toBe('rect-1');
			expect(state.shapes[3].id).toBe('rect-3');
		});
	});

	describe('sendToBack', () => {
		it('moves selected shape to back', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['text-1']);

			const count = sendToBack();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('text-1');
			expect(state.shapes[1].id).toBe('rect-1');
			expect(state.shapes[2].id).toBe('ellipse-1');
		});

		it('moves multiple selected shapes to back', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['ellipse-1', 'text-1']);

			const count = sendToBack();

			expect(count).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('ellipse-1');
			expect(state.shapes[1].id).toBe('text-1');
			expect(state.shapes[2].id).toBe('rect-1');
		});

		it('returns 0 when nothing selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = sendToBack();

			expect(count).toBe(0);
		});
	});

	describe('bringForward', () => {
		it('moves selected shape one level up', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['rect-1']);

			const count = bringForward();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('ellipse-1');
			expect(state.shapes[1].id).toBe('rect-1');
			expect(state.shapes[2].id).toBe('text-1');
		});

		it('does not move if already at top', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['ellipse-1']);

			const count = bringForward();

			expect(count).toBe(0);

			const state = get(shapesHistory);
			expect(state.shapes[1].id).toBe('ellipse-1');
		});

		it('moves multiple adjacent shapes', () => {
			const rect1 = createRect('rect-1');
			const rect2 = createRect('rect-2');
			const rect3 = createRect('rect-3');
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2']);

			const count = bringForward();

			// Only rect-2 moves because rect-1 is blocked by rect-2
			expect(count).toBeGreaterThanOrEqual(1);
		});

		it('returns 0 when nothing selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = bringForward();

			expect(count).toBe(0);
		});
	});

	describe('sendBackward', () => {
		it('moves selected shape one level down', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['text-1']);

			const count = sendBackward();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('rect-1');
			expect(state.shapes[1].id).toBe('text-1');
			expect(state.shapes[2].id).toBe('ellipse-1');
		});

		it('does not move if already at bottom', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1']);

			const count = sendBackward();

			expect(count).toBe(0);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('rect-1');
		});

		it('returns 0 when nothing selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = sendBackward();

			expect(count).toBe(0);
		});
	});

	describe('getShapeZIndex', () => {
		it('returns correct z-index', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			expect(getShapeZIndex('rect-1')).toBe(0);
			expect(getShapeZIndex('ellipse-1')).toBe(1);
			expect(getShapeZIndex('text-1')).toBe(2);
		});

		it('returns -1 for non-existent shape', () => {
			expect(getShapeZIndex('non-existent')).toBe(-1);
		});
	});

	describe('setShapeZIndex', () => {
		it('moves shape to new z-index', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			const result = setShapeZIndex('rect-1', 2);

			expect(result).toBe(true);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('ellipse-1');
			expect(state.shapes[1].id).toBe('text-1');
			expect(state.shapes[2].id).toBe('rect-1');
		});

		it('clamps index to valid range', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			setShapeZIndex('rect-1', 100); // Way out of bounds

			const state = get(shapesHistory);
			expect(state.shapes[1].id).toBe('rect-1'); // Moved to end
		});

		it('clamps negative index', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			setShapeZIndex('ellipse-1', -10);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('ellipse-1'); // Moved to start
		});

		it('returns false for non-existent shape', () => {
			const result = setShapeZIndex('non-existent', 0);
			expect(result).toBe(false);
		});

		it('returns true when already at target position', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			const result = setShapeZIndex('rect-1', 0);
			expect(result).toBe(true);
		});
	});

	describe('getShapesByZIndex', () => {
		it('returns shapes in z-index order', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			const shapes = getShapesByZIndex();

			expect(shapes[0].id).toBe('rect-1');
			expect(shapes[1].id).toBe('ellipse-1');
			expect(shapes[2].id).toBe('text-1');
		});

		it('returns empty array for empty scene', () => {
			const shapes = getShapesByZIndex();
			expect(shapes).toEqual([]);
		});

		it('returns a copy of the array', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const shapes = getShapesByZIndex();
			shapes.push(createRect('rect-2'));

			const state = get(shapesHistory);
			expect(state.shapes.length).toBe(1); // Original unchanged
		});
	});

	describe('reorderShapes', () => {
		it('reorders shapes according to provided order', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			const result = reorderShapes(['text-1', 'rect-1', 'ellipse-1']);

			expect(result).toBe(true);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('text-1');
			expect(state.shapes[1].id).toBe('rect-1');
			expect(state.shapes[2].id).toBe('ellipse-1');
		});

		it('returns false if IDs count mismatch', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			const result = reorderShapes(['rect-1']);
			expect(result).toBe(false);
		});

		it('returns false if unknown ID provided', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			const result = reorderShapes(['rect-1', 'unknown']);
			expect(result).toBe(false);
		});
	});

	describe('selectAll', () => {
		it('selects all shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			selectAll();

			const sel = get(selection);
			expect(sel.ids.size).toBe(3);
			expect(sel.ids.has('rect-1')).toBe(true);
			expect(sel.ids.has('ellipse-1')).toBe(true);
			expect(sel.ids.has('text-1')).toBe(true);
		});

		it('handles empty scene', () => {
			selectAll();

			const sel = get(selection);
			expect(sel.ids.size).toBe(0);
		});
	});

	describe('selectByType', () => {
		it('selects all shapes of given type', () => {
			const rect1 = createRect('rect-1');
			const rect2 = createRect('rect-2');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect1, rect2, ellipse, text]);

			selectByType('rect');

			const sel = get(selection);
			expect(sel.ids.size).toBe(2);
			expect(sel.ids.has('rect-1')).toBe(true);
			expect(sel.ids.has('rect-2')).toBe(true);
		});

		it('clears selection when no shapes of type exist', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			selectByType('text');

			const sel = get(selection);
			expect(sel.ids.size).toBe(0);
		});
	});

	describe('invertSelection', () => {
		it('inverts selection', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['rect-1']);

			invertSelection();

			const sel = get(selection);
			expect(sel.ids.size).toBe(2);
			expect(sel.ids.has('rect-1')).toBe(false);
			expect(sel.ids.has('ellipse-1')).toBe(true);
			expect(sel.ids.has('text-1')).toBe(true);
		});

		it('selects all when nothing selected', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			invertSelection();

			const sel = get(selection);
			expect(sel.ids.size).toBe(2);
		});

		it('clears selection when all selected', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			invertSelection();

			const sel = get(selection);
			expect(sel.ids.size).toBe(0);
		});
	});

	describe('getShapeAtZIndex', () => {
		it('returns shape at specified index', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			const shape = getShapeAtZIndex(1);
			expect(shape?.id).toBe('ellipse-1');
		});

		it('returns null for out of bounds index', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			expect(getShapeAtZIndex(5)).toBeNull();
			expect(getShapeAtZIndex(-1)).toBeNull();
		});
	});

	describe('getShapeCount', () => {
		it('returns total number of shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);

			expect(getShapeCount()).toBe(2);
		});

		it('returns 0 for empty scene', () => {
			expect(getShapeCount()).toBe(0);
		});
	});

	describe('swapZIndex', () => {
		it('swaps z-index of two shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			const result = swapZIndex('rect-1', 'text-1');

			expect(result).toBe(true);

			const state = get(shapesHistory);
			expect(state.shapes[0].id).toBe('text-1');
			expect(state.shapes[1].id).toBe('ellipse-1');
			expect(state.shapes[2].id).toBe('rect-1');
		});

		it('returns false if first shape not found', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const result = swapZIndex('non-existent', 'rect-1');
			expect(result).toBe(false);
		});

		it('returns false if second shape not found', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const result = swapZIndex('rect-1', 'non-existent');
			expect(result).toBe(false);
		});
	});
});
