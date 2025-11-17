// src/lib/canvas/layers.ts
import { get } from 'svelte/store';
import type { Shape } from './model/shapes';
import { shapesHistory, selection, setSelection } from './stores';

/**
 * Bring selected shapes to front (top of z-index)
 * Returns number of shapes moved
 */
export function bringToFront(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const selectedShapes: Shape[] = [];
	const otherShapes: Shape[] = [];

	// Separate selected shapes from others, preserving order
	for (const shape of historyState.shapes) {
		if (selectedIds.includes(shape.id)) {
			selectedShapes.push(shape);
		} else {
			otherShapes.push(shape);
		}
	}

	if (selectedShapes.length === 0) {
		return 0;
	}

	// Move selected shapes to end (front)
	const newShapes = [...otherShapes, ...selectedShapes];

	shapesHistory.reorderShapes(newShapes);

	return selectedShapes.length;
}

/**
 * Send selected shapes to back (bottom of z-index)
 * Returns number of shapes moved
 */
export function sendToBack(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const selectedShapes: Shape[] = [];
	const otherShapes: Shape[] = [];

	// Separate selected shapes from others, preserving order
	for (const shape of historyState.shapes) {
		if (selectedIds.includes(shape.id)) {
			selectedShapes.push(shape);
		} else {
			otherShapes.push(shape);
		}
	}

	if (selectedShapes.length === 0) {
		return 0;
	}

	// Move selected shapes to beginning (back)
	const newShapes = [...selectedShapes, ...otherShapes];

	shapesHistory.reorderShapes(newShapes);

	return selectedShapes.length;
}

/**
 * Move selected shapes one level up in z-index
 * Returns number of shapes moved
 */
export function bringForward(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const shapes = [...historyState.shapes];
	let moved = 0;

	// Process from end to beginning to avoid conflicts
	for (let i = shapes.length - 2; i >= 0; i--) {
		if (selectedIds.includes(shapes[i].id) && !selectedIds.includes(shapes[i + 1].id)) {
			// Swap with next shape
			const temp = shapes[i];
			shapes[i] = shapes[i + 1];
			shapes[i + 1] = temp;
			moved++;
		}
	}

	if (moved > 0) {
		shapesHistory.reorderShapes(shapes);
	}

	return moved;
}

/**
 * Move selected shapes one level down in z-index
 * Returns number of shapes moved
 */
export function sendBackward(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const shapes = [...historyState.shapes];
	let moved = 0;

	// Process from beginning to end to avoid conflicts
	for (let i = 1; i < shapes.length; i++) {
		if (selectedIds.includes(shapes[i].id) && !selectedIds.includes(shapes[i - 1].id)) {
			// Swap with previous shape
			const temp = shapes[i];
			shapes[i] = shapes[i - 1];
			shapes[i - 1] = temp;
			moved++;
		}
	}

	if (moved > 0) {
		shapesHistory.reorderShapes(shapes);
	}

	return moved;
}

/**
 * Get z-index (position in array) of a shape
 * Returns -1 if shape not found
 */
export function getShapeZIndex(shapeId: string): number {
	const historyState = get(shapesHistory);
	return historyState.shapes.findIndex((s) => s.id === shapeId);
}

/**
 * Move a shape to a specific z-index
 * Returns true if successful, false otherwise
 */
export function setShapeZIndex(shapeId: string, newIndex: number): boolean {
	const historyState = get(shapesHistory);
	const shapes = [...historyState.shapes];
	const currentIndex = shapes.findIndex((s) => s.id === shapeId);

	if (currentIndex === -1) {
		return false;
	}

	// Clamp newIndex to valid range
	const clampedIndex = Math.max(0, Math.min(shapes.length - 1, newIndex));

	if (currentIndex === clampedIndex) {
		return true; // Already at target position
	}

	// Remove shape from current position
	const [shape] = shapes.splice(currentIndex, 1);

	// Insert at new position
	shapes.splice(clampedIndex, 0, shape);

	shapesHistory.reorderShapes(shapes);

	return true;
}

/**
 * Get all shapes sorted by z-index (back to front)
 */
export function getShapesByZIndex(): Shape[] {
	const historyState = get(shapesHistory);
	return [...historyState.shapes];
}

/**
 * Reorder shapes based on provided order
 * The order array should contain shape IDs in desired order (back to front)
 * Returns true if successful, false if IDs don't match
 */
export function reorderShapes(orderedIds: string[]): boolean {
	const historyState = get(shapesHistory);

	// Verify same set of IDs
	if (orderedIds.length !== historyState.shapes.length) {
		return false;
	}

	const shapeMap = new Map<string, Shape>();
	for (const shape of historyState.shapes) {
		shapeMap.set(shape.id, shape);
	}

	const newShapes: Shape[] = [];
	for (const id of orderedIds) {
		const shape = shapeMap.get(id);
		if (!shape) {
			return false; // Unknown ID
		}
		newShapes.push(shape);
	}

	shapesHistory.reorderShapes(newShapes);

	return true;
}

/**
 * Select all shapes
 */
export function selectAll(): void {
	const historyState = get(shapesHistory);
	const allIds = historyState.shapes.map((s) => s.id);
	setSelection(allIds);
}

/**
 * Select shapes by type
 */
export function selectByType(type: Shape['type']): void {
	const historyState = get(shapesHistory);
	const ids = historyState.shapes.filter((s) => s.type === type).map((s) => s.id);
	setSelection(ids);
}

/**
 * Invert selection
 */
export function invertSelection(): void {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	const selectedIds = sel.ids;
	const invertedIds = historyState.shapes.filter((s) => !selectedIds.has(s.id)).map((s) => s.id);

	setSelection(invertedIds);
}

/**
 * Get shape at specific z-index
 */
export function getShapeAtZIndex(index: number): Shape | null {
	const historyState = get(shapesHistory);

	if (index < 0 || index >= historyState.shapes.length) {
		return null;
	}

	return historyState.shapes[index];
}

/**
 * Get total number of shapes
 */
export function getShapeCount(): number {
	const historyState = get(shapesHistory);
	return historyState.shapes.length;
}

/**
 * Swap z-index of two shapes
 */
export function swapZIndex(shapeId1: string, shapeId2: string): boolean {
	const historyState = get(shapesHistory);
	const shapes = [...historyState.shapes];

	const index1 = shapes.findIndex((s) => s.id === shapeId1);
	const index2 = shapes.findIndex((s) => s.id === shapeId2);

	if (index1 === -1 || index2 === -1) {
		return false;
	}

	// Swap
	const temp = shapes[index1];
	shapes[index1] = shapes[index2];
	shapes[index2] = temp;

	shapesHistory.reorderShapes(shapes);

	return true;
}
