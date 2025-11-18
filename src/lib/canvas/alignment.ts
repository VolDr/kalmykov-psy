// src/lib/canvas/alignment.ts
import { get } from 'svelte/store';
import type { Shape } from './model/shapes';
import { shapesHistory, selection } from './stores';

/**
 * Get bounding box for a shape
 */
function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
	switch (shape.type) {
		case 'rect':
			return {
				x: shape.x,
				y: shape.y,
				width: shape.width * shape.scaleX,
				height: shape.height * shape.scaleY
			};
		case 'ellipse':
			return {
				x: shape.x - shape.rx * shape.scaleX,
				y: shape.y - shape.ry * shape.scaleY,
				width: shape.rx * 2 * shape.scaleX,
				height: shape.ry * 2 * shape.scaleY
			};
		case 'text':
			return {
				x: shape.x,
				y: shape.y,
				width: (shape.width || 100) * shape.scaleX,
				height: (shape.height || shape.fontSize * 1.5) * shape.scaleY // LINE_HEIGHT_MULTIPLIER
			};
		case 'arrow': {
			const xs = shape.points.map((p) => shape.x + p[0]);
			const ys = shape.points.map((p) => shape.y + p[1]);
			const minX = Math.min(...xs);
			const maxX = Math.max(...xs);
			const minY = Math.min(...ys);
			const maxY = Math.max(...ys);
			return {
				x: minX,
				y: minY,
				width: maxX - minX,
				height: maxY - minY
			};
		}
		case 'group':
			return {
				x: shape.x,
				y: shape.y,
				width: 0,
				height: 0
			};
	}
}

/**
 * Move shape to new position (returns updated shape)
 */
function moveShapeTo(shape: Shape, newX: number, newY: number): Shape {
	if (shape.type === 'ellipse') {
		const bounds = getShapeBounds(shape);
		const centerX = bounds.x + bounds.width / 2;
		const centerY = bounds.y + bounds.height / 2;
		const dx = newX + bounds.width / 2 - centerX;
		const dy = newY + bounds.height / 2 - centerY;
		return { ...shape, x: shape.x + dx, y: shape.y + dy };
	}

	return { ...shape, x: newX, y: newY };
}

/**
 * Align selected shapes to the left
 */
export function alignLeft(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const minX = Math.min(...bounds.map((b) => b.bounds.x));

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		if (b.x !== minX) {
			updated.push(moveShapeTo(shape, minX, b.y));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Align selected shapes to the right
 */
export function alignRight(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const maxRight = Math.max(...bounds.map((b) => b.bounds.x + b.bounds.width));

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		const newX = maxRight - b.width;
		if (b.x !== newX) {
			updated.push(moveShapeTo(shape, newX, b.y));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Align selected shapes to center horizontally
 */
export function alignCenterHorizontal(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const centers = bounds.map((b) => b.bounds.x + b.bounds.width / 2);
	const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		const newX = avgCenter - b.width / 2;
		if (Math.abs(b.x - newX) > 0.01) {
			updated.push(moveShapeTo(shape, newX, b.y));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Align selected shapes to top
 */
export function alignTop(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const minY = Math.min(...bounds.map((b) => b.bounds.y));

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		if (b.y !== minY) {
			updated.push(moveShapeTo(shape, b.x, minY));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Align selected shapes to bottom
 */
export function alignBottom(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const maxBottom = Math.max(...bounds.map((b) => b.bounds.y + b.bounds.height));

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		const newY = maxBottom - b.height;
		if (b.y !== newY) {
			updated.push(moveShapeTo(shape, b.x, newY));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Align selected shapes to center vertically
 */
export function alignCenterVertical(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	const centers = bounds.map((b) => b.bounds.y + b.bounds.height / 2);
	const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;

	const updated: Shape[] = [];
	for (const { shape, bounds: b } of bounds) {
		const newY = avgCenter - b.height / 2;
		if (Math.abs(b.y - newY) > 0.01) {
			updated.push(moveShapeTo(shape, b.x, newY));
		}
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Distribute selected shapes horizontally with equal spacing
 */
export function distributeHorizontally(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 3) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 3) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	bounds.sort((a, b) => a.bounds.x - b.bounds.x);

	const leftmost = bounds[0].bounds.x;
	const rightmost = bounds[bounds.length - 1].bounds.x + bounds[bounds.length - 1].bounds.width;
	const totalWidth = bounds.reduce((sum, b) => sum + b.bounds.width, 0);
	const spacing = (rightmost - leftmost - totalWidth) / (bounds.length - 1);

	const updated: Shape[] = [];
	let currentX = leftmost;

	for (const { shape, bounds: b } of bounds) {
		if (Math.abs(b.x - currentX) > 0.01) {
			updated.push(moveShapeTo(shape, currentX, b.y));
		}
		currentX += b.width + spacing;
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Distribute selected shapes vertically with equal spacing
 */
export function distributeVertically(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 3) return 0;

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 3) return 0;

	const bounds = selectedShapes.map((s) => ({ shape: s, bounds: getShapeBounds(s) }));
	bounds.sort((a, b) => a.bounds.y - b.bounds.y);

	const topmost = bounds[0].bounds.y;
	const bottommost = bounds[bounds.length - 1].bounds.y + bounds[bounds.length - 1].bounds.height;
	const totalHeight = bounds.reduce((sum, b) => sum + b.bounds.height, 0);
	const spacing = (bottommost - topmost - totalHeight) / (bounds.length - 1);

	const updated: Shape[] = [];
	let currentY = topmost;

	for (const { shape, bounds: b } of bounds) {
		if (Math.abs(b.y - currentY) > 0.01) {
			updated.push(moveShapeTo(shape, b.x, currentY));
		}
		currentY += b.height + spacing;
	}

	if (updated.length > 0) {
		shapesHistory.updateShapes(updated);
	}

	return updated.length;
}

/**
 * Check if alignment operations can be performed
 */
export function canAlign(): boolean {
	const sel = get(selection);
	return sel.ids.size >= 2;
}

/**
 * Check if distribution operations can be performed
 */
export function canDistribute(): boolean {
	const sel = get(selection);
	return sel.ids.size >= 3;
}
