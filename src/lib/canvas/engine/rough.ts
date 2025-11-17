// src/lib/canvas/engine/rough.ts
import rough from 'roughjs';
import type { RectShape, EllipseShape } from '../model/shapes';

export interface RoughOptions {
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
function getCacheKey(shape: RectShape | EllipseShape): string {
	const opts = shape.roughOptions || {};
	if (shape.type === 'rect') {
		const rect = shape as RectShape;
		return `rect:${rect.width}:${rect.height}:${rect.stroke}:${rect.fill ?? 'none'}:${rect.strokeWidth}:${JSON.stringify(opts)}`;
	} else {
		const ellipse = shape as EllipseShape;
		return `ellipse:${ellipse.rx}:${ellipse.ry}:${ellipse.stroke}:${ellipse.fill ?? 'none'}:${ellipse.strokeWidth}:${JSON.stringify(opts)}`;
	}
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
	const opts: RoughOptions = rect.roughOptions || {};

	rc.rectangle(padding, padding, rect.width, rect.height, {
		roughness: opts.roughness ?? 1,
		bowing: opts.bowing ?? 1,
		seed: opts.seed,
		stroke: rect.stroke,
		strokeWidth: rect.strokeWidth,
		fill: rect.fill ?? undefined,
		fillStyle: opts.fillStyle ?? 'hachure',
		fillWeight: opts.fillWeight,
		hachureAngle: opts.hachureAngle,
		hachureGap: opts.hachureGap
	});

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
	const opts: RoughOptions = ellipse.roughOptions || {};

	rc.ellipse(padding + ellipse.rx, padding + ellipse.ry, ellipse.rx * 2, ellipse.ry * 2, {
		roughness: opts.roughness ?? 1,
		bowing: opts.bowing ?? 1,
		seed: opts.seed,
		stroke: ellipse.stroke,
		strokeWidth: ellipse.strokeWidth,
		fill: ellipse.fill ?? undefined,
		fillStyle: opts.fillStyle ?? 'hachure',
		fillWeight: opts.fillWeight,
		hachureAngle: opts.hachureAngle,
		hachureGap: opts.hachureGap
	});

	roughCache.set(cacheKey, canvas);
	return canvas;
}

// Clear cache when shape properties change
export function clearRoughCache(): void {
	roughCache.clear();
}

// Clear specific shape from cache
export function invalidateRoughShape(shape: RectShape | EllipseShape): void {
	const cacheKey = getCacheKey(shape);
	roughCache.delete(cacheKey);
}

// Get cache size for debugging
export function getRoughCacheSize(): number {
	return roughCache.size;
}

// Check if rough mode is enabled for a shape
export function isRoughEnabled(shape: RectShape | EllipseShape): boolean {
	return shape.roughOptions !== undefined && Object.keys(shape.roughOptions).length > 0;
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
