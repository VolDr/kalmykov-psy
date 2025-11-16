// src/lib/canvas/clipboard.ts
import { writable, get } from 'svelte/store';
import type { Shape } from './model/shapes';
import { shapesHistory, selection, setSelection } from './stores';
import { v4 as uuidv4 } from 'uuid';

// Internal clipboard storage
export const clipboard = writable<Shape[]>([]);

// Offset for pasted shapes (to avoid exact overlap)
const PASTE_OFFSET = 20;

// Track paste count for incrementing offset
let pasteCount = 0;

/**
 * Deep clone a shape with a new ID
 */
function cloneShape(shape: Shape, idMap: Map<string, string>): Shape {
	const newId = uuidv4();
	idMap.set(shape.id, newId);

	const cloned = {
		...shape,
		id: newId
	};

	// Handle arrow references - will be updated after all shapes are cloned
	if (cloned.type === 'arrow') {
		// Arrow endpoints will be remapped later if they reference copied shapes
		return cloned;
	}

	// Handle group children
	if (cloned.type === 'group') {
		// Children will be remapped after all shapes are cloned
		return cloned;
	}

	return cloned;
}

/**
 * Update arrow endpoints to reference new shape IDs
 */
function remapArrowEndpoints(shapes: Shape[], idMap: Map<string, string>): Shape[] {
	return shapes.map((shape) => {
		if (shape.type !== 'arrow') return shape;

		const updated = { ...shape };

		if (updated.from && idMap.has(updated.from.shapeId)) {
			updated.from = {
				...updated.from,
				shapeId: idMap.get(updated.from.shapeId)!
			};
		} else if (updated.from) {
			// Reference to shape not in clipboard - remove the attachment
			delete updated.from;
		}

		if (updated.to && idMap.has(updated.to.shapeId)) {
			updated.to = {
				...updated.to,
				shapeId: idMap.get(updated.to.shapeId)!
			};
		} else if (updated.to) {
			// Reference to shape not in clipboard - remove the attachment
			delete updated.to;
		}

		return updated;
	});
}

/**
 * Update group children to reference new shape IDs
 */
function remapGroupChildren(shapes: Shape[], idMap: Map<string, string>): Shape[] {
	return shapes.map((shape) => {
		if (shape.type !== 'group') return shape;

		const updated = { ...shape };
		updated.children = updated.children
			.filter((childId) => idMap.has(childId))
			.map((childId) => idMap.get(childId)!);

		return updated;
	});
}

/**
 * Copy selected shapes to clipboard
 * Returns the number of shapes copied
 */
export function copySelectedShapes(): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);
	const selectedIds = sel.ids;

	if (selectedIds.size === 0) {
		return 0;
	}

	// Get shapes that are selected
	const shapesToCopy = historyState.shapes.filter((s) => selectedIds.has(s.id));

	// Store in clipboard
	clipboard.set(shapesToCopy);

	// Reset paste count for fresh offset
	pasteCount = 0;

	return shapesToCopy.length;
}

/**
 * Cut selected shapes (copy + delete)
 * Returns the number of shapes cut
 */
export function cutSelectedShapes(): number {
	const count = copySelectedShapes();

	if (count === 0) {
		return 0;
	}

	const sel = get(selection);
	const selectedIds = Array.from(sel.ids);

	// Delete the selected shapes
	shapesHistory.deleteShapes(selectedIds);

	// Clear selection
	setSelection([]);

	return count;
}

/**
 * Paste shapes from clipboard
 * Returns the IDs of newly created shapes
 */
export function pasteShapes(): string[] {
	const clipboardContent = get(clipboard);

	if (clipboardContent.length === 0) {
		return [];
	}

	// Increment paste count for offset
	pasteCount++;
	const offset = PASTE_OFFSET * pasteCount;

	// Create ID mapping for cloning
	const idMap = new Map<string, string>();

	// Clone shapes with new IDs
	let clonedShapes = clipboardContent.map((shape) => cloneShape(shape, idMap));

	// Remap arrow endpoints and group children
	clonedShapes = remapArrowEndpoints(clonedShapes, idMap);
	clonedShapes = remapGroupChildren(clonedShapes, idMap);

	// Apply offset to positions
	clonedShapes = clonedShapes.map((shape) => ({
		...shape,
		x: shape.x + offset,
		y: shape.y + offset
	}));

	// Add shapes to history
	shapesHistory.addShapes(clonedShapes);

	// Select the newly pasted shapes
	const newIds = clonedShapes.map((s) => s.id);
	setSelection(newIds);

	return newIds;
}

/**
 * Check if clipboard has content
 */
export function hasClipboardContent(): boolean {
	return get(clipboard).length > 0;
}

/**
 * Clear the clipboard
 */
export function clearClipboard(): void {
	clipboard.set([]);
	pasteCount = 0;
}

/**
 * Get clipboard content count
 */
export function getClipboardCount(): number {
	return get(clipboard).length;
}

/**
 * Duplicate selected shapes in place (Ctrl+D functionality)
 * This is a shortcut for copy + paste
 * Returns the IDs of duplicated shapes
 */
export function duplicateSelectedShapes(): string[] {
	const count = copySelectedShapes();
	if (count === 0) {
		return [];
	}
	return pasteShapes();
}
