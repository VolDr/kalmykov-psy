// src/lib/canvas/validation.ts
import { z } from 'zod';

console.log('[SCHEMA INIT] Loading validation schemas...');
console.log('[SCHEMA INIT] Zod version:', z.version || 'unknown');

// Base shape schema
const baseShapeSchema = z.object({
	id: z.string().uuid(),
	type: z.enum(['rect', 'ellipse', 'arrow', 'text', 'group']),
	x: z.number().finite(),
	y: z.number().finite(),
	rotation: z.number().finite(),
	scaleX: z.number().finite().positive(),
	scaleY: z.number().finite().positive(),
	stroke: z.string(),
	strokeWidth: z.number().nonnegative().finite(),
	fill: z.string().nullable().optional(),
	dash: z.array(z.number()).optional(),
	roughOptions: z.record(z.unknown()).optional()
});

// Rect shape schema
const rectShapeSchema = baseShapeSchema.extend({
	type: z.literal('rect'),
	width: z.number().positive(),
	height: z.number().positive(),
	text: z.string().optional()
});

// Ellipse shape schema
const ellipseShapeSchema = baseShapeSchema.extend({
	type: z.literal('ellipse'),
	rx: z.number().positive(),
	ry: z.number().positive(),
	text: z.string().optional()
});

// Text shape schema
const textShapeSchema = baseShapeSchema.extend({
	type: z.literal('text'),
	text: z.string(),
	fontSize: z.number().positive(),
	fontFamily: z.string(),
	align: z.enum(['left', 'center', 'right']),
	width: z.number().positive().optional(),
	height: z.number().positive().optional()
});

// Arrow endpoint schema
const arrowEndpointSchema = z.object({
	shapeId: z.string().uuid(),
	anchor: z.enum(['top', 'bottom', 'left', 'right']),
	offset: z.number().optional()
});

// Arrow shape schema
const arrowShapeSchema = baseShapeSchema.extend({
	type: z.literal('arrow'),
	points: z.array(z.tuple([z.number(), z.number()])).min(2),
	from: arrowEndpointSchema.optional(),
	to: arrowEndpointSchema.optional(),
	doubleEnded: z.boolean().optional(),
	curved: z.boolean().optional()
});

// Group shape schema
const groupShapeSchema = baseShapeSchema.extend({
	type: z.literal('group'),
	children: z.array(z.string().uuid())
});

// Union of all shapes
export const shapeSchema = z.discriminatedUnion('type', [
	rectShapeSchema,
	ellipseShapeSchema,
	textShapeSchema,
	arrowShapeSchema,
	groupShapeSchema
]);

// Camera schema
export const cameraSchema = z.object({
	x: z.number().finite(),
	y: z.number().finite(),
	scale: z.number().finite().positive()
});

// Scene data schema
export const sceneDataSchema = z.object({
	id: z.string().uuid(),
	shapes: z.array(shapeSchema).max(10000), // Limit to prevent abuse
	camera: cameraSchema
});

console.log('[SCHEMA INIT] All schemas initialized successfully');
console.log('[SCHEMA INIT] sceneDataSchema type:', typeof sceneDataSchema);
console.log('[SCHEMA INIT] sceneDataSchema._def:', sceneDataSchema._def ? 'exists' : 'MISSING');

// Validate scene data - returns result or throws
export function validateSceneData(data: unknown) {
	return sceneDataSchema.parse(data);
}

// Safe validation - returns result with success/error
export function safeValidateSceneData(data: unknown) {
	console.log('[VALIDATION] Starting safeValidateSceneData...');
	console.log('[VALIDATION] Input data type:', typeof data);
	console.log('[VALIDATION] Input data is array:', Array.isArray(data));
	console.log('[VALIDATION] Input data keys:', data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : 'N/A');

	try {
		console.log('[VALIDATION] Calling sceneDataSchema.safeParse...');
		const result = sceneDataSchema.safeParse(data);
		console.log('[VALIDATION] safeParse completed, success:', result.success);
		if (!result.success) {
			console.error('[VALIDATION] Validation errors:', JSON.stringify(result.error.issues, null, 2));
		}
		return result;
	} catch (err) {
		console.error('[VALIDATION] CRASH during safeParse:', err);
		console.error('[VALIDATION] CRASH stack:', err instanceof Error ? err.stack : 'No stack');
		throw err;
	}
}

export type ValidatedSceneData = z.infer<typeof sceneDataSchema>;
export type ValidatedShape = z.infer<typeof shapeSchema>;
