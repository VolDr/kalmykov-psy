// src/lib/canvas/alignment.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	alignLeft,
	alignRight,
	alignCenterHorizontal,
	alignTop,
	alignBottom,
	alignCenterVertical,
	distributeHorizontally,
	distributeVertically,
	canAlign,
	canDistribute
} from './alignment';
import { shapesHistory, setSelection } from './stores';
import type { RectShape, EllipseShape } from './model/shapes';

describe('alignment', () => {
	const createRect = (id: string, x: number, y: number, width = 100, height = 50): RectShape => ({
		id,
		type: 'rect',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		width,
		height
	});

	const createEllipse = (id: string, x: number, y: number, rx = 50, ry = 30): EllipseShape => ({
		id,
		type: 'ellipse',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#ff0000',
		strokeWidth: 3,
		rx,
		ry
	});

	beforeEach(() => {
		shapesHistory.setAllShapes([]);
		setSelection([]);
	});

	describe('alignLeft', () => {
		it('aligns shapes to leftmost edge', () => {
			const rect1 = createRect('rect-1', 100, 100);
			const rect2 = createRect('rect-2', 200, 150);
			const rect3 = createRect('rect-3', 300, 200);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			const count = alignLeft();

			expect(count).toBe(2); // rect2 and rect3 moved

			const state = get(shapesHistory);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[1].x).toBe(100);
			expect(state.shapes[2].x).toBe(100);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignLeft();

			expect(count).toBe(0);
		});

		it('handles ellipse shapes (center-based)', () => {
			const rect = createRect('rect-1', 100, 100);
			const ellipse = createEllipse('ellipse-1', 300, 150, 50, 30);
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			alignLeft();

			const state = get(shapesHistory);
			const updatedEllipse = state.shapes[1] as EllipseShape;
			// Ellipse left edge should be at 100, so center at 150
			expect(updatedEllipse.x).toBe(150);
		});
	});

	describe('alignRight', () => {
		it('aligns shapes to rightmost edge', () => {
			const rect1 = createRect('rect-1', 100, 100, 100);
			const rect2 = createRect('rect-2', 200, 150, 100);
			const rect3 = createRect('rect-3', 300, 200, 100);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			alignRight();

			const state = get(shapesHistory);
			// Rightmost edge is at 400 (300 + 100)
			expect(state.shapes[0].x).toBe(300); // 400 - 100
			expect(state.shapes[1].x).toBe(300);
			expect(state.shapes[2].x).toBe(300);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignRight();

			expect(count).toBe(0);
		});
	});

	describe('alignCenterHorizontal', () => {
		it('aligns shapes to average horizontal center', () => {
			const rect1 = createRect('rect-1', 100, 100, 100); // center at 150
			const rect2 = createRect('rect-2', 200, 150, 100); // center at 250
			const rect3 = createRect('rect-3', 300, 200, 100); // center at 350
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			alignCenterHorizontal();

			const state = get(shapesHistory);
			// Average center: (150 + 250 + 350) / 3 = 250
			// All shapes should have x = 250 - 50 = 200
			expect(state.shapes[0].x).toBe(200);
			expect(state.shapes[1].x).toBe(200);
			expect(state.shapes[2].x).toBe(200);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignCenterHorizontal();

			expect(count).toBe(0);
		});
	});

	describe('alignTop', () => {
		it('aligns shapes to topmost edge', () => {
			const rect1 = createRect('rect-1', 100, 100);
			const rect2 = createRect('rect-2', 150, 200);
			const rect3 = createRect('rect-3', 200, 300);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			const count = alignTop();

			expect(count).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes[0].y).toBe(100);
			expect(state.shapes[1].y).toBe(100);
			expect(state.shapes[2].y).toBe(100);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignTop();

			expect(count).toBe(0);
		});
	});

	describe('alignBottom', () => {
		it('aligns shapes to bottommost edge', () => {
			const rect1 = createRect('rect-1', 100, 100, 100, 50);
			const rect2 = createRect('rect-2', 150, 200, 100, 50);
			const rect3 = createRect('rect-3', 200, 300, 100, 50);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			alignBottom();

			const state = get(shapesHistory);
			// Bottommost edge is at 350 (300 + 50)
			expect(state.shapes[0].y).toBe(300); // 350 - 50
			expect(state.shapes[1].y).toBe(300);
			expect(state.shapes[2].y).toBe(300);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignBottom();

			expect(count).toBe(0);
		});
	});

	describe('alignCenterVertical', () => {
		it('aligns shapes to average vertical center', () => {
			const rect1 = createRect('rect-1', 100, 100, 100, 50); // center at 125
			const rect2 = createRect('rect-2', 150, 200, 100, 50); // center at 225
			const rect3 = createRect('rect-3', 200, 300, 100, 50); // center at 325
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			alignCenterVertical();

			const state = get(shapesHistory);
			// Average center: (125 + 225 + 325) / 3 = 225
			// All shapes should have y = 225 - 25 = 200
			expect(state.shapes[0].y).toBe(200);
			expect(state.shapes[1].y).toBe(200);
			expect(state.shapes[2].y).toBe(200);
		});

		it('returns 0 when less than 2 shapes selected', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = alignCenterVertical();

			expect(count).toBe(0);
		});
	});

	describe('distributeHorizontally', () => {
		it('distributes shapes with equal horizontal spacing', () => {
			const rect1 = createRect('rect-1', 0, 100, 50, 50);
			const rect2 = createRect('rect-2', 100, 100, 50, 50);
			const rect3 = createRect('rect-3', 300, 100, 50, 50);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			distributeHorizontally();

			const state = get(shapesHistory);
			// Total space: 350 (0 to 350)
			// Total width: 150 (3 * 50)
			// Available space: 200
			// Spacing: 200 / 2 = 100
			expect(state.shapes[0].x).toBe(0);
			expect(state.shapes[1].x).toBe(150); // 0 + 50 + 100
			expect(state.shapes[2].x).toBe(300); // 150 + 50 + 100
		});

		it('returns 0 when less than 3 shapes selected', () => {
			const rect1 = createRect('rect-1', 0, 100);
			const rect2 = createRect('rect-2', 100, 100);
			shapesHistory.addShapes([rect1, rect2]);
			setSelection(['rect-1', 'rect-2']);

			const count = distributeHorizontally();

			expect(count).toBe(0);
		});

		it('handles already evenly distributed shapes', () => {
			const rect1 = createRect('rect-1', 0, 100, 50);
			const rect2 = createRect('rect-2', 150, 100, 50);
			const rect3 = createRect('rect-3', 300, 100, 50);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			const count = distributeHorizontally();

			// Already evenly distributed, so count may be 0
			expect(count).toBeLessThanOrEqual(3);
		});
	});

	describe('distributeVertically', () => {
		it('distributes shapes with equal vertical spacing', () => {
			const rect1 = createRect('rect-1', 100, 0, 50, 50);
			const rect2 = createRect('rect-2', 100, 100, 50, 50);
			const rect3 = createRect('rect-3', 100, 300, 50, 50);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			distributeVertically();

			const state = get(shapesHistory);
			// Total space: 350 (0 to 350)
			// Total height: 150 (3 * 50)
			// Available space: 200
			// Spacing: 200 / 2 = 100
			expect(state.shapes[0].y).toBe(0);
			expect(state.shapes[1].y).toBe(150); // 0 + 50 + 100
			expect(state.shapes[2].y).toBe(300); // 150 + 50 + 100
		});

		it('returns 0 when less than 3 shapes selected', () => {
			const rect1 = createRect('rect-1', 100, 0);
			const rect2 = createRect('rect-2', 100, 100);
			shapesHistory.addShapes([rect1, rect2]);
			setSelection(['rect-1', 'rect-2']);

			const count = distributeVertically();

			expect(count).toBe(0);
		});
	});

	describe('canAlign', () => {
		it('returns true when 2 or more shapes selected', () => {
			setSelection(['rect-1', 'rect-2']);
			expect(canAlign()).toBe(true);
		});

		it('returns false when less than 2 shapes selected', () => {
			setSelection(['rect-1']);
			expect(canAlign()).toBe(false);
		});

		it('returns false when nothing selected', () => {
			setSelection([]);
			expect(canAlign()).toBe(false);
		});
	});

	describe('canDistribute', () => {
		it('returns true when 3 or more shapes selected', () => {
			setSelection(['rect-1', 'rect-2', 'rect-3']);
			expect(canDistribute()).toBe(true);
		});

		it('returns false when 2 shapes selected', () => {
			setSelection(['rect-1', 'rect-2']);
			expect(canDistribute()).toBe(false);
		});

		it('returns false when nothing selected', () => {
			setSelection([]);
			expect(canDistribute()).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('handles shapes with different sizes', () => {
			const rect1 = createRect('rect-1', 100, 100, 50, 30);
			const rect2 = createRect('rect-2', 200, 150, 100, 60);
			const rect3 = createRect('rect-3', 300, 200, 75, 45);
			shapesHistory.addShapes([rect1, rect2, rect3]);
			setSelection(['rect-1', 'rect-2', 'rect-3']);

			alignLeft();

			const state = get(shapesHistory);
			expect(state.shapes[0].x).toBe(100);
			expect(state.shapes[1].x).toBe(100);
			expect(state.shapes[2].x).toBe(100);
		});

		it('handles shapes with scale', () => {
			const rect1 = createRect('rect-1', 100, 100, 50, 30);
			rect1.scaleX = 2; // Effective width: 100
			const rect2 = createRect('rect-2', 300, 150, 50, 30);
			shapesHistory.addShapes([rect1, rect2]);
			setSelection(['rect-1', 'rect-2']);

			alignRight();

			const state = get(shapesHistory);
			// Rightmost is rect2 at 350 (300 + 50)
			// rect1 with scale 2 has effective width 100, so x = 250
			expect(state.shapes[0].x).toBe(250);
		});
	});
});
