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
	selectionStart: number | null; // Start of text selection (null = no selection)
	selectionEnd: number | null; // End of text selection (null = no selection)
}

const DEFAULT_STATE: TextEditingState = {
	isEditing: false,
	shapeId: null,
	originalText: '',
	currentText: '',
	cursorPosition: 0,
	selectionStart: null,
	selectionEnd: null
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
	initialText = '',
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
 * Insert text at cursor position (replaces selection if any)
 */
export function insertTextAtCursor(text: string): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}

		let start: number, end: number;

		// If there's a selection, replace it
		if (
			state.selectionStart !== null &&
			state.selectionEnd !== null &&
			state.selectionStart !== state.selectionEnd
		) {
			start = Math.min(state.selectionStart, state.selectionEnd);
			end = Math.max(state.selectionStart, state.selectionEnd);
		} else {
			start = state.cursorPosition;
			end = state.cursorPosition;
		}

		const before = state.currentText.slice(0, start);
		const after = state.currentText.slice(end);
		return {
			...state,
			currentText: before + text + after,
			cursorPosition: start + text.length,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Delete character before cursor (Backspace) or delete selection
 */
export function deleteBeforeCursor(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}

		// If there's a selection, delete it
		if (
			state.selectionStart !== null &&
			state.selectionEnd !== null &&
			state.selectionStart !== state.selectionEnd
		) {
			const start = Math.min(state.selectionStart, state.selectionEnd);
			const end = Math.max(state.selectionStart, state.selectionEnd);
			const before = state.currentText.slice(0, start);
			const after = state.currentText.slice(end);
			return {
				...state,
				currentText: before + after,
				cursorPosition: start,
				selectionStart: null,
				selectionEnd: null
			};
		}

		// No selection - delete character before cursor
		if (state.cursorPosition === 0) {
			return state;
		}
		const before = state.currentText.slice(0, state.cursorPosition - 1);
		const after = state.currentText.slice(state.cursorPosition);
		return {
			...state,
			currentText: before + after,
			cursorPosition: state.cursorPosition - 1,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Delete character after cursor (Delete key) or delete selection
 */
export function deleteAfterCursor(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}

		// If there's a selection, delete it
		if (
			state.selectionStart !== null &&
			state.selectionEnd !== null &&
			state.selectionStart !== state.selectionEnd
		) {
			const start = Math.min(state.selectionStart, state.selectionEnd);
			const end = Math.max(state.selectionStart, state.selectionEnd);
			const before = state.currentText.slice(0, start);
			const after = state.currentText.slice(end);
			return {
				...state,
				currentText: before + after,
				cursorPosition: start,
				selectionStart: null,
				selectionEnd: null
			};
		}

		// No selection - delete character after cursor
		if (state.cursorPosition >= state.currentText.length) {
			return state;
		}
		const before = state.currentText.slice(0, state.cursorPosition);
		const after = state.currentText.slice(state.cursorPosition + 1);
		return {
			...state,
			currentText: before + after,
			selectionStart: null,
			selectionEnd: null
			// cursorPosition stays the same
		};
	});
}

/**
 * Set text selection range
 */
export function setTextSelection(start: number, end: number): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		const selStart = Math.max(0, Math.min(start, state.currentText.length));
		const selEnd = Math.max(0, Math.min(end, state.currentText.length));
		return {
			...state,
			selectionStart: selStart,
			selectionEnd: selEnd,
			cursorPosition: selEnd
		};
	});
}

/**
 * Clear text selection
 */
export function clearTextSelection(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return {
			...state,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Select all text
 */
export function selectAllText(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return {
			...state,
			selectionStart: 0,
			selectionEnd: state.currentText.length,
			cursorPosition: state.currentText.length
		};
	});
}

/**
 * Get selected text
 */
