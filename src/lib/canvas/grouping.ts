// src/lib/canvas/grouping.ts
import { get } from 'svelte/store';
import type { Shape, GroupShape } from './model/shapes';
import { shapesHistory, selection, setSelection } from './stores';
import { v4 as uuidv4 } from 'uuid';

/**
 * Calculate bounding box for a set of shapes
 */
function calculateBounds(shapes: Shape[]): { x: number; y: number; width: number; height: number } {
	if (shapes.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const shape of shapes) {
		let shapeWidth = 0;
		let shapeHeight = 0;

		switch (shape.type) {
			case 'rect':
				shapeWidth = shape.width * shape.scaleX;
				shapeHeight = shape.height * shape.scaleY;
				break;
			case 'ellipse':
				shapeWidth = shape.rx * 2 * shape.scaleX;
				shapeHeight = shape.ry * 2 * shape.scaleY;
				break;
			case 'text':
				// Use width/height if available, otherwise estimate
				shapeWidth = (shape.width || 100) * shape.scaleX;
				shapeHeight = (shape.height || shape.fontSize * 1.5) * shape.scaleY; // LINE_HEIGHT_MULTIPLIER
				break;
			case 'arrow': {
				// Calculate arrow bounds from points
				const xs = shape.points.map((p) => shape.x + p[0]);
				const ys = shape.points.map((p) => shape.y + p[1]);
				const arrowMinX = Math.min(...xs);
				const arrowMaxX = Math.max(...xs);
				const arrowMinY = Math.min(...ys);
				const arrowMaxY = Math.max(...ys);
				minX = Math.min(minX, arrowMinX);
				maxX = Math.max(maxX, arrowMaxX);
				minY = Math.min(minY, arrowMinY);
				maxY = Math.max(maxY, arrowMaxY);
				continue; // Skip the default position handling
			}
			case 'group':
				// For groups, we'd need to recursively calculate, but for now assume 0 size
				shapeWidth = 0;
				shapeHeight = 0;
				break;
		}

		// Center-based position for ellipse, top-left for others
		if (shape.type === 'ellipse') {
			minX = Math.min(minX, shape.x - shapeWidth / 2);
			maxX = Math.max(maxX, shape.x + shapeWidth / 2);
			minY = Math.min(minY, shape.y - shapeHeight / 2);
			maxY = Math.max(maxY, shape.y + shapeHeight / 2);
		} else {
			minX = Math.min(minX, shape.x);
			maxX = Math.max(maxX, shape.x + shapeWidth);
			minY = Math.min(minY, shape.y);
			maxY = Math.max(maxY, shape.y + shapeHeight);
		}
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}

/**
 * Group selected shapes into a single group
 * Returns the ID of the new group, or null if grouping failed
 */
export function groupSelectedShapes(): string | null {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size < 2) {
		// Need at least 2 shapes to group
		return null;
	}

	const selectedIds = Array.from(sel.ids);
	const selectedShapes = historyState.shapes.filter((s) => selectedIds.includes(s.id));

	if (selectedShapes.length < 2) {
		return null;
	}

	// Calculate bounds of selected shapes
	const bounds = calculateBounds(selectedShapes);

	// Create the group shape
	const groupId = uuidv4();
	const groupShape: GroupShape = {
		id: groupId,
		type: 'group',
		x: bounds.x,
		y: bounds.y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		children: selectedIds
	};

	// Add group to shapes
	shapesHistory.addShapes([groupShape]);

	// Select the new group
	setSelection([groupId]);

	return groupId;
}

/**
 * Ungroup a group shape, restoring its children as individual shapes
 * Returns the IDs of ungrouped shapes, or empty array if ungrouping failed
 */
export function ungroupSelectedShapes(): string[] {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	// Find all selected groups
	const selectedIds = Array.from(sel.ids);
	const selectedGroups = historyState.shapes.filter(
		(s) => s.type === 'group' && selectedIds.includes(s.id)
	) as GroupShape[];

	if (selectedGroups.length === 0) {
		return [];
	}

	const childrenToSelect: string[] = [];
	const groupsToDelete: string[] = [];

	for (const group of selectedGroups) {
		// Collect children IDs
		childrenToSelect.push(...group.children);
		groupsToDelete.push(group.id);
	}

	// Delete the group shapes
	shapesHistory.deleteShapes(groupsToDelete);

	// Select the children
	setSelection(childrenToSelect);

	return childrenToSelect;
}

/**
 * Check if selection contains any groups
 */
export function selectionContainsGroups(): boolean {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	const selectedIds = Array.from(sel.ids);
	return historyState.shapes.some((s) => s.type === 'group' && selectedIds.includes(s.id));
}

/**
 * Check if selection can be grouped (has at least 2 shapes)
 */
export function canGroupSelection(): boolean {
	const sel = get(selection);
	return sel.ids.size >= 2;
}

/**
 * Get all shapes that belong to a group (direct children)
 */
export function getGroupChildren(groupId: string): Shape[] {
	const historyState = get(shapesHistory);
	const group = historyState.shapes.find((s) => s.id === groupId);

	if (!group || group.type !== 'group') {
		return [];
	}

	const childIds = group.children;
	return historyState.shapes.filter((s) => childIds.includes(s.id));
}

/**
 * Check if a shape is part of any group
 */
export function isShapeInGroup(shapeId: string): string | null {
	const historyState = get(shapesHistory);

	for (const shape of historyState.shapes) {
		if (shape.type === 'group' && shape.children.includes(shapeId)) {
			return shape.id;
		}
	}

	return null;
}

/**
 * Get all group shapes in the scene
 */
export function getAllGroups(): GroupShape[] {
	const historyState = get(shapesHistory);
	return historyState.shapes.filter((s) => s.type === 'group') as GroupShape[];
}
