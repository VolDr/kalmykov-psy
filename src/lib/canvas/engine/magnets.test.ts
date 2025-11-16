import { describe, it, expect } from 'vitest';
import {
	getShapeBounds,
	getAnchorPoint,
	findNearestAnchor,
	attachArrowEndToNearestShape
} from './magnets';
import type {
	RectShape,
	EllipseShape,
	TextShape,
	ArrowShape,
	GroupShape
} from '../model/shapes';

function createTestRect(id: string, x: number, y: number, width = 100, height = 50): RectShape {
	return {
		id,
		type: 'rect',
		x,
		y,
		width,
		height,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000',
		strokeWidth: 2
	};
}

function createTestEllipse(id: string, x: number, y: number, rx = 50, ry = 30): EllipseShape {
	return {
		id,
		type: 'ellipse',
		x,
		y,
		rx,
		ry,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000',
		strokeWidth: 2
	};
}

function createTestText(
	id: string,
	x: number,
	y: number,
	text = 'Test',
	fontSize = 16
): TextShape {
	return {
		id,
		type: 'text',
		x,
		y,
		text,
		fontSize,
		fontFamily: 'Arial',
		align: 'center',
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000',
		strokeWidth: 1
	};
}

function createTestArrow(id: string, x: number, y: number): ArrowShape {
	return {
		id,
		type: 'arrow',
		x,
		y,
		points: [
			[0, 0],
			[100, 0]
		],
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000',
		strokeWidth: 2
	};
}

describe('getShapeBounds', () => {
	describe('rect', () => {
		it('should calculate bounds for rectangle centered at position', () => {
			const rect = createTestRect('1', 100, 100, 80, 40);
			const bounds = getShapeBounds(rect);

			expect(bounds).toEqual({
				x: 60, // 100 - 80/2
				y: 80, // 100 - 40/2
				width: 80,
				height: 40
			});
		});
	});

	describe('ellipse', () => {
		it('should calculate bounds for ellipse', () => {
			const ellipse = createTestEllipse('1', 100, 100, 50, 30);
			const bounds = getShapeBounds(ellipse);

			expect(bounds).toEqual({
				x: 50, // 100 - 50
				y: 70, // 100 - 30
				width: 100, // 50 * 2
				height: 60 // 30 * 2
			});
		});
	});

	describe('text', () => {
		it('should calculate bounds with explicit dimensions', () => {
			const text = createTestText('1', 100, 100, 'Hello', 20);
			text.width = 80;
			text.height = 24;
			const bounds = getShapeBounds(text);

			expect(bounds).toEqual({
				x: 60, // 100 - 80/2
				y: 88, // 100 - 24/2
				width: 80,
				height: 24
			});
		});

		it('should estimate bounds from text length and fontSize', () => {
			const text = createTestText('1', 100, 100, 'Test', 20);
			const bounds = getShapeBounds(text);

			// width = 4 * 20 * 0.6 = 48
			// height = 20 * 1.2 = 24
			expect(bounds).toEqual({
				x: 76, // 100 - 48/2
				y: 88, // 100 - 24/2
				width: 48,
				height: 24
			});
		});
	});

	describe('unsupported types', () => {
		it('should return null for group shapes', () => {
			const group: GroupShape = {
				id: '1',
				type: 'group',
				x: 0,
				y: 0,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
				stroke: '#000',
				strokeWidth: 1,
				children: []
			};
			expect(getShapeBounds(group)).toBeNull();
		});

		it('should return null for arrow shapes', () => {
			const arrow = createTestArrow('1', 0, 0);
			expect(getShapeBounds(arrow)).toBeNull();
		});
	});
});

describe('getAnchorPoint', () => {
	const bounds = { x: 50, y: 70, width: 100, height: 60 };

	it('should return top center point', () => {
		const point = getAnchorPoint(bounds, 'top');
		expect(point).toEqual({ x: 100, y: 70 }); // x: 50 + 100/2, y: 70
	});

	it('should return bottom center point', () => {
		const point = getAnchorPoint(bounds, 'bottom');
		expect(point).toEqual({ x: 100, y: 130 }); // x: 50 + 100/2, y: 70 + 60
	});

	it('should return left center point', () => {
		const point = getAnchorPoint(bounds, 'left');
		expect(point).toEqual({ x: 50, y: 100 }); // x: 50, y: 70 + 60/2
	});

	it('should return right center point', () => {
		const point = getAnchorPoint(bounds, 'right');
		expect(point).toEqual({ x: 150, y: 100 }); // x: 50 + 100, y: 70 + 60/2
	});
});

