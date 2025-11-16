// src/lib/canvas/properties.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	currentStyle,
	currentTextProperties,
	resetStyle,
	resetTextProperties,
	setStrokeColor,
	setStrokeWidth,
	setFillColor,
	setOpacity,
	setFontSize,
	setFontFamily,
	setTextAlign,
	applyStyleToSelection,
	applyTextPropertiesToSelection,
	getStyleFromSelection,
	getTextPropertiesFromSelection,
	pickStyleFromSelection,
	pickTextPropertiesFromSelection,
	updateSelectionProperty,
	COLOR_PRESETS,
	FONT_PRESETS,
	FONT_SIZE_PRESETS
} from './properties';
import { shapesHistory, setSelection } from './stores';
import type { RectShape, TextShape, EllipseShape } from './model/shapes';

describe('properties', () => {
	const createRect = (id: string): RectShape => ({
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
		fill: '#ffffff'
	});

	const createText = (id: string): TextShape => ({
		id,
		type: 'text',
		x: 150,
		y: 150,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		text: 'Hello',
		fontSize: 16,
		fontFamily: 'Arial',
		align: 'left'
	});

	const createEllipse = (id: string): EllipseShape => ({
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
		fill: '#00ff00'
	});

	beforeEach(() => {
		shapesHistory.setAllShapes([]);
		setSelection([]);
		resetStyle();
		resetTextProperties();
	});

	describe('currentStyle store', () => {
		it('has default values', () => {
			const style = get(currentStyle);
			expect(style.stroke).toBe('#000000');
			expect(style.strokeWidth).toBe(2);
			expect(style.fill).toBeNull();
			expect(style.opacity).toBe(1);
		});

		it('can be updated directly', () => {
			currentStyle.set({
				stroke: '#ff0000',
				strokeWidth: 5,
				fill: '#0000ff',
				opacity: 0.5
			});

			const style = get(currentStyle);
			expect(style.stroke).toBe('#ff0000');
			expect(style.strokeWidth).toBe(5);
			expect(style.fill).toBe('#0000ff');
			expect(style.opacity).toBe(0.5);
		});
	});

	describe('currentTextProperties store', () => {
		it('has default values', () => {
			const props = get(currentTextProperties);
			expect(props.fontSize).toBe(16);
			expect(props.fontFamily).toBe('Arial');
			expect(props.align).toBe('left');
		});

		it('can be updated directly', () => {
			currentTextProperties.set({
				fontSize: 24,
				fontFamily: 'Helvetica',
				align: 'center'
			});

			const props = get(currentTextProperties);
			expect(props.fontSize).toBe(24);
			expect(props.fontFamily).toBe('Helvetica');
			expect(props.align).toBe('center');
		});
	});

	describe('resetStyle', () => {
		it('resets style to defaults', () => {
			currentStyle.set({
				stroke: '#ff0000',
				strokeWidth: 10,
				fill: '#0000ff',
				opacity: 0.3
			});

			resetStyle();

			const style = get(currentStyle);
			expect(style.stroke).toBe('#000000');
			expect(style.strokeWidth).toBe(2);
			expect(style.fill).toBeNull();
			expect(style.opacity).toBe(1);
		});
	});

	describe('resetTextProperties', () => {
		it('resets text properties to defaults', () => {
			currentTextProperties.set({
				fontSize: 48,
				fontFamily: 'Times New Roman',
				align: 'right'
			});

			resetTextProperties();

			const props = get(currentTextProperties);
			expect(props.fontSize).toBe(16);
			expect(props.fontFamily).toBe('Arial');
			expect(props.align).toBe('left');
		});
	});

	describe('setStrokeColor', () => {
		it('updates stroke color', () => {
			setStrokeColor('#ff0000');
			expect(get(currentStyle).stroke).toBe('#ff0000');
		});

		it('preserves other style properties', () => {
			currentStyle.set({
				stroke: '#000000',
				strokeWidth: 5,
				fill: '#ffffff',
				opacity: 0.8
			});

			setStrokeColor('#ff0000');

			const style = get(currentStyle);
			expect(style.strokeWidth).toBe(5);
			expect(style.fill).toBe('#ffffff');
			expect(style.opacity).toBe(0.8);
		});
	});

	describe('setStrokeWidth', () => {
		it('updates stroke width', () => {
			setStrokeWidth(5);
			expect(get(currentStyle).strokeWidth).toBe(5);
		});

		it('ignores negative values', () => {
			setStrokeWidth(3);
			setStrokeWidth(-1);
			expect(get(currentStyle).strokeWidth).toBe(3);
		});

		it('allows zero width', () => {
			setStrokeWidth(0);
			expect(get(currentStyle).strokeWidth).toBe(0);
		});
	});

	describe('setFillColor', () => {
		it('updates fill color', () => {
			setFillColor('#ff0000');
			expect(get(currentStyle).fill).toBe('#ff0000');
		});

		it('allows null fill', () => {
			setFillColor('#ff0000');
			setFillColor(null);
			expect(get(currentStyle).fill).toBeNull();
		});
	});

	describe('setOpacity', () => {
		it('updates opacity', () => {
			setOpacity(0.5);
			expect(get(currentStyle).opacity).toBe(0.5);
		});

		it('ignores values below 0', () => {
			setOpacity(0.5);
			setOpacity(-0.1);
			expect(get(currentStyle).opacity).toBe(0.5);
		});

		it('ignores values above 1', () => {
			setOpacity(0.5);
			setOpacity(1.5);
			expect(get(currentStyle).opacity).toBe(0.5);
		});

		it('allows boundary values', () => {
			setOpacity(0);
			expect(get(currentStyle).opacity).toBe(0);

			setOpacity(1);
			expect(get(currentStyle).opacity).toBe(1);
		});
	});

	describe('setFontSize', () => {
		it('updates font size', () => {
			setFontSize(24);
			expect(get(currentTextProperties).fontSize).toBe(24);
		});

		it('ignores zero value', () => {
			setFontSize(16);
			setFontSize(0);
			expect(get(currentTextProperties).fontSize).toBe(16);
		});

		it('ignores negative values', () => {
			setFontSize(16);
			setFontSize(-10);
			expect(get(currentTextProperties).fontSize).toBe(16);
		});
	});

	describe('setFontFamily', () => {
		it('updates font family', () => {
			setFontFamily('Helvetica');
			expect(get(currentTextProperties).fontFamily).toBe('Helvetica');
		});

		it('ignores empty string', () => {
			setFontFamily('Helvetica');
			setFontFamily('');
			expect(get(currentTextProperties).fontFamily).toBe('Helvetica');
		});
	});

	describe('setTextAlign', () => {
		it('updates text alignment to center', () => {
			setTextAlign('center');
			expect(get(currentTextProperties).align).toBe('center');
		});

		it('updates text alignment to right', () => {
			setTextAlign('right');
			expect(get(currentTextProperties).align).toBe('right');
		});

		it('updates text alignment to left', () => {
			setTextAlign('right');
			setTextAlign('left');
			expect(get(currentTextProperties).align).toBe('left');
		});
	});

	describe('applyStyleToSelection', () => {
		it('applies style to selected shapes', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			setStrokeColor('#ff0000');
			setStrokeWidth(5);
			setFillColor('#0000ff');

			const count = applyStyleToSelection();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as RectShape;
			expect(updated.stroke).toBe('#ff0000');
			expect(updated.strokeWidth).toBe(5);
			expect(updated.fill).toBe('#0000ff');
		});

		it('returns 0 when nothing is selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = applyStyleToSelection();
			expect(count).toBe(0);
		});

		it('applies style to multiple shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			setStrokeColor('#ff0000');
			const count = applyStyleToSelection();

			expect(count).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes[0].stroke).toBe('#ff0000');
			expect(state.shapes[1].stroke).toBe('#ff0000');
		});
	});

	describe('applyTextPropertiesToSelection', () => {
		it('applies text properties to text shapes', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);
			setSelection(['text-1']);

			setFontSize(24);
			setFontFamily('Helvetica');
			setTextAlign('center');

			const count = applyTextPropertiesToSelection();

			expect(count).toBe(1);

			const state = get(shapesHistory);
			const updated = state.shapes[0] as TextShape;
			expect(updated.fontSize).toBe(24);
			expect(updated.fontFamily).toBe('Helvetica');
			expect(updated.align).toBe('center');
		});

		it('ignores non-text shapes', () => {
			const rect = createRect('rect-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, text]);
			setSelection(['rect-1', 'text-1']);

			setFontSize(32);
			const count = applyTextPropertiesToSelection();

			expect(count).toBe(1); // Only text shape updated

			const state = get(shapesHistory);
			const updatedText = state.shapes[1] as TextShape;
			expect(updatedText.fontSize).toBe(32);
		});

		it('returns 0 when nothing is selected', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);

			const count = applyTextPropertiesToSelection();
			expect(count).toBe(0);
		});
	});

	describe('getStyleFromSelection', () => {
		it('returns style from first selected shape', () => {
			const rect = createRect('rect-1');
			rect.stroke = '#ff0000';
			rect.strokeWidth = 5;
			rect.fill = '#0000ff';
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const style = getStyleFromSelection();

			expect(style).not.toBeNull();
			expect(style?.stroke).toBe('#ff0000');
			expect(style?.strokeWidth).toBe(5);
			expect(style?.fill).toBe('#0000ff');
		});

		it('returns null when nothing is selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const style = getStyleFromSelection();
			expect(style).toBeNull();
		});

		it('handles shapes without fill', () => {
			const rect = createRect('rect-1');
			delete (rect as RectShape & { fill?: string | null }).fill;
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const style = getStyleFromSelection();
			expect(style?.fill).toBeNull();
		});
	});

	describe('getTextPropertiesFromSelection', () => {
		it('returns text properties from text shape', () => {
			const text = createText('text-1');
			text.fontSize = 32;
			text.fontFamily = 'Helvetica';
			text.align = 'right';
			shapesHistory.addShapes([text]);
			setSelection(['text-1']);

			const props = getTextPropertiesFromSelection();

			expect(props).not.toBeNull();
			expect(props?.fontSize).toBe(32);
			expect(props?.fontFamily).toBe('Helvetica');
			expect(props?.align).toBe('right');
		});

		it('returns null when nothing is selected', () => {
			const text = createText('text-1');
			shapesHistory.addShapes([text]);

			const props = getTextPropertiesFromSelection();
			expect(props).toBeNull();
		});

		it('returns null when no text shapes in selection', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const props = getTextPropertiesFromSelection();
			expect(props).toBeNull();
		});

		it('finds text shape among mixed selection', () => {
			const rect = createRect('rect-1');
			const text = createText('text-1');
			text.fontSize = 48;
			shapesHistory.addShapes([rect, text]);
			setSelection(['rect-1', 'text-1']);

			const props = getTextPropertiesFromSelection();
			expect(props?.fontSize).toBe(48);
		});
	});

	describe('pickStyleFromSelection', () => {
		it('copies style from selection to current style', () => {
			const rect = createRect('rect-1');
			rect.stroke = '#ff0000';
			rect.strokeWidth = 10;
			rect.fill = '#00ff00';
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const result = pickStyleFromSelection();

			expect(result).toBe(true);

			const style = get(currentStyle);
			expect(style.stroke).toBe('#ff0000');
			expect(style.strokeWidth).toBe(10);
			expect(style.fill).toBe('#00ff00');
		});

		it('returns false when nothing is selected', () => {
			const result = pickStyleFromSelection();
			expect(result).toBe(false);
		});
	});

	describe('pickTextPropertiesFromSelection', () => {
		it('copies text properties from selection', () => {
			const text = createText('text-1');
			text.fontSize = 48;
			text.fontFamily = 'Georgia';
			text.align = 'center';
			shapesHistory.addShapes([text]);
			setSelection(['text-1']);

			const result = pickTextPropertiesFromSelection();

			expect(result).toBe(true);

			const props = get(currentTextProperties);
			expect(props.fontSize).toBe(48);
			expect(props.fontFamily).toBe('Georgia');
			expect(props.align).toBe('center');
		});

		it('returns false when no text shapes in selection', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const result = pickTextPropertiesFromSelection();
			expect(result).toBe(false);
		});
	});

	describe('updateSelectionProperty', () => {
		it('updates stroke color on selection', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = updateSelectionProperty('stroke', '#ff0000');

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].stroke).toBe('#ff0000');
		});

		it('updates stroke width on selection', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = updateSelectionProperty('strokeWidth', 10);

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].strokeWidth).toBe(10);
		});

		it('updates fill color on selection', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = updateSelectionProperty('fill', '#0000ff');

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].fill).toBe('#0000ff');
		});

		it('sets fill to null', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = updateSelectionProperty('fill', null);

			expect(count).toBe(1);

			const state = get(shapesHistory);
			expect(state.shapes[0].fill).toBeNull();
		});

		it('returns 0 when nothing is selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = updateSelectionProperty('stroke', '#ff0000');
			expect(count).toBe(0);
		});

		it('updates multiple shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const count = updateSelectionProperty('stroke', '#00ff00');

			expect(count).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes[0].stroke).toBe('#00ff00');
			expect(state.shapes[1].stroke).toBe('#00ff00');
		});
	});

	describe('presets', () => {
		it('COLOR_PRESETS contains common colors', () => {
			expect(COLOR_PRESETS).toContain('#000000'); // Black
			expect(COLOR_PRESETS).toContain('#ffffff'); // White
			expect(COLOR_PRESETS).toContain('#ff0000'); // Red
			expect(COLOR_PRESETS).toContain('#00ff00'); // Green
			expect(COLOR_PRESETS).toContain('#0000ff'); // Blue
			expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(12);
		});

		it('FONT_PRESETS contains common fonts', () => {
			expect(FONT_PRESETS).toContain('Arial');
			expect(FONT_PRESETS).toContain('Helvetica');
			expect(FONT_PRESETS).toContain('Times New Roman');
			expect(FONT_PRESETS.length).toBeGreaterThanOrEqual(5);
		});

		it('FONT_SIZE_PRESETS contains common sizes', () => {
			expect(FONT_SIZE_PRESETS).toContain(12);
			expect(FONT_SIZE_PRESETS).toContain(16);
			expect(FONT_SIZE_PRESETS).toContain(24);
			expect(FONT_SIZE_PRESETS).toContain(32);
			expect(FONT_SIZE_PRESETS.length).toBeGreaterThanOrEqual(10);
		});
	});
});