export function getSelectedText(): string {
	const state = get(textEditingState);
	if (
		!state.isEditing ||
		state.selectionStart === null ||
		state.selectionEnd === null ||
		state.selectionStart === state.selectionEnd
	) {
		return '';
	}
	const start = Math.min(state.selectionStart, state.selectionEnd);
	const end = Math.max(state.selectionStart, state.selectionEnd);
	return state.currentText.slice(start, end);
}

/**
 * Check if there is an active text selection
 */
export function hasTextSelection(): boolean {
	const state = get(textEditingState);
	return (
		state.isEditing &&
		state.selectionStart !== null &&
		state.selectionEnd !== null &&
		state.selectionStart !== state.selectionEnd
	);
}

/**
 * Delete selected text
 */
export function deleteSelectedText(): void {
	textEditingState.update((state) => {
		if (
			!state.isEditing ||
			state.selectionStart === null ||
			state.selectionEnd === null ||
			state.selectionStart === state.selectionEnd
		) {
			return state;
		}
		const start = Math.min(state.selectionStart, state.selectionEnd);
		const end = Math.max(state.selectionStart, state.selectionEnd);
		const before = state.currentText.slice(0, start);
		const after = state.currentText.slice(end);
		return {
			...state,
			currentText: before + after,
			cursorPosition: start,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Replace selected text with new text (or insert at cursor if no selection)
 */
export function replaceSelectedText(newText: string): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}

		let start: number, end: number;

		if (
			state.selectionStart !== null &&
			state.selectionEnd !== null &&
			state.selectionStart !== state.selectionEnd
		) {
			// Replace selection
			start = Math.min(state.selectionStart, state.selectionEnd);
			end = Math.max(state.selectionStart, state.selectionEnd);
		} else {
			// Insert at cursor
			start = state.cursorPosition;
			end = state.cursorPosition;
		}

		const before = state.currentText.slice(0, start);
		const after = state.currentText.slice(end);
		return {
			...state,
			currentText: before + newText + after,
			cursorPosition: start + newText.length,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Copy selected text to clipboard
 * Returns the copied text or empty string if nothing selected
 */
export async function copySelectedTextToClipboard(): Promise<string> {
	const selectedText = getSelectedText();
	if (selectedText && typeof navigator !== 'undefined' && navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(selectedText);
		} catch (err) {
			console.error('Failed to copy text to clipboard:', err);
		}
	}
	return selectedText;
}

/**
 * Cut selected text to clipboard
 * Returns the cut text or empty string if nothing selected
 */
export async function cutSelectedTextToClipboard(): Promise<string> {
	const selectedText = await copySelectedTextToClipboard();
	if (selectedText) {
		deleteSelectedText();
	}
	return selectedText;
}

/**
 * Paste text from clipboard at cursor position or replace selection
 */
export async function pasteTextFromClipboard(): Promise<boolean> {
	if (typeof navigator === 'undefined' || !navigator.clipboard) {
		return false;
	}

	try {
		const text = await navigator.clipboard.readText();
		if (text) {
			replaceSelectedText(text);
			return true;
		}
	} catch (err) {
		console.error('Failed to paste text from clipboard:', err);
	}

	return false;
}

/**
 * Set cursor position from character index
 */
export function setCursorPosition(position: number): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		const pos = Math.max(0, Math.min(position, state.currentText.length));
		return {
			...state,
			cursorPosition: pos,
			selectionStart: null,
			selectionEnd: null
		};
	});
}

/**
 * Start text selection from current cursor position
 */
export function startTextSelectionFromCursor(): void {
	textEditingState.update((state) => {
		if (!state.isEditing) {
			return state;
		}
		return {
			...state,
			selectionStart: state.cursorPosition,
			selectionEnd: state.cursorPosition
		};
	});
}

/**
 * Update text selection end to current cursor position
 */
export function updateTextSelectionToCursor(newPosition: number): void {
	textEditingState.update((state) => {
		if (!state.isEditing || state.selectionStart === null) {
			return state;
		}
		const pos = Math.max(0, Math.min(newPosition, state.currentText.length));
		return {
			...state,
			selectionEnd: pos,
			cursorPosition: pos
		};
	});
}