describe('findNearestAnchor', () => {
	const shapes = [
		createTestRect('rect1', 100, 100, 80, 40), // bounds: x:60, y:80, w:80, h:40
		createTestEllipse('ellipse1', 300, 100, 50, 30) // bounds: x:250, y:70, w:100, h:60
	];

	it('should find nearest anchor within maxDistance', () => {
		// Point near top of rect1 (top anchor at x:100, y:80)
		const point = { x: 100, y: 75 };
		const result = findNearestAnchor(point, shapes, undefined, 40);

		expect(result).toEqual({ shapeId: 'rect1', anchor: 'top' });
	});

	it('should return null if no anchor within maxDistance', () => {
		const point = { x: 500, y: 500 };
		const result = findNearestAnchor(point, shapes, undefined, 40);

		expect(result).toBeNull();
	});

	it('should exclude specified shape', () => {
		// Point near rect1 but exclude rect1
		const point = { x: 100, y: 75 };
		const result = findNearestAnchor(point, shapes, 'rect1', 40);

		expect(result).toBeNull();
	});

	it('should find anchor on different shape when excluded', () => {
		// Create shapes closer together
		const closeShapes = [createTestRect('rect1', 100, 100), createTestRect('rect2', 200, 100)];

		// Point near left side of rect2 (left anchor at x: 150, y: 100)
		const point = { x: 155, y: 100 };
		const result = findNearestAnchor(point, closeShapes, 'rect1', 50);

		expect(result).toEqual({ shapeId: 'rect2', anchor: 'left' });
	});

	it('should select closest anchor among multiple candidates', () => {
		// Point equidistant to multiple anchors, should pick the closest
		const point = { x: 100, y: 80 }; // Exactly at top anchor of rect1
		const result = findNearestAnchor(point, shapes, undefined, 40);

		expect(result).toEqual({ shapeId: 'rect1', anchor: 'top' });
	});

	it('should handle empty shapes array', () => {
		const result = findNearestAnchor({ x: 0, y: 0 }, [], undefined, 40);
		expect(result).toBeNull();
	});

	it('should skip shapes without bounds (arrows, groups)', () => {
		const mixedShapes = [createTestArrow('arrow1', 100, 100), createTestRect('rect1', 100, 100)];

		const point = { x: 100, y: 75 };
		const result = findNearestAnchor(point, mixedShapes, undefined, 40);

		expect(result).toEqual({ shapeId: 'rect1', anchor: 'top' });
	});
});

describe('attachArrowEndToNearestShape', () => {
	const shapes = [
		createTestRect('rect1', 100, 100),
		createTestEllipse('ellipse1', 300, 100)
	];

	it('should attach arrow to nearest shape', () => {
		const arrow = createTestArrow('arrow1', 0, 0);
		const endPoint = { x: 100, y: 75 }; // Near top of rect1

		const result = attachArrowEndToNearestShape(arrow, shapes, 'to', endPoint, 40);

		expect(result.to).toEqual({ shapeId: 'rect1', anchor: 'top' });
		expect(result.from).toBeUndefined();
	});

	it('should attach from endpoint', () => {
		const arrow = createTestArrow('arrow1', 0, 0);
		const startPoint = { x: 100, y: 120 }; // Near bottom of rect1

		const result = attachArrowEndToNearestShape(arrow, shapes, 'from', startPoint, 40);

		expect(result.from).toEqual({ shapeId: 'rect1', anchor: 'bottom' });
	});

	it('should remove endpoint if no nearby shape', () => {
		const arrow: ArrowShape = {
			...createTestArrow('arrow1', 0, 0),
			to: { shapeId: 'old', anchor: 'top' }
		};
		const endPoint = { x: 500, y: 500 }; // Far from any shape

		const result = attachArrowEndToNearestShape(arrow, shapes, 'to', endPoint, 40);

		expect(result.to).toBeUndefined();
	});

	it('should not attach to itself', () => {
		const arrow = createTestArrow('arrow1', 100, 100);
		const endPoint = { x: 100, y: 75 };

		// Include the arrow in shapes array
		const allShapes = [...shapes, arrow];
		const result = attachArrowEndToNearestShape(arrow, allShapes, 'to', endPoint, 40);

		// Should attach to rect1, not to arrow1 itself
		expect(result.to?.shapeId).toBe('rect1');
	});

	it('should preserve other arrow properties', () => {
		const arrow: ArrowShape = {
			...createTestArrow('arrow1', 10, 20),
			from: { shapeId: 'existing', anchor: 'left' }
		};
		const endPoint = { x: 100, y: 75 };

		const result = attachArrowEndToNearestShape(arrow, shapes, 'to', endPoint, 40);

		expect(result.x).toBe(10);
		expect(result.y).toBe(20);
		expect(result.from).toEqual({ shapeId: 'existing', anchor: 'left' });
	});
});
