// src/lib/canvas/model/shapes.ts

export type PrimitiveType = 'rect' | 'ellipse' | 'arrow' | 'text' | 'group';

export interface BaseShape {
	id: string;
	type: PrimitiveType;

	x: number;
	y: number;

	rotation: number;
	scaleX: number;
	scaleY: number;

	stroke: string;
	strokeWidth: number;
	fill?: string | null;
	dash?: number[]; // Dash array for dashed lines [dashLength, gapLength]

	// Hook for Rough.js integration
	// When implementing Rough.js, add rough options here:
	// roughness, bowing, seed, etc.
	roughOptions?: Record<string, unknown>;
}

export interface RectShape extends BaseShape {
	type: 'rect';
	width: number;
	height: number;
	text?: string;
}

export interface EllipseShape extends BaseShape {
	type: 'ellipse';
	rx: number;
	ry: number;
	text?: string;
}

export interface TextShape extends BaseShape {
	type: 'text';
	text: string;
	fontSize: number;
	fontFamily: string;
	align: 'left' | 'center' | 'right';
	width?: number;
	height?: number;
}

export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';

export interface ArrowEndpoint {
	shapeId: string;
	anchor: AnchorSide;
	// Position along the side (0 = start, 0.5 = center, 1 = end)
	// This allows arrows to snap anywhere along a shape's edge, not just the center
	offset?: number;
}

export interface ArrowShape extends BaseShape {
	type: 'arrow';
	points: [number, number][];
	from?: ArrowEndpoint;
	to?: ArrowEndpoint;
	doubleEnded?: boolean; // Arrow head at both ends
	curved?: boolean; // Use quadratic bezier curve (middle point is control point)
}

export interface GroupShape extends BaseShape {
	type: 'group';
	children: string[];
}

export type Shape = RectShape | EllipseShape | TextShape | ArrowShape | GroupShape;

export interface Camera {
	x: number;
	y: number;
	scale: number;
}

export interface SceneData {
	id: string;
	shapes: Shape[];
	camera: Camera;
}
