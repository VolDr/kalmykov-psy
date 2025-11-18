// src/lib/canvas/properties.ts
import { writable, get } from 'svelte/store';
import type { Shape } from './model/shapes';
import { shapesHistory, selection } from './stores';
import { CANVAS_FONT_FAMILY, DEFAULT_FONT_SIZE } from './constants';

/**
 * Default style properties for creating new shapes
 */
export interface StyleProperties {
	stroke: string;
	strokeWidth: number;
	fill: string | null;
	opacity: number;
	fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
}

/**
 * Text-specific properties
 */
export interface TextProperties {
	fontSize: number;
	fontFamily: string;
	align: 'left' | 'center' | 'right';
}

/**
 * Combined properties for shapes
 */
export interface ShapeProperties extends StyleProperties, TextProperties {}

const DEFAULT_STYLE: StyleProperties = {
	stroke: '#1971c2',
	strokeWidth: 2,
	fill: '#a5d8ff',
	opacity: 1,
	fillStyle: 'hachure'
};

const DEFAULT_TEXT: TextProperties = {
	fontSize: DEFAULT_FONT_SIZE,
	fontFamily: CANVAS_FONT_FAMILY,
	align: 'left'
};

/**
 * Store for current style properties (used when creating new shapes)
 */
export const currentStyle = writable<StyleProperties>({ ...DEFAULT_STYLE });

/**
 * Store for current text properties (used when creating new text shapes)
 */
export const currentTextProperties = writable<TextProperties>({ ...DEFAULT_TEXT });

/**
 * Reset style to defaults
 */
export function resetStyle(): void {
	currentStyle.set({ ...DEFAULT_STYLE });
}

/**
 * Reset text properties to defaults
 */
export function resetTextProperties(): void {
	currentTextProperties.set({ ...DEFAULT_TEXT });
}

/**
 * Set stroke color for current style
 */
export function setStrokeColor(color: string): void {
	currentStyle.update((s) => ({ ...s, stroke: color }));
}

/**
 * Set stroke width for current style
 */
export function setStrokeWidth(width: number): void {
	if (width < 0) return;
	currentStyle.update((s) => ({ ...s, strokeWidth: width }));
}

/**
 * Set fill color for current style
 */
export function setFillColor(color: string | null): void {
	currentStyle.update((s) => ({ ...s, fill: color }));
}

/**
 * Set opacity for current style
 */
export function setOpacity(opacity: number): void {
	if (opacity < 0 || opacity > 1) return;
	currentStyle.update((s) => ({ ...s, opacity }));
}

/**
 * Set fill style for current style (roughjs fill style)
 */
export function setFillStyle(
	fillStyle: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line'
): void {
	currentStyle.update((s) => ({ ...s, fillStyle }));
}

/**
 * Set font size for current text properties
 */
export function setFontSize(size: number): void {
	if (size <= 0) return;
	currentTextProperties.update((t) => ({ ...t, fontSize: size }));
}

/**
 * Set font family for current text properties
 */
export function setFontFamily(family: string): void {
	if (!family) return;
	currentTextProperties.update((t) => ({ ...t, fontFamily: family }));
}

/**
 * Set text alignment for current text properties
 */
export function setTextAlign(align: 'left' | 'center' | 'right'): void {
	currentTextProperties.update((t) => ({ ...t, align }));
}

/**
 * Apply current style to selected shapes
 * Returns the number of shapes updated
 */
export function applyStyleToSelection(): number {
	const sel = get(selection);
	const style = get(currentStyle);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const shapesToUpdate: Shape[] = [];

	for (const shape of historyState.shapes) {
		if (!selectedIds.includes(shape.id)) continue;

		const updated: Shape = {
			...shape,
			stroke: style.stroke,
			strokeWidth: style.strokeWidth,
			fill: style.fill
		};

		// Apply fillStyle to shapes that support roughOptions
		if (
			style.fillStyle &&
			(shape.type === 'rect' || shape.type === 'ellipse') &&
			shape.roughOptions
		) {
			updated.roughOptions = {
				...shape.roughOptions,
				fillStyle: style.fillStyle
			};
		}

		shapesToUpdate.push(updated);
	}

	if (shapesToUpdate.length > 0) {
		shapesHistory.updateShapes(shapesToUpdate);
	}

	return shapesToUpdate.length;
}

