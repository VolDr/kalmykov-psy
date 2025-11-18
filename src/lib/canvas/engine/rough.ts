// src/lib/canvas/engine/rough.ts
import rough from 'roughjs';
import type { RectShape, EllipseShape, ArrowShape } from '../model/shapes';

export interface RoughOptions extends Record<string, unknown> {
	roughness?: number; // 0-3, default 1
	bowing?: number; // 0-10, default 1
	seed?: number; // Random seed for consistency
	fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
	fillWeight?: number;
	hachureAngle?: number;
	hachureGap?: number;
}

// Cache for rendered rough shapes
const roughCache = new Map<string, HTMLCanvasElement>();

// Generate cache key from shape properties
function getCacheKey(shape: RectShape | EllipseShape | ArrowShape): string {
	const opts = shape.roughOptions || {};
	const dashKey = shape.dash ? JSON.stringify(shape.dash) : 'none';
	if (shape.type === 'rect') {
		const rect = shape as RectShape;
		return `rect:${rect.width}:${rect.height}:${rect.stroke}:${rect.fill ?? 'none'}:${rect.strokeWidth}:${dashKey}:${JSON.stringify(opts)}`;
	} else if (shape.type === 'ellipse') {
		const ellipse = shape as EllipseShape;
		return `ellipse:${ellipse.rx}:${ellipse.ry}:${ellipse.stroke}:${ellipse.fill ?? 'none'}:${ellipse.strokeWidth}:${dashKey}:${JSON.stringify(opts)}`;
	} else if (shape.type === 'arrow') {
		const arrow = shape as ArrowShape;
		const pointsStr = JSON.stringify(arrow.points);
		return `arrow:${pointsStr}:${arrow.stroke}:${arrow.strokeWidth}:${arrow.doubleEnded}:${arrow.curved}:${dashKey}:${JSON.stringify(opts)}`;
	}
	return '';
}

// Render rough rectangle to offscreen canvas
export function renderRoughRect(rect: RectShape): HTMLCanvasElement {
	const cacheKey = getCacheKey(rect);

	if (roughCache.has(cacheKey)) {
		return roughCache.get(cacheKey)!;
	}

	const padding = 20; // Extra space for rough edges
	const canvas = document.createElement('canvas');
	canvas.width = rect.width + padding * 2;
	canvas.height = rect.height + padding * 2;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Cannot get 2d context');
	}

	const rc = rough.canvas(canvas);
	const opts: RoughOptions = rect.roughOptions || createDefaultRoughOptions();

	// Only pass fill-related options if fill is defined
	const roughOpts: any = {
		roughness: opts.roughness ?? 1,
		bowing: opts.bowing ?? 1,
		seed: opts.seed,
		stroke: rect.stroke,
		strokeWidth: rect.strokeWidth
	};

	// Add dash support
	if (rect.dash && rect.dash.length > 0) {
		roughOpts.strokeLineDash = rect.dash;
	}

	// Add fill options only if fill is defined
	if (rect.fill !== null && rect.fill !== undefined) {
		roughOpts.fill = rect.fill;
		roughOpts.fillStyle = opts.fillStyle ?? 'hachure';
		if (opts.fillWeight !== undefined) roughOpts.fillWeight = opts.fillWeight;
		if (opts.hachureAngle !== undefined) roughOpts.hachureAngle = opts.hachureAngle;
		if (opts.hachureGap !== undefined) roughOpts.hachureGap = opts.hachureGap;
	}

	rc.rectangle(padding, padding, rect.width, rect.height, roughOpts);

	roughCache.set(cacheKey, canvas);
	return canvas;
}

