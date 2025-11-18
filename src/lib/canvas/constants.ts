// Canvas constants

/**
 * Default font family for canvas text elements
 * Using Excalifont for handwritten-style similar to Excalidraw
 */
export const CANVAS_FONT_FAMILY = 'Excalifont, Virgil, Segoe Print, Comic Sans MS, cursive';

/**
 * Default font size for canvas text
 */
export const DEFAULT_FONT_SIZE = 20;

/**
 * Default line height multiplier for text (fontSize * LINE_HEIGHT_MULTIPLIER)
 */
export const LINE_HEIGHT_MULTIPLIER = 1.5;

/**
 * Default stroke width for shapes
 */
export const DEFAULT_STROKE_WIDTH = 2;

/**
 * Color palette for canvas shapes (softer, more pastel colors)
 */
export const CANVAS_COLORS = {
	// Stroke colors (softer than primary colors)
	strokes: [
		'#6b7280', // Gray
		'#f87171', // Soft red
		'#fb923c', // Soft orange
		'#fbbf24', // Soft yellow
		'#a3e635', // Soft lime
		'#4ade80', // Soft green
		'#22d3ee', // Soft cyan
		'#60a5fa', // Soft blue
		'#a78bfa', // Soft purple
		'#f472b6' // Soft pink
	],
	// Fill colors (lighter pastel versions)
	fills: [
		'#f3f4f6', // Light gray
		'#fee2e2', // Light red
		'#ffedd5', // Light orange
		'#fef3c7', // Light yellow
		'#ecfccb', // Light lime
		'#d1fae5', // Light green
		'#cffafe', // Light cyan
		'#dbeafe', // Light blue
		'#ede9fe', // Light purple
		'#fce7f3' // Light pink
	]
};
