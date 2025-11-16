// src/lib/canvas/engine/magnets.ts
import type {
	Shape,
	ArrowShape,
	AnchorSide,
	ArrowEndpoint,
	RectShape,
	EllipseShape,
	TextShape
} from '../model/shapes';

export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function getShapeBounds(shape: Shape): Bounds | null {
	switch (shape.type) {
		case 'rect': {
			const s = shape as RectShape;
			return {
				x: s.x - s.width / 2,
				y: s.y - s.height / 2,
				width: s.width,
				height: s.height
			};
		}
		case 'ellipse': {
			const s = shape as EllipseShape;
			return {
				x: s.x - s.rx,
				y: s.y - s.ry,
				width: s.rx * 2,
				height: s.ry * 2
			};
		}
		case 'text': {
			const s = shape as TextShape;
			const width = s.width ?? s.text.length * (s.fontSize * 0.6);
			const height = s.height ?? s.fontSize * 1.2;
			return {
				x: s.x - width / 2,
				y: s.y - height / 2,
				width,
				height
			};
		}
		default:
			return null;
	}
}

export function getAnchorPoint(bounds: Bounds, anchor: AnchorSide) {
	switch (anchor) {
		case 'top':
			return { x: bounds.x + bounds.width / 2, y: bounds.y };
		case 'bottom':
			return {
				x: bounds.x + bounds.width / 2,
				y: bounds.y + bounds.height
			};
		case 'left':
			return { x: bounds.x, y: bounds.y + bounds.height / 2 };
		case 'right':
			return {
				x: bounds.x + bounds.width,
				y: bounds.y + bounds.height / 2
			};
	}
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function findNearestAnchor(
	point: { x: number; y: number },
	shapes: Shape[],
	excludeId?: string,
	maxDistance = 40
): ArrowEndpoint | null {
	let best: { endpoint: ArrowEndpoint; d2: number } | null = null;
	const maxD2 = maxDistance * maxDistance;

	for (const s of shapes) {
		if (s.id === excludeId) continue;
		const bounds = getShapeBounds(s);
		if (!bounds) continue;

		const anchors: AnchorSide[] = ['top', 'bottom', 'left', 'right'];

		for (const anchor of anchors) {
			const p = getAnchorPoint(bounds, anchor);
			const d2 = dist2(point, p);
			if (d2 <= maxD2 && (!best || d2 < best.d2)) {
				best = { endpoint: { shapeId: s.id, anchor }, d2 };
			}
		}
	}

	return best?.endpoint ?? null;
}

export function attachArrowEndToNearestShape(
	arrow: ArrowShape,
	shapes: Shape[],
	end: 'from' | 'to',
	arrowPointWorld: { x: number; y: number },
	maxDistance = 40
): ArrowShape {
	const endpoint = findNearestAnchor(arrowPointWorld, shapes, arrow.id, maxDistance);

	if (!endpoint) {
		const { [end]: _ignored, ...rest } = arrow;
		return rest as ArrowShape;
	}

	return {
		...arrow,
		[end]: endpoint
	};
}