// Render rough ellipse to offscreen canvas
export function renderRoughEllipse(ellipse: EllipseShape): HTMLCanvasElement {
	const cacheKey = getCacheKey(ellipse);

	if (roughCache.has(cacheKey)) {
		return roughCache.get(cacheKey)!;
	}

	const padding = 20; // Extra space for rough edges
	const canvas = document.createElement('canvas');
	canvas.width = ellipse.rx * 2 + padding * 2;
	canvas.height = ellipse.ry * 2 + padding * 2;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Cannot get 2d context');
	}

	const rc = rough.canvas(canvas);
	const opts: RoughOptions = ellipse.roughOptions || createDefaultRoughOptions();

	// Only pass fill-related options if fill is defined
	const roughOpts: any = {
		roughness: opts.roughness ?? 1,
		bowing: opts.bowing ?? 1,
		seed: opts.seed,
		stroke: ellipse.stroke,
		strokeWidth: ellipse.strokeWidth
	};

	// Add dash support
	if (ellipse.dash && ellipse.dash.length > 0) {
		roughOpts.strokeLineDash = ellipse.dash;
	}

	// Add fill options only if fill is defined
	if (ellipse.fill !== null && ellipse.fill !== undefined) {
		roughOpts.fill = ellipse.fill;
		roughOpts.fillStyle = opts.fillStyle ?? 'hachure';
		if (opts.fillWeight !== undefined) roughOpts.fillWeight = opts.fillWeight;
		if (opts.hachureAngle !== undefined) roughOpts.hachureAngle = opts.hachureAngle;
		if (opts.hachureGap !== undefined) roughOpts.hachureGap = opts.hachureGap;
	}

	rc.ellipse(padding + ellipse.rx, padding + ellipse.ry, ellipse.rx * 2, ellipse.ry * 2, roughOpts);

	roughCache.set(cacheKey, canvas);
	return canvas;
}

// Clear cache when shape properties change
export function clearRoughCache(): void {
	roughCache.clear();
}

// Clear specific shape from cache
export function invalidateRoughShape(shape: RectShape | EllipseShape | ArrowShape): void {
	const cacheKey = getCacheKey(shape);
	roughCache.delete(cacheKey);
}

// Get cache size for debugging
export function getRoughCacheSize(): number {
	return roughCache.size;
}

