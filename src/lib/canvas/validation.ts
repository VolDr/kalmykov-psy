// src/lib/canvas/validation.ts
import { z } from 'zod';

// Base shape schema with more lenient validation
const baseShapeSchema = z.object({
	id: z.string().uuid(),
	type: z.enum(['rect', 'ellipse', 'arrow', 'text', 'group']),
	x: z.number().finite(),
	y: z.number().finite(),
	rotation: z.number().finite(),
	scaleX: z.number().finite().positive().catch(1), // Default to 1 if invalid
	scaleY: z.number().finite().positive().catch(1), // Default to 1 if invalid
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

// Camera schema with lenient validation
export const cameraSchema = z.object({
	x: z.number().finite(),
	y: z.number().finite(),
	scale: z.number().finite().positive().catch(1) // Default to 1 if invalid
});

// Scene data schema
export const sceneDataSchema = z.object({
	id: z.string().uuid(),
	shapes: z.array(shapeSchema).max(10000), // Limit to prevent abuse
	camera: cameraSchema
});

// Validate scene data - returns result or throws
export function validateSceneData(data: unknown) {
	return sceneDataSchema.parse(data);
}

// Safe validation - returns result with success/error
export function safeValidateSceneData(data: unknown) {
	return sceneDataSchema.safeParse(data);
}

export type ValidatedSceneData = z.infer<typeof sceneDataSchema>;
export type ValidatedShape = z.infer<typeof shapeSchema>;
