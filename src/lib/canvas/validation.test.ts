// src/lib/canvas/validation.test.ts
import { describe, it, expect } from 'vitest';
import {
	shapeSchema,
	cameraSchema,
	sceneDataSchema,
	validateSceneData,
	safeValidateSceneData
} from './validation';

describe('validation', () => {
	describe('shapeSchema', () => {
		const validBaseFields = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			x: 100,
			y: 200,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#000000',
			strokeWidth: 2
		};

		describe('rect shape', () => {
			it('validates valid rect shape', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates rect with optional text', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: 50,
					text: 'Label'
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates rect with optional fill', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: 50,
					fill: '#ffffff'
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates rect with null fill', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: 50,
					fill: null
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('rejects rect with missing width', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('rejects rect with zero width', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 0,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('rejects rect with negative height', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: -50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});
		});

		describe('ellipse shape', () => {
			it('validates valid ellipse shape', () => {
				const ellipse = {
					...validBaseFields,
					type: 'ellipse',
					rx: 50,
					ry: 30
				};
				const result = shapeSchema.safeParse(ellipse);
				expect(result.success).toBe(true);
			});

			it('validates ellipse with optional text', () => {
				const ellipse = {
					...validBaseFields,
					type: 'ellipse',
					rx: 50,
					ry: 30,
					text: 'Circle Label'
				};
				const result = shapeSchema.safeParse(ellipse);
				expect(result.success).toBe(true);
			});

			it('rejects ellipse with missing rx', () => {
				const ellipse = {
					...validBaseFields,
					type: 'ellipse',
					ry: 30
				};
				const result = shapeSchema.safeParse(ellipse);
				expect(result.success).toBe(false);
			});

			it('rejects ellipse with zero ry', () => {
				const ellipse = {
					...validBaseFields,
					type: 'ellipse',
					rx: 50,
					ry: 0
				};
				const result = shapeSchema.safeParse(ellipse);
				expect(result.success).toBe(false);
			});
		});

		describe('text shape', () => {
			it('validates valid text shape', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Hello World',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'left'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(true);
			});

			it('validates text with center alignment', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Centered',
					fontSize: 24,
					fontFamily: 'Helvetica',
					align: 'center'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(true);
			});

			it('validates text with right alignment', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Right',
					fontSize: 12,
					fontFamily: 'Times New Roman',
					align: 'right'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(true);
			});

			it('validates text with optional width and height', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Fixed Size',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'left',
					width: 200,
					height: 50
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(true);
			});

			it('rejects text with missing text content', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'left'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(false);
			});

			it('rejects text with invalid alignment', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Hello',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'justify'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(false);
			});

			it('rejects text with zero fontSize', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Hello',
					fontSize: 0,
					fontFamily: 'Arial',
					align: 'left'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(false);
			});

			it('rejects text with negative fontSize', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: 'Hello',
					fontSize: -16,
					fontFamily: 'Arial',
					align: 'left'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(false);
			});

			it('validates text with empty string', () => {
				const text = {
					...validBaseFields,
					type: 'text',
					text: '',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'left'
				};
				const result = shapeSchema.safeParse(text);
				expect(result.success).toBe(true);
			});
		});

		describe('arrow shape', () => {
			it('validates valid arrow shape with minimum 2 points', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					]
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(true);
			});

			it('validates arrow with multiple points', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[50, 25],
						[100, 100]
					]
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(true);
			});

			it('validates arrow with from endpoint', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					],
					from: {
						shapeId: '550e8400-e29b-41d4-a716-446655440001',
						anchor: 'right'
					}
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(true);
			});

			it('validates arrow with to endpoint', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					],
					to: {
						shapeId: '550e8400-e29b-41d4-a716-446655440002',
						anchor: 'left'
					}
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(true);
			});

			it('validates arrow with both endpoints', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					],
					from: {
						shapeId: '550e8400-e29b-41d4-a716-446655440001',
						anchor: 'bottom'
					},
					to: {
						shapeId: '550e8400-e29b-41d4-a716-446655440002',
						anchor: 'top'
					}
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(true);
			});

			it('validates all anchor types', () => {
				const anchors = ['top', 'bottom', 'left', 'right'] as const;
				for (const anchor of anchors) {
					const arrow = {
						...validBaseFields,
						type: 'arrow',
						points: [
							[0, 0],
							[100, 100]
						],
						from: {
							shapeId: '550e8400-e29b-41d4-a716-446655440001',
							anchor
						}
					};
					const result = shapeSchema.safeParse(arrow);
					expect(result.success).toBe(true);
				}
			});

			it('rejects arrow with only 1 point', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [[0, 0]]
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(false);
			});

			it('rejects arrow with empty points array', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: []
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(false);
			});

			it('rejects arrow with invalid anchor type', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					],
					from: {
						shapeId: '550e8400-e29b-41d4-a716-446655440001',
						anchor: 'center'
					}
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(false);
			});

			it('rejects arrow with invalid shapeId in endpoint', () => {
				const arrow = {
					...validBaseFields,
					type: 'arrow',
					points: [
						[0, 0],
						[100, 100]
					],
					from: {
						shapeId: 'not-a-uuid',
						anchor: 'top'
					}
				};
				const result = shapeSchema.safeParse(arrow);
				expect(result.success).toBe(false);
			});
		});

		describe('group shape', () => {
			it('validates valid group shape', () => {
				const group = {
					...validBaseFields,
					type: 'group',
					children: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
				};
				const result = shapeSchema.safeParse(group);
				expect(result.success).toBe(true);
			});

			it('validates group with empty children array', () => {
				const group = {
					...validBaseFields,
					type: 'group',
					children: []
				};
				const result = shapeSchema.safeParse(group);
				expect(result.success).toBe(true);
			});

			it('validates group with single child', () => {
				const group = {
					...validBaseFields,
					type: 'group',
					children: ['550e8400-e29b-41d4-a716-446655440001']
				};
				const result = shapeSchema.safeParse(group);
				expect(result.success).toBe(true);
			});

			it('rejects group with invalid child id', () => {
				const group = {
					...validBaseFields,
					type: 'group',
					children: ['not-a-uuid']
				};
				const result = shapeSchema.safeParse(group);
				expect(result.success).toBe(false);
			});

			it('rejects group with missing children', () => {
				const group = {
					...validBaseFields,
					type: 'group'
				};
				const result = shapeSchema.safeParse(group);
				expect(result.success).toBe(false);
			});
		});

		describe('base shape fields', () => {
			it('validates shape with roughOptions', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					width: 100,
					height: 50,
					roughOptions: {}
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('rejects shape with invalid UUID', () => {
				const rect = {
					...validBaseFields,
					id: 'invalid-uuid',
					type: 'rect',
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('rejects shape with invalid type', () => {
				const shape = {
					...validBaseFields,
					type: 'invalid',
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(shape);
				expect(result.success).toBe(false);
			});

			it('rejects shape with negative scaleX', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					scaleX: -1,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('rejects shape with zero scaleY', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					scaleY: 0,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('rejects shape with negative strokeWidth', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					strokeWidth: -2,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(false);
			});

			it('validates shape with zero strokeWidth', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					strokeWidth: 0,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates shape with negative x and y', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					x: -100,
					y: -200,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates shape with rotation', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					rotation: 45,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});

			it('validates shape with negative rotation', () => {
				const rect = {
					...validBaseFields,
					type: 'rect',
					rotation: -90,
					width: 100,
					height: 50
				};
				const result = shapeSchema.safeParse(rect);
				expect(result.success).toBe(true);
			});
		});
	});

	describe('cameraSchema', () => {
		it('validates valid camera', () => {
			const camera = { x: 0, y: 0, scale: 1 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(true);
		});

		it('validates camera with negative position', () => {
			const camera = { x: -500, y: -300, scale: 1 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(true);
		});

		it('validates camera with different scale', () => {
			const camera = { x: 100, y: 200, scale: 2.5 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(true);
		});

		it('validates camera with very small scale', () => {
			const camera = { x: 0, y: 0, scale: 0.1 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(true);
		});

		it('rejects camera with zero scale', () => {
			const camera = { x: 0, y: 0, scale: 0 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(false);
		});

		it('rejects camera with negative scale', () => {
			const camera = { x: 0, y: 0, scale: -1 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(false);
		});

		it('rejects camera with missing scale', () => {
			const camera = { x: 0, y: 0 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(false);
		});

		it('rejects camera with missing x', () => {
			const camera = { y: 0, scale: 1 };
			const result = cameraSchema.safeParse(camera);
			expect(result.success).toBe(false);
		});
	});

	describe('sceneDataSchema', () => {
		const validRect = {
			id: '550e8400-e29b-41d4-a716-446655440001',
			type: 'rect' as const,
			x: 100,
			y: 100,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#000000',
			strokeWidth: 2,
			width: 100,
			height: 50
		};

		const validScene = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			shapes: [validRect],
			camera: { x: 0, y: 0, scale: 1 }
		};

		it('validates valid scene data', () => {
			const result = sceneDataSchema.safeParse(validScene);
			expect(result.success).toBe(true);
		});

		it('validates scene with empty shapes array', () => {
			const scene = {
				...validScene,
				shapes: []
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(true);
		});

		it('validates scene with multiple shapes', () => {
			const scene = {
				...validScene,
				shapes: [
					validRect,
					{
						...validRect,
						id: '550e8400-e29b-41d4-a716-446655440002',
						type: 'ellipse' as const,
						rx: 50,
						ry: 30
					}
				]
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(true);
		});

		it('rejects scene with invalid shape', () => {
			const scene = {
				...validScene,
				shapes: [{ ...validRect, width: -100 }]
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('rejects scene with invalid id', () => {
			const scene = {
				...validScene,
				id: 'not-a-uuid'
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('rejects scene with invalid camera', () => {
			const scene = {
				...validScene,
				camera: { x: 0, y: 0, scale: 0 }
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('rejects scene with missing shapes', () => {
			const scene = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				camera: { x: 0, y: 0, scale: 1 }
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('rejects scene with missing camera', () => {
			const scene = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				shapes: []
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('rejects scene with too many shapes (over 10000)', () => {
			const shapes = Array.from({ length: 10001 }, (_, i) => ({
				...validRect,
				id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
			}));
			const scene = {
				...validScene,
				shapes
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(false);
		});

		it('validates scene with exactly 10000 shapes', () => {
			const shapes = Array.from({ length: 10000 }, (_, i) => ({
				...validRect,
				id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
			}));
			const scene = {
				...validScene,
				shapes
			};
			const result = sceneDataSchema.safeParse(scene);
			expect(result.success).toBe(true);
		});
	});

	describe('validateSceneData', () => {
		const validScene = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			shapes: [],
			camera: { x: 0, y: 0, scale: 1 }
		};

		it('returns parsed data for valid scene', () => {
			const result = validateSceneData(validScene);
			expect(result).toEqual(validScene);
		});

		it('throws error for invalid scene', () => {
			const invalidScene = {
				id: 'not-a-uuid',
				shapes: [],
				camera: { x: 0, y: 0, scale: 1 }
			};
			expect(() => validateSceneData(invalidScene)).toThrow();
		});

		it('throws error for null input', () => {
			expect(() => validateSceneData(null)).toThrow();
		});

		it('throws error for undefined input', () => {
			expect(() => validateSceneData(undefined)).toThrow();
		});

		it('throws error for non-object input', () => {
			expect(() => validateSceneData('string')).toThrow();
		});
	});

	describe('safeValidateSceneData', () => {
		const validScene = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			shapes: [],
			camera: { x: 0, y: 0, scale: 1 }
		};

		it('returns success result for valid scene', () => {
			const result = safeValidateSceneData(validScene);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validScene);
			}
		});

		it('returns error result for invalid scene', () => {
			const invalidScene = {
				id: 'not-a-uuid',
				shapes: [],
				camera: { x: 0, y: 0, scale: 1 }
			};
			const result = safeValidateSceneData(invalidScene);
			expect(result.success).toBe(false);
		});

		it('returns error result for null input', () => {
			const result = safeValidateSceneData(null);
			expect(result.success).toBe(false);
		});

		it('returns error result for undefined input', () => {
			const result = safeValidateSceneData(undefined);
			expect(result.success).toBe(false);
		});

		it('returns error result with details', () => {
			const invalidScene = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				shapes: [],
				camera: { x: 0, y: 0, scale: -1 }
			};
			const result = safeValidateSceneData(invalidScene);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
			}
		});
	});
});
