// src/lib/canvas/text-editing.ts
import { writable, get } from 'svelte/store';
import type { TextShape, RectShape, EllipseShape, Shape } from './model/shapes';
import { shapesHistory, selection, setSelection } from './stores';
import { v4 as uuidv4 } from 'uuid';
import { CANVAS_FONT_FAMILY, DEFAULT_FONT_SIZE } from './constants';

/**
 * State for text editing
 */
export interface TextEditingState {
	isEditing: boolean;
	shapeId: string | null;
	originalText: string;
	currentText: string;
	cursorPosition: number; // Position of cursor in text (0 = start, text.length = end)
}

const DEFAULT_STATE: TextEditingState = {
	isEditing: false,
	shapeId: null,
	originalText: '',
	currentText: '',
	cursorPosition: 0
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
		currentText: text,
		cursorPosition: text.length // Start with cursor at end
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
		} else if (shape.type === 'rect' || shape.type === 'ellipse') {
			updatedShape = {
				...shape,
				text: state.currentText || undefined
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
		fontSize: options.fontSize ?? DEFAULT_FONT_SIZE,
		fontFamily: options.fontFamily ?? CANVAS_FONT_FAMILY,
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

/**
 * Move cursor left by one position
 */
export function moveCursorLeft(): void {
	textEditingState.update((state) => {
		if (!state.isEditing || state.cursorPosition === 0) {
			return state;
		}
		return { ...state, cursorPosition: state.cursorPosition - 1 };
	});
}

/**
 * Move cursor right by one position
 */
export function moveCursorRight(): void {
	textEditingState.update((state) => {
		if (!state.isEditing || state.cursorPosition >= state.currentText.length) {
			return state;
		}
		return { ...state, cursorPosition: state.cursorPosition + 1 };
	});
}

/**
 * Move cursor to start of text
 */
export function moveCursorToStart(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return { ...state, cursorPosition: 0 };
	});
}

/**
 * Move cursor to end of text
 */
export function moveCursorToEnd(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return { ...state, cursorPosition: state.currentText.length };
	});
}

/**
 * Move cursor to start of current line
 */
export function moveCursorToLineStart(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		const textBeforeCursor = state.currentText.slice(0, state.cursorPosition);
		const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
		const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
		return { ...state, cursorPosition: lineStart };
	});
}

/**
 * Move cursor to end of current line
 */
export function moveCursorToLineEnd(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		const textAfterCursor = state.currentText.slice(state.cursorPosition);
		const nextNewlineIndex = textAfterCursor.indexOf('\n');
		const lineEnd =
			nextNewlineIndex === -1
				? state.currentText.length
				: state.cursorPosition + nextNewlineIndex;
		return { ...state, cursorPosition: lineEnd };
	});
}

/**
 * Insert text at cursor position
 */
export function insertTextAtCursor(text: string): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		const before = state.currentText.slice(0, state.cursorPosition);
		const after = state.currentText.slice(state.cursorPosition);
		return {
			...state,
			currentText: before + text + after,
			cursorPosition: state.cursorPosition + text.length
		};
	});
}

/**
 * Delete character before cursor (Backspace)
 */
export function deleteBeforeCursor(): void {
	textEditingState.update((state) => {
		if (!state.isEditing || state.cursorPosition === 0) {
			return state;
		}
		const before = state.currentText.slice(0, state.cursorPosition - 1);
		const after = state.currentText.slice(state.cursorPosition);
		return {
			...state,
			currentText: before + after,
			cursorPosition: state.cursorPosition - 1
		};
	});
}

/**
 * Delete character after cursor (Delete key)
 */
export function deleteAfterCursor(): void {
	textEditingState.update((state) => {
		if (!state.isEditing || state.cursorPosition >= state.currentText.length) {
			return state;
		}
		const before = state.currentText.slice(0, state.cursorPosition);
		const after = state.currentText.slice(state.cursorPosition + 1);
		return {
			...state,
			currentText: before + after
			// cursorPosition stays the same
		};
	});
}
