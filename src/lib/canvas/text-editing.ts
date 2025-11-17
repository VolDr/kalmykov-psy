// src/lib/canvas/text-editing.ts
import { writable, get } from 'svelte/store';
import type { TextShape, RectShape, EllipseShape, Shape } from './model/shapes';
import { shapesHistory, selection, setSelection } from './stores';
import { v4 as uuidv4 } from 'uuid';

/**
 * State for text editing
 */
export interface TextEditingState {
	isEditing: boolean;
	shapeId: string | null;
	originalText: string;
	currentText: string;
}

const DEFAULT_STATE: TextEditingState = {
	isEditing: false,
	shapeId: null,
	originalText: '',
	currentText: ''
};

/**
 * Store for text editing state
 */
export const textEditingState = writable<TextEditingState>({ ...DEFAULT_STATE });

/**
 * Start editing a text shape
 * Returns true if editing started successfully, false otherwise
 */
export function startTextEditing(shapeId: string): boolean {
	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === shapeId);

	if (!shape) {
		return false;
	}

	// Check if shape has text property (text, rect, or ellipse with text)
	let text = '';

	if (shape.type === 'text') {
		text = shape.text;
	} else if (shape.type === 'rect' || shape.type === 'ellipse') {
		text = shape.text || '';
	} else {
		// Shape type doesn't support text editing
		return false;
	}

	textEditingState.set({
		isEditing: true,
		shapeId,
		originalText: text,
		currentText: text
	});

	// Select the shape being edited
	setSelection([shapeId]);

	return true;
}

/**
 * Update the current text while editing
 */
export function updateEditingText(text: string): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return { ...state, currentText: text };
	});
}

/**
 * Calculate text height based on wrapping
 */
function calculateTextHeight(text: string, width: number, fontSize: number): number {
	const avgCharWidth = fontSize * 0.6;
	const charsPerLine = Math.floor(width / avgCharWidth);
	if (charsPerLine <= 0) return fontSize * 1.2;

	const words = text.split(' ');
	let lines = 1;
	let currentLineLength = 0;

	for (const word of words) {
		if (currentLineLength + word.length > charsPerLine) {
			lines++;
			currentLineLength = word.length + 1;
		} else {
			currentLineLength += word.length + 1;
		}
	}

	return lines * fontSize * 1.2;
}

/**
 * Commit the text changes and stop editing
 * Returns true if changes were committed, false otherwise
 */
export function commitTextEditing(): boolean {
	const state = get(textEditingState);

	if (!state.isEditing || !state.shapeId) {
		return false;
	}

	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === state.shapeId);

	if (!shape) {
		cancelTextEditing();
		return false;
	}

	// Only update if text actually changed
	if (state.currentText !== state.originalText) {
		let updatedShape: Shape;

		if (shape.type === 'text') {
			updatedShape = {
				...shape,
				text: state.currentText
			};
		} else if (shape.type === 'rect') {
			const rectShape = shape as RectShape;
			const textHeight = calculateTextHeight(state.currentText, rectShape.width, 14);
			const requiredHeight = textHeight + 20;
			updatedShape = {
				...rectShape,
				text: state.currentText || undefined,
				height: Math.max(rectShape.height, requiredHeight)
			};
		} else if (shape.type === 'ellipse') {
			const ellipseShape = shape as EllipseShape;
			const textHeight = calculateTextHeight(state.currentText, ellipseShape.rx * 2, 14);
			const requiredRy = (textHeight + 20) / 2;
			updatedShape = {
				...ellipseShape,
				text: state.currentText || undefined,
				ry: Math.max(ellipseShape.ry, requiredRy)
			};
		} else {
			cancelTextEditing();
			return false;
		}

		shapesHistory.updateShapes([updatedShape]);
	}

	// Reset editing state
	textEditingState.set({ ...DEFAULT_STATE });

	return true;
}

/**
 * Cancel text editing without saving changes
 */
