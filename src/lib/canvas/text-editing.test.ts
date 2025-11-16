// src/lib/canvas/text-editing.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	textEditingState,
	startTextEditing,
	updateEditingText,
	commitTextEditing,
	cancelTextEditing,
	isEditingText,
	getEditingShapeId,
	isShapeBeingEdited,
	createTextShapeAt,
	addTextToShape,
	removeTextFromShape,
	getShapeText,
	shapeSupportsTextEditing,
	updateEditingTextProperties
} from './text-editing';
import { shapesHistory, selection, setSelection } from './stores';
import type { RectShape, TextShape, EllipseShape, ArrowShape } from './model/shapes';

// Mock uuid
vi.mock('uuid', () => ({
	v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}));

describe('text-editing', () => {
	const createRect = (id: string, text?: string): RectShape => ({
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
		height: 50,
		text
	});

	const createText = (id: string, text = 'Hello'): TextShape => ({
		id,
		type: 'text',
		x: 150,
		y: 150,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		text,
		fontSize: 16,
		fontFamily: 'Arial',
		align: 'left'
	});

	const createEllipse = (id: string, text?: string): EllipseShape => ({
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
		ry: 30,
		text
	});

	const createArrow = (id: string): ArrowShape => ({
		id,
		type: 'arrow',
		x: 0,
		y: 0,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		points: [
			[0, 0],
			[100, 100]
		]
	});

	beforeEach(() => {
		shapesHistory.setAllShapes([]);
		setSelection([]);
		cancelTextEditing();
	});

	describe('textEditingState', () => {
		it('has correct default state', () => {
			const state = get(textEditingState);
			expect(state.isEditing).toBe(false);
			expect(state.shapeId).toBeNull();
			expect(state.originalText).toBe('');
			expect(state.currentText).toBe('');
		});
	});

	describe('startTextEditing', () => {
		it('starts editing a text shape', () => {
			const text = createText('text-1', 'Hello World');
			shapesHistory.addShapes([text]);

			const result = startTextEditing('text-1');

			expect(result).toBe(true);

			const state = get(textEditingState);
			expect(state.isEditing).toBe(true);
			expect(state.shapeId).toBe('text-1');
			expect(state.originalText).toBe('Hello World');
			expect(state.currentText).toBe('Hello World');
		});

		it('starts editing a rect with text', () => {
			const rect = createRect('rect-1', 'Label');
			shapesHistory.addShapes([rect]);

			const result = startTextEditing('rect-1');

			expect(result).toBe(true);

			const state = get(textEditingState);
			expect(state.isEditing).toBe(true);
			expect(state.originalText).toBe('Label');
		});

		it('starts editing a rect without text', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const result = startTextEditing('rect-1');

			expect(result).toBe(true);

			const state = get(textEditingState);
			expect(state.originalText).toBe('');
		});

		it('starts editing an ellipse with text', () => {
			const ellipse = createEllipse('ellipse-1', 'Circle');
			shapesHistory.addShapes([ellipse]);

			const result = startTextEditing('ellipse-1');

			expect(result).toBe(true);

			const state = get(textEditingState);
			expect(state.originalText).toBe('Circle');
		});

		it('selects the shape being edited', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);

			startTextEditing('text-1');

			const sel = get(selection);
			expect(sel.ids.has('text-1')).toBe(true);
		});

		it('returns false for non-existent shape', () => {
			const result = startTextEditing('non-existent');
			expect(result).toBe(false);

			const state = get(textEditingState);
			expect(state.isEditing).toBe(false);
		});

		it('returns false for arrow shape', () => {
			const arrow = createArrow('arrow-1');
			shapesHistory.addShapes([arrow]);

			const result = startTextEditing('arrow-1');
			expect(result).toBe(false);
		});
	});

	describe('updateEditingText', () => {
		it('updates current text while editing', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			updateEditingText('Hello World');

			const state = get(textEditingState);
			expect(state.currentText).toBe('Hello World');
			expect(state.originalText).toBe('Hello'); // Original unchanged
		});

		it('does nothing when not editing', () => {
			updateEditingText('Test');

			const state = get(textEditingState);
			expect(state.currentText).toBe('');
		});

		it('allows setting empty text', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			updateEditingText('');

			const state = get(textEditingState);
			expect(state.currentText).toBe('');
		});
	});

	describe('commitTextEditing', () => {
		it('saves text changes to shape', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');
			updateEditingText('Hello World');

			const result = commitTextEditing();

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as TextShape;
			expect(updated.text).toBe('Hello World');
		});

		it('resets editing state after commit', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');
			updateEditingText('New Text');

			commitTextEditing();

			const state = get(textEditingState);
			expect(state.isEditing).toBe(false);
			expect(state.shapeId).toBeNull();
		});

		it('does not create history entry if text unchanged', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);

			const initialState = get(shapesHistory);
			const initialUndoStackSize = initialState.undoStack.length;

			startTextEditing('text-1');
			// Don't change text
			commitTextEditing();

			const finalState = get(shapesHistory);
			// Only the addShapes entry should be there
			expect(finalState.undoStack.length).toBe(initialUndoStackSize);
		});

		it('returns false when not editing', () => {
			const result = commitTextEditing();
			expect(result).toBe(false);
		});

		it('returns false when shape no longer exists', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			// Remove the shape
			shapesHistory.setAllShapes([]);

			const result = commitTextEditing();
			expect(result).toBe(false);
		});

		it('saves text to rect shape', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			startTextEditing('rect-1');
			updateEditingText('Label');

			commitTextEditing();

			const state = get(shapesHistory);
			const updated = state.shapes[0] as RectShape;
			expect(updated.text).toBe('Label');
		});

		it('removes text from rect when set to empty', () => {
			const rect = createRect('rect-1', 'Label');
			shapesHistory.addShapes([rect]);
			startTextEditing('rect-1');
			updateEditingText('');

			commitTextEditing();

			const state = get(shapesHistory);
			const updated = state.shapes[0] as RectShape;
			expect(updated.text).toBeUndefined();
		});
	});

	describe('cancelTextEditing', () => {
		it('resets editing state without saving', () => {
			const text = createText('text-1', 'Hello');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');
			updateEditingText('Changed Text');

			cancelTextEditing();

			const editState = get(textEditingState);
			expect(editState.isEditing).toBe(false);

			// Original text should be unchanged
			const historyState = get(shapesHistory);
			const shape = historyState.shapes[0] as TextShape;
			expect(shape.text).toBe('Hello');
		});

		it('can be called when not editing', () => {
			expect(() => cancelTextEditing()).not.toThrow();
		});
	});

	describe('isEditingText', () => {
		it('returns true when editing', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			expect(isEditingText()).toBe(true);
		});

		it('returns false when not editing', () => {
			expect(isEditingText()).toBe(false);
		});

		it('returns false after canceling', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');
			cancelTextEditing();

			expect(isEditingText()).toBe(false);
		});
	});

	describe('getEditingShapeId', () => {
		it('returns shape ID when editing', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			expect(getEditingShapeId()).toBe('text-1');
		});

		it('returns null when not editing', () => {
			expect(getEditingShapeId()).toBeNull();
		});
	});

	describe('isShapeBeingEdited', () => {
		it('returns true for shape being edited', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			expect(isShapeBeingEdited('text-1')).toBe(true);
		});

		it('returns false for different shape', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			expect(isShapeBeingEdited('text-2')).toBe(false);
		});

		it('returns false when not editing', () => {
			expect(isShapeBeingEdited('text-1')).toBe(false);
		});
	});

	describe('createTextShapeAt', () => {
		it('creates a text shape at position', () => {
			const id = createTextShapeAt(100, 200);

			const state = get(shapesHistory);
			const shape = state.shapes.find((s) => s.id === id) as TextShape;

			expect(shape).toBeDefined();
			expect(shape.type).toBe('text');
			expect(shape.x).toBe(100);
			expect(shape.y).toBe(200);
		});

		it('uses default text', () => {
			const id = createTextShapeAt(100, 200);

			const state = get(shapesHistory);
			const shape = state.shapes.find((s) => s.id === id) as TextShape;

			expect(shape.text).toBe('Text');
		});

		it('uses custom initial text', () => {
			const id = createTextShapeAt(100, 200, 'Custom Text');

			const state = get(shapesHistory);
			const shape = state.shapes.find((s) => s.id === id) as TextShape;

			expect(shape.text).toBe('Custom Text');
		});

		it('applies custom options', () => {
			const id = createTextShapeAt(100, 200, 'Text', {
				fontSize: 24,
				fontFamily: 'Helvetica',
				align: 'center',
				stroke: '#ff0000'
			});

			const state = get(shapesHistory);
			const shape = state.shapes.find((s) => s.id === id) as TextShape;

			expect(shape.fontSize).toBe(24);
			expect(shape.fontFamily).toBe('Helvetica');
			expect(shape.align).toBe('center');
			expect(shape.stroke).toBe('#ff0000');
		});

		it('starts editing the new shape', () => {
			const id = createTextShapeAt(100, 200);

			expect(isEditingText()).toBe(true);
			expect(getEditingShapeId()).toBe(id);
		});
	});

	describe('addTextToShape', () => {
		it('adds text to rect', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const result = addTextToShape('rect-1', 'Label');

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as RectShape;
			expect(updated.text).toBe('Label');
		});

		it('adds text to ellipse', () => {
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([ellipse]);

			const result = addTextToShape('ellipse-1', 'Circle');

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as EllipseShape;
			expect(updated.text).toBe('Circle');
		});

		it('returns false for non-existent shape', () => {
			const result = addTextToShape('non-existent', 'Text');
			expect(result).toBe(false);
		});

		it('returns false for text shape', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);

			const result = addTextToShape('text-1', 'New Text');
			expect(result).toBe(false);
		});

		it('returns false for arrow shape', () => {
			const arrow = createArrow('arrow-1');
			shapesHistory.addShapes([arrow]);

			const result = addTextToShape('arrow-1', 'Text');
			expect(result).toBe(false);
		});
	});

	describe('removeTextFromShape', () => {
		it('removes text from rect', () => {
			const rect = createRect('rect-1', 'Label');
			shapesHistory.addShapes([rect]);

			const result = removeTextFromShape('rect-1');

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as RectShape;
			expect(updated.text).toBeUndefined();
		});

		it('removes text from ellipse', () => {
			const ellipse = createEllipse('ellipse-1', 'Circle');
			shapesHistory.addShapes([ellipse]);

			const result = removeTextFromShape('ellipse-1');

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as EllipseShape;
			expect(updated.text).toBeUndefined();
		});

		it('returns false when shape has no text', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const result = removeTextFromShape('rect-1');
			expect(result).toBe(false);
		});

		it('returns false for non-existent shape', () => {
			const result = removeTextFromShape('non-existent');
			expect(result).toBe(false);
		});
	});

	describe('getShapeText', () => {
		it('returns text from text shape', () => {
			const text = createText('text-1', 'Hello World');
			shapesHistory.addShapes([text]);

			expect(getShapeText('text-1')).toBe('Hello World');
		});

		it('returns text from rect', () => {
			const rect = createRect('rect-1', 'Label');
			shapesHistory.addShapes([rect]);

			expect(getShapeText('rect-1')).toBe('Label');
		});

		it('returns null for rect without text', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			expect(getShapeText('rect-1')).toBeNull();
		});

		it('returns null for non-existent shape', () => {
			expect(getShapeText('non-existent')).toBeNull();
		});

		it('returns null for arrow shape', () => {
			const arrow = createArrow('arrow-1');
			shapesHistory.addShapes([arrow]);

			expect(getShapeText('arrow-1')).toBeNull();
		});
	});

	describe('shapeSupportsTextEditing', () => {
		it('returns true for text shape', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);

			expect(shapeSupportsTextEditing('text-1')).toBe(true);
		});

		it('returns true for rect', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			expect(shapeSupportsTextEditing('rect-1')).toBe(true);
		});

		it('returns true for ellipse', () => {
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([ellipse]);

			expect(shapeSupportsTextEditing('ellipse-1')).toBe(true);
		});

		it('returns false for arrow', () => {
			const arrow = createArrow('arrow-1');
			shapesHistory.addShapes([arrow]);

			expect(shapeSupportsTextEditing('arrow-1')).toBe(false);
		});

		it('returns false for non-existent shape', () => {
			expect(shapeSupportsTextEditing('non-existent')).toBe(false);
		});
	});

	describe('updateEditingTextProperties', () => {
		it('updates font size', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			const result = updateEditingTextProperties({ fontSize: 24 });

			expect(result).toBe(true);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as TextShape;
			expect(updated.fontSize).toBe(24);
		});

		it('updates font family', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			updateEditingTextProperties({ fontFamily: 'Helvetica' });

			const state = get(shapesHistory);
			const updated = state.shapes[0] as TextShape;
			expect(updated.fontFamily).toBe('Helvetica');
		});

		it('updates text alignment', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			startTextEditing('text-1');

			updateEditingTextProperties({ align: 'center' });

			const state = get(shapesHistory);
			const updated = state.shapes[0] as TextShape;
			expect(updated.align).toBe('center');
		});

		it('returns false when not editing', () => {
			const result = updateEditingTextProperties({ fontSize: 24 });
			expect(result).toBe(false);
		});

		it('returns false when editing non-text shape', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			startTextEditing('rect-1');

			const result = updateEditingTextProperties({ fontSize: 24 });
			expect(result).toBe(false);
		});
	});
});
