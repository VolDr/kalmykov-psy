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
			const height = s.height ?? s.fontSize * 1.5; // LINE_HEIGHT_MULTIPLIER
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

export function getAnchorPoint(
	bounds: Bounds,
	anchor: AnchorSide,
	offset?: number
): { x: number; y: number } {
	// If offset is provided, use it to position along the edge
	// Otherwise, use the center of the edge
	const ratio = offset !== undefined ? offset : 0.5;

	switch (anchor) {
		case 'top':
			return {
				x: bounds.x + bounds.width * ratio,
				y: bounds.y
			};
		case 'bottom':
			return {
				x: bounds.x + bounds.width * ratio,
				y: bounds.y + bounds.height
			};
		case 'left':
			return {
				x: bounds.x,
				y: bounds.y + bounds.height * ratio
			};
		case 'right':
			return {
				x: bounds.x + bounds.width,
				y: bounds.y + bounds.height * ratio
			};
	}
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

/**
 * Find the closest point on a shape's border to the given point.
 * Returns the anchor side and offset along that side.
 */
function findClosestBorderPoint(
	point: { x: number; y: number },
	bounds: Bounds
): { anchor: AnchorSide; offset: number; point: { x: number; y: number }; distance: number } {
	const { x, y, width, height } = bounds;

	// Check all four edges and find the closest point
	const edges: Array<{
		anchor: AnchorSide;
		closestPoint: { x: number; y: number };
		offset: number;
	}> = [
		// Top edge
		{
			anchor: 'top',
			closestPoint: {
				x: Math.max(x, Math.min(point.x, x + width)),
				y: y
			},
			offset: Math.max(0, Math.min(1, (Math.max(x, Math.min(point.x, x + width)) - x) / width))
		},
		// Bottom edge
		{
			anchor: 'bottom',
			closestPoint: {
				x: Math.max(x, Math.min(point.x, x + width)),
				y: y + height
			},
			offset: Math.max(0, Math.min(1, (Math.max(x, Math.min(point.x, x + width)) - x) / width))
		},
		// Left edge
		{
			anchor: 'left',
			closestPoint: {
				x: x,
				y: Math.max(y, Math.min(point.y, y + height))
			},
			offset: Math.max(0, Math.min(1, (Math.max(y, Math.min(point.y, y + height)) - y) / height))
		},
		// Right edge
		{
			anchor: 'right',
			closestPoint: {
				x: x + width,
				y: Math.max(y, Math.min(point.y, y + height))
			},
			offset: Math.max(0, Math.min(1, (Math.max(y, Math.min(point.y, y + height)) - y) / height))
		}
	];

	// Find the edge with minimum distance
	let minDistance = Infinity;
	let bestEdge = edges[0];

	for (const edge of edges) {
		const distance = Math.sqrt(dist2(point, edge.closestPoint));
		if (distance < minDistance) {
			minDistance = distance;
			bestEdge = edge;
		}
	}

	return {
		anchor: bestEdge.anchor,
		offset: bestEdge.offset,
		point: bestEdge.closestPoint,
		distance: minDistance
	};
}

export function findNearestAnchor(
	point: { x: number; y: number },
	shapes: Shape[],
	excludeId?: string,
	maxDistance = 40
): ArrowEndpoint | null {
	let best: { endpoint: ArrowEndpoint; distance: number } | null = null;

	for (const s of shapes) {
		if (s.id === excludeId) continue;
		const bounds = getShapeBounds(s);
		if (!bounds) continue;

		const closest = findClosestBorderPoint(point, bounds);

		if (closest.distance <= maxDistance && (!best || closest.distance < best.distance)) {
			best = {
				endpoint: {
					shapeId: s.id,
					anchor: closest.anchor,
					offset: closest.offset
				},
				distance: closest.distance
			};
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

/**
 * Update arrow endpoints to match their bound shape positions.
 * Call this when a shape moves to keep connected arrows attached.
 */
export function updateArrowBindings(arrow: ArrowShape, shapes: Shape[]): ArrowShape {
	let updated = { ...arrow };
	let pointsChanged = false;
	const newPoints = [...arrow.points];

	// Update 'from' endpoint (first point)
	if (arrow.from) {
		const targetShape = shapes.find((s) => s.id === arrow.from!.shapeId);
		if (targetShape) {
			const bounds = getShapeBounds(targetShape);
			if (bounds) {
				const anchorPoint = getAnchorPoint(bounds, arrow.from.anchor, arrow.from.offset);
				// Calculate new relative position
				newPoints[0] = [anchorPoint.x - arrow.x, anchorPoint.y - arrow.y];
				pointsChanged = true;
			}
		}
	}

	// Update 'to' endpoint (last point)
	if (arrow.to) {
		const targetShape = shapes.find((s) => s.id === arrow.to!.shapeId);
		if (targetShape) {
			const bounds = getShapeBounds(targetShape);
			if (bounds) {
				const anchorPoint = getAnchorPoint(bounds, arrow.to.anchor, arrow.to.offset);
				// Calculate new relative position
				const lastIdx = newPoints.length - 1;
				newPoints[lastIdx] = [anchorPoint.x - arrow.x, anchorPoint.y - arrow.y];
				pointsChanged = true;
			}
		}
	}

	if (pointsChanged) {
		updated = { ...updated, points: newPoints };
	}

	return updated;
}

/**
 * Find all arrows that are bound to a specific shape.
 */
export function findArrowsConnectedToShape(shapeId: string, shapes: Shape[]): ArrowShape[] {
	const connectedArrows: ArrowShape[] = [];

	for (const shape of shapes) {
		if (shape.type === 'arrow') {
			const arrow = shape as ArrowShape;
			if (arrow.from?.shapeId === shapeId || arrow.to?.shapeId === shapeId) {
				connectedArrows.push(arrow);
			}
		}
	}

	return connectedArrows;
}

/**
 * Update all arrows connected to moved shapes.
 * Returns the list of arrows that were updated.
 */
export function updateConnectedArrows(movedShapeIds: string[], shapes: Shape[]): ArrowShape[] {
	const updatedArrows: ArrowShape[] = [];
	const processedArrowIds = new Set<string>();

	for (const shapeId of movedShapeIds) {
		const connectedArrows = findArrowsConnectedToShape(shapeId, shapes);

		for (const arrow of connectedArrows) {
			if (processedArrowIds.has(arrow.id)) continue;
			processedArrowIds.add(arrow.id);

			const updatedArrow = updateArrowBindings(arrow, shapes);
			// Only add if something changed
			if (
				updatedArrow.points[0][0] !== arrow.points[0][0] ||
				updatedArrow.points[0][1] !== arrow.points[0][1] ||
				updatedArrow.points[updatedArrow.points.length - 1][0] !==
					arrow.points[arrow.points.length - 1][0] ||
				updatedArrow.points[updatedArrow.points.length - 1][1] !==
					arrow.points[arrow.points.length - 1][1]
			) {
				updatedArrows.push(updatedArrow);
			}
		}
	}

	return updatedArrows;
}

/**
 * Get expanded bounds for visual feedback during magneting.
 * Returns null if no shape is being targeted.
 */
export function getMagnetFeedbackBounds(
	point: { x: number; y: number },
	shapes: Shape[],
	excludeId?: string,
	maxDistance = 40
): { bounds: Bounds; shapeId: string } | null {
	const endpoint = findNearestAnchor(point, shapes, excludeId, maxDistance);
	if (!endpoint) return null;

	const targetShape = shapes.find((s) => s.id === endpoint.shapeId);
	if (!targetShape) return null;

	const bounds = getShapeBounds(targetShape);
	if (!bounds) return null;

	// Expand bounds slightly for visual feedback
	const padding = 8;
	return {
		bounds: {
			x: bounds.x - padding,
			y: bounds.y - padding,
			width: bounds.width + padding * 2,
			height: bounds.height + padding * 2
		},
		shapeId: endpoint.shapeId
	};
}