export function cancelTextEditing(): void {
	textEditingState.set({ ...DEFAULT_STATE });
}

/**
 * Check if currently editing text
 */
export function isEditingText(): boolean {
	return get(textEditingState).isEditing;
}

/**
 * Get the ID of the shape being edited
 */
export function getEditingShapeId(): string | null {
	return get(textEditingState).shapeId;
}

/**
 * Check if a specific shape is being edited
 */
export function isShapeBeingEdited(shapeId: string): boolean {
	const state = get(textEditingState);
	return state.isEditing && state.shapeId === shapeId;
}

/**
 * Create a new text shape at the given position
 * Returns the ID of the new shape
 */
export function createTextShapeAt(
	x: number,
	y: number,
	initialText = 'Text',
	options: Partial<Omit<TextShape, 'id' | 'type' | 'x' | 'y' | 'text'>> = {}
): string {
	const textShape: TextShape = {
		id: uuidv4(),
		type: 'text',
		x,
		y,
		rotation: options.rotation ?? 0,
		scaleX: options.scaleX ?? 1,
		scaleY: options.scaleY ?? 1,
		stroke: options.stroke ?? '#000000',
		strokeWidth: options.strokeWidth ?? 0,
		text: initialText,
		fontSize: options.fontSize ?? 16,
		fontFamily: options.fontFamily ?? 'Arial',
		align: options.align ?? 'left',
		width: options.width,
		height: options.height
	};

	shapesHistory.addShapes([textShape]);

	// Start editing the new text shape
	startTextEditing(textShape.id);

	return textShape.id;
}

/**
 * Add text label to a rect or ellipse shape
 * Returns true if successful, false otherwise
 */
export function addTextToShape(shapeId: string, text: string): boolean {
	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === shapeId);

	if (!shape) {
		return false;
	}

	if (shape.type !== 'rect' && shape.type !== 'ellipse') {
		return false;
	}

	const updatedShape: Shape = {
		...shape,
		text
	};

	shapesHistory.updateShapes([updatedShape]);

	return true;
}

/**
 * Remove text label from a rect or ellipse shape
 * Returns true if successful, false otherwise
 */
export function removeTextFromShape(shapeId: string): boolean {
	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === shapeId);

	if (!shape) {
		return false;
	}

	if (shape.type !== 'rect' && shape.type !== 'ellipse') {
		return false;
	}

	if (!shape.text) {
		return false; // No text to remove
	}

	const updatedShape: RectShape | EllipseShape = {
		...shape,
		text: undefined
	};

	shapesHistory.updateShapes([updatedShape]);

	return true;
}

/**
 * Get text content of a shape (text, rect, or ellipse)
 */
export function getShapeText(shapeId: string): string | null {
	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === shapeId);

	if (!shape) {
		return null;
	}

	if (shape.type === 'text') {
		return shape.text;
	}

	if (shape.type === 'rect' || shape.type === 'ellipse') {
		return shape.text || null;
	}

	return null;
}

/**
 * Check if a shape supports text editing
 */
export function shapeSupportsTextEditing(shapeId: string): boolean {
	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === shapeId);

	if (!shape) {
		return false;
	}

	return shape.type === 'text' || shape.type === 'rect' || shape.type === 'ellipse';
}

/**
 * Update text properties of the currently edited shape
 */
export function updateEditingTextProperties(
	properties: Partial<Pick<TextShape, 'fontSize' | 'fontFamily' | 'align'>>
): boolean {
	const state = get(textEditingState);

	if (!state.isEditing || !state.shapeId) {
		return false;
	}

	const historyState = get(shapesHistory);
	const shape = historyState.shapes.find((s) => s.id === state.shapeId);

	if (!shape || shape.type !== 'text') {
		return false;
	}

	const updatedShape: TextShape = {
		...shape,
		...properties
	};

	shapesHistory.updateShapes([updatedShape]);

	return true;
}