// Render rough arrow to offscreen canvas
export function renderRoughArrow(arrow: ArrowShape): HTMLCanvasElement {
	const cacheKey = getCacheKey(arrow);

	if (roughCache.has(cacheKey)) {
		return roughCache.get(cacheKey)!;
	}

	// Calculate bounding box for arrow points
	const allX = arrow.points.map((p) => p[0]);
	const allY = arrow.points.map((p) => p[1]);
	const minX = Math.min(...allX);
	const maxX = Math.max(...allX);
	const minY = Math.min(...allY);
	const maxY = Math.max(...allY);
	const width = maxX - minX;
	const height = maxY - minY;

	const padding = 30; // Extra space for rough edges and arrowheads
	const canvas = document.createElement('canvas');
	canvas.width = width + padding * 2;
	canvas.height = height + padding * 2;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Cannot get 2d context');
	}

	const rc = rough.canvas(canvas);
	const opts: RoughOptions = arrow.roughOptions || createDefaultRoughOptions();

	// Transform points to canvas coordinates
	const canvasPoints = arrow.points.map((p) => [p[0] - minX + padding, p[1] - minY + padding]) as [
		number,
		number
	][];

	if (arrow.curved && canvasPoints.length === 3) {
		// Render curved arrow using quadratic curve
		const [start, control, end] = canvasPoints;

		// Build curve options
		const curveOpts: any = {
			roughness: opts.roughness ?? 1,
			bowing: opts.bowing ?? 1,
			seed: opts.seed,
			stroke: arrow.stroke,
			strokeWidth: arrow.strokeWidth
		};

		// Add dash support
		if (arrow.dash && arrow.dash.length > 0) {
			curveOpts.strokeLineDash = arrow.dash;
		}

		// Draw the curved line
		rc.curve(
			[
				[start[0], start[1]],
				[control[0], control[1]],
				[end[0], end[1]]
			],
			curveOpts
		);

		// Draw arrowheads manually (rough.js doesn't have built-in arrowheads)
		// Calculate tangent at end for arrowhead angle
		const endDx = 2 * (end[0] - control[0]);
		const endDy = 2 * (end[1] - control[1]);
		const endAngle = Math.atan2(endDy, endDx);

		// Draw end arrowhead
		drawRoughArrowhead(rc, end[0], end[1], endAngle, arrow.stroke, arrow.strokeWidth, opts);

		if (arrow.doubleEnded) {
			// Calculate tangent at start for arrowhead angle
			const startDx = 2 * (control[0] - start[0]);
			const startDy = 2 * (control[1] - start[1]);
			const startAngle = Math.atan2(startDy, startDx);

			// Draw start arrowhead (pointing in opposite direction)
			drawRoughArrowhead(
				rc,
				start[0],
				start[1],
				startAngle + Math.PI,
				arrow.stroke,
				arrow.strokeWidth,
				opts
			);
		}
	} else {
		// Render straight arrow
		const flatPoints: [number, number][] = [];
		for (const point of canvasPoints) {
			flatPoints.push([point[0], point[1]]);
		}

		// Build linear path options
		const pathOpts: any = {
			roughness: opts.roughness ?? 1,
			bowing: opts.bowing ?? 1,
			seed: opts.seed,
			stroke: arrow.stroke,
			strokeWidth: arrow.strokeWidth
		};

		// Add dash support
		if (arrow.dash && arrow.dash.length > 0) {
			pathOpts.strokeLineDash = arrow.dash;
		}

		rc.linearPath(flatPoints, pathOpts);

		// Draw end arrowhead
		const lastIdx = canvasPoints.length - 1;
		const secondLastIdx = lastIdx - 1;
		const endAngle = Math.atan2(
			canvasPoints[lastIdx][1] - canvasPoints[secondLastIdx][1],
			canvasPoints[lastIdx][0] - canvasPoints[secondLastIdx][0]
		);

		drawRoughArrowhead(
			rc,
			canvasPoints[lastIdx][0],
			canvasPoints[lastIdx][1],
			endAngle,
			arrow.stroke,
			arrow.strokeWidth,
			opts
		);

		if (arrow.doubleEnded) {
			// Draw start arrowhead
			const startAngle = Math.atan2(
				canvasPoints[1][1] - canvasPoints[0][1],
				canvasPoints[1][0] - canvasPoints[0][0]
			);

			drawRoughArrowhead(
				rc,
				canvasPoints[0][0],
				canvasPoints[0][1],
				startAngle + Math.PI,
				arrow.stroke,
				arrow.strokeWidth,
				opts
			);
		}
	}

	roughCache.set(cacheKey, canvas);
	return canvas;
}

// Helper function to draw a rough arrowhead
function drawRoughArrowhead(
	rc: any,
	x: number,
	y: number,
	angle: number,
	stroke: string,
	strokeWidth: number,
	opts: RoughOptions
): void {
	const arrowLength = 10;
	const arrowWidth = 10;

	// Calculate arrowhead points
	const points: [number, number][] = [
		[x, y], // Tip
		[
			x - arrowLength * Math.cos(angle) + (arrowWidth / 2) * Math.sin(angle),
			y - arrowLength * Math.sin(angle) - (arrowWidth / 2) * Math.cos(angle)
		], // Left wing
		[
			x - arrowLength * Math.cos(angle) - (arrowWidth / 2) * Math.sin(angle),
			y - arrowLength * Math.sin(angle) + (arrowWidth / 2) * Math.cos(angle)
		], // Right wing
		[x, y] // Back to tip
	];

	rc.polygon(points, {
		roughness: opts.roughness ?? 1,
		bowing: opts.bowing ?? 1,
		seed: opts.seed,
		stroke: stroke,
		strokeWidth: strokeWidth,
		fill: stroke,
		fillStyle: 'solid'
	});
}

// Check if rough mode is enabled for a shape
// All shapes are now rendered in rough style by default
export function isRoughEnabled(shape: RectShape | EllipseShape | ArrowShape): boolean {
	return true;
}

// Create default rough options
export function createDefaultRoughOptions(): RoughOptions {
	return {
		roughness: 1,
		bowing: 1,
		fillStyle: 'hachure',
		seed: Math.floor(Math.random() * 2147483647)
	};
}