/**
 * Apply text properties to selected text shapes
 * Returns the number of shapes updated
 */
export function applyTextPropertiesToSelection(): number {
	const sel = get(selection);
	const textProps = get(currentTextProperties);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const shapesToUpdate: Shape[] = [];

	for (const shape of historyState.shapes) {
		if (!selectedIds.includes(shape.id)) continue;

		if (shape.type === 'text') {
			const updated: Shape = {
				...shape,
				fontSize: textProps.fontSize,
				fontFamily: textProps.fontFamily,
				align: textProps.align
			};
			shapesToUpdate.push(updated);
		}
	}

	if (shapesToUpdate.length > 0) {
		shapesHistory.updateShapes(shapesToUpdate);
	}

	return shapesToUpdate.length;
}

/**
 * Get style properties from the first selected shape
 * Useful for picking colors from existing shapes
 */
export function getStyleFromSelection(): StyleProperties | null {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return null;
	}

	const firstId = Array.from(sel.ids)[0];
	const shape = historyState.shapes.find((s) => s.id === firstId);

	if (!shape) {
		return null;
	}

	return {
		stroke: shape.stroke,
		strokeWidth: shape.strokeWidth,
		fill: shape.fill ?? null,
		opacity: 1 // Opacity is not currently stored on shapes
	};
}

/**
 * Get text properties from the first selected text shape
 */
export function getTextPropertiesFromSelection(): TextProperties | null {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return null;
	}

	const selectedIds = Array.from(sel.ids);

	for (const id of selectedIds) {
		const shape = historyState.shapes.find((s) => s.id === id);
		if (shape?.type === 'text') {
			return {
				fontSize: shape.fontSize,
				fontFamily: shape.fontFamily,
				align: shape.align
			};
		}
	}

	return null;
}

/**
 * Copy style from selection to current style
 */
export function pickStyleFromSelection(): boolean {
	const style = getStyleFromSelection();
	if (!style) {
		return false;
	}
	currentStyle.set(style);
	return true;
}

/**
 * Copy text properties from selection to current text properties
 */
export function pickTextPropertiesFromSelection(): boolean {
	const textProps = getTextPropertiesFromSelection();
	if (!textProps) {
		return false;
	}
	currentTextProperties.set(textProps);
	return true;
}

/**
 * Update a single property on selected shapes
 */
export function updateSelectionProperty(
	property: keyof StyleProperties,
	value: string | number | null
): number {
	const sel = get(selection);
	const historyState = get(shapesHistory);

	if (sel.ids.size === 0) {
		return 0;
	}

	const selectedIds = Array.from(sel.ids);
	const shapesToUpdate: Shape[] = [];

	for (const shape of historyState.shapes) {
		if (!selectedIds.includes(shape.id)) continue;

		if (property === 'opacity') {
			// Opacity is handled differently, skip for now
			continue;
		}

		const updated: Shape = {
			...shape,
			[property]: value
		};

		shapesToUpdate.push(updated);
	}

	if (shapesToUpdate.length > 0) {
		shapesHistory.updateShapes(shapesToUpdate);
	}

	return shapesToUpdate.length;
}

/**
 * Common color presets
 */
export const COLOR_PRESETS = [
	'#000000', // Black
	'#ffffff', // White
	'#ff0000', // Red
	'#00ff00', // Green
	'#0000ff', // Blue
	'#ffff00', // Yellow
	'#ff00ff', // Magenta
	'#00ffff', // Cyan
	'#ffa500', // Orange
	'#800080', // Purple
	'#008000', // Dark Green
	'#000080' // Navy
];

/**
 * Common font presets
 */
export const FONT_PRESETS = [
	'Arial',
	'Helvetica',
	'Times New Roman',
	'Courier New',
	'Verdana',
	'Georgia',
	'Trebuchet MS',
	'Impact'
];

/**
 * Common font size presets
 */
export const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];
