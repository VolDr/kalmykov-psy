<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Stage,
		Layer,
		Rect,
		Ellipse,
		Text as KonvaText,
		Line,
		Arrow,
		Group,
		Circle,
		Transformer
	} from 'svelte-konva';
	import type { Stage as KonvaStage, Layer as KonvaLayer } from 'konva/lib/index-types';
	import type { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';
	import type { Node as KonvaNode } from 'konva/lib/Node';

	import {
		shapesHistory,
		selection,
		camera,
		toggleSelection,
		clearSelection,
		currentTool,
		setTool,
		getToolCursor,
		type ToolMode
	} from '../stores';
	import { attachArrowEndToNearestShape } from '../engine/magnets';
	import type {
		Shape,
		RectShape,
		EllipseShape,
		TextShape,
		ArrowShape,
		GroupShape
	} from '../model/shapes';
	import {
		createSyncClient,
		createSyncedHistoryStore,
		type SyncClient,
		type ConnectionStatus
	} from '../sync/client';
	import {
		generateClientId,
		createAddShapesOp,
		createUpdateShapesOp,
		createDeleteShapesOp,
		type Presence
	} from '../sync/types';
	import Toolbar from './Toolbar.svelte';

	// Import new modules for integration
	import { handleKeyboardEvent } from '../keyboard';
	import {
		copySelectedShapes,
		cutSelectedShapes,
		pasteShapes,
		duplicateSelectedShapes
	} from '../clipboard';
	import {
		groupSelectedShapes,
		ungroupSelectedShapes,
		canGroupSelection,
		selectionContainsGroups
	} from '../grouping';
	import {
		startTextEditing,
		commitTextEditing,
		cancelTextEditing,
		isEditingText,
		textEditingState,
		updateEditingText
	} from '../text-editing';
	import {
		bringToFront,
		sendToBack,
		bringForward,
		sendBackward
	} from '../layers';
	import {
		alignLeft,
		alignRight,
		alignCenterHorizontal,
		alignTop,
		alignBottom,
		alignCenterVertical,
		distributeHorizontally,
		distributeVertically
	} from '../alignment';

	// Props for multiplayer mode
	interface Props {
		multiplayer?: boolean;
		wsUrl?: string;
		sceneId?: string;
		userId?: string;
		userName?: string;
	}

	let {
		multiplayer = false,
		wsUrl = '',
		sceneId = '',
		userId = undefined,
		userName = undefined
	}: Props = $props();

	let stageRef: KonvaStage | null = $state(null);
	let layerRef: KonvaLayer | null = $state(null);
	let transformerRef: KonvaTransformer | null = $state(null);

	// Component refs for svelte-konva v1
	let stageComponent: { node: KonvaStage } | null = $state(null);
	let layerComponent: { node: KonvaLayer } | null = $state(null);
	let transformerComponent: { node: KonvaTransformer } | null = $state(null);

	// Map to store shape node references for transformer (deprecated - now using Layer.findOne)
	// let shapeRefs: Map<string, KonvaNode> = $state(new Map());

	let shapes: Shape[] = $state([]);
	let selectedIds: Set<string> = $state(new Set());
	let cam = $state({ x: 0, y: 0, scale: 1 });

	// Tool state
	let tool: ToolMode = $state('select');

	// Drawing state
	let isDrawing = $state(false);
	let drawingStart = $state({ x: 0, y: 0 });
	let previewShape: Shape | null = $state(null);

	// Box selection state
	let isBoxSelecting = $state(false);
	let boxSelectStart = $state({ x: 0, y: 0 });
	let boxSelectEnd = $state({ x: 0, y: 0 });

	// Multiplayer state
	let syncClient: SyncClient | null = $state(null);
	let clientId = $state('');
	let connectionStatus: ConnectionStatus = $state('disconnected');
	let remotePresences: Map<string, Presence> = $state(new Map());
	let localCursor = $state({ x: 0, y: 0 });

	// Text editing state
	let editingText = $state(false);
	let editingShapeId: string | null = $state(null);
	let editingTextContent = $state('');

	// Color palette for remote users
	const userColors = [
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#96CEB4',
		'#FFEAA7',
		'#DDA0DD',
		'#98D8C8',
		'#F7DC6F'
	];

	function getUserColor(cId: string): string {
		const hash = cId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
		return userColors[Math.abs(hash) % userColors.length];
	}

	// Responsive canvas dimensions
	let stageWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 800);
	let stageHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 600);

	function updateDimensions() {
		if (typeof window !== 'undefined') {
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
		}
	}

	console.log('[Canvas] Component script initializing');

	const unsubscribeShapes = shapesHistory.subscribe((state) => {
		console.log('[Canvas] shapes updated', { count: state.shapes.length, shapes: state.shapes });
		shapes = state.shapes;
	});
	const unsubscribeSel = selection.subscribe((s) => {
		console.log('[Canvas] selection updated', { ids: Array.from(s.ids) });
		selectedIds = s.ids;
		// Broadcast selection change to other clients
		if (syncClient && multiplayer) {
			syncClient.sendPresence({ selectedIds: Array.from(s.ids) });
		}
	});
	const unsubscribeCam = camera.subscribe((c) => {
		console.log('[Canvas] camera updated', c);
		cam = c;
	});
	const unsubscribeTool = currentTool.subscribe((t) => {
		console.log('[Canvas] tool changed', { tool: t });
		tool = t;
		// Clear drawing state when tool changes
		isDrawing = false;
		previewShape = null;
	});

	// Subscribe to text editing state
	const unsubscribeTextEditing = textEditingState.subscribe((state) => {
		editingText = state.isEditing;
		editingShapeId = state.shapeId;
		editingTextContent = state.currentText;
	});

	// Sync component refs to node refs
	$effect(() => {
		if (stageComponent?.node) {
			stageRef = stageComponent.node;
			console.log('[Canvas] Stage ref synced from component');
		}
	});

	$effect(() => {
		if (layerComponent?.node) {
			layerRef = layerComponent.node;
			console.log('[Canvas] Layer ref synced from component');
		}
	});

	$effect(() => {
		if (transformerComponent?.node) {
			transformerRef = transformerComponent.node;
			console.log('[Canvas] Transformer ref synced from component');
		}
	});

	// Update transformer nodes when selection changes
	$effect(() => {
		if (!transformerRef || !layerRef) return;

		const nodes: KonvaNode[] = [];
		for (const id of selectedIds) {
			// Find the node by ID in the layer
			const node = layerRef.findOne(`#${id}`);
			if (node) {
				nodes.push(node);
			}
		}

		console.log('[Canvas] Updating transformer nodes', {
			selectedIds: Array.from(selectedIds),
			foundNodes: nodes.length
		});

		transformerRef.nodes(nodes);
		transformerRef.getLayer()?.batchDraw();
	});

	// Cleanup on destroy
	onDestroy(() => {
		unsubscribeShapes();
		unsubscribeSel();
		unsubscribeCam();
		unsubscribeTool();
		unsubscribeTextEditing();
		if (syncClient) {
			syncClient.destroy();
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', updateDimensions);
		}
	});

	// Initialize multiplayer connection
	$effect(() => {
		if (multiplayer && wsUrl && sceneId && typeof window !== 'undefined') {
			clientId = generateClientId();

			syncClient = createSyncClient({
				url: wsUrl,
				sceneId,
				clientId,
				historyStore: shapesHistory,
				cameraStore: camera,
				userId,
				userName
			});

			// Subscribe to connection status
			const unsubStatus = syncClient.status.subscribe((status) => {
				connectionStatus = status;
			});

			// Subscribe to remote presences
			const unsubPresences = syncClient.remotePresences.subscribe((presences) => {
				remotePresences = presences;
			});

			// Connect to server
			syncClient.connect();

			return () => {
				unsubStatus();
				unsubPresences();
				if (syncClient) {
					syncClient.destroy();
					syncClient = null;
				}
			};
		}
	});

	// === Panning with mouse wheel (zoom to cursor) ===
	function handleWheel(e: any) {
		const evt = e.evt as WheelEvent;
		evt.preventDefault?.();

		if (!stageRef) return;

		const scaleBy = 1.05;
		const oldScale = cam.scale;

		// Calculate mouse position in world coordinates BEFORE zoom
		// Use cam.x/cam.y since the transform is applied to the Layer, not Stage
		const mousePointTo = {
			x: (evt.offsetX - cam.x) / oldScale,
			y: (evt.offsetY - cam.y) / oldScale
		};

		const newScale = evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

		// Calculate new camera position so that the point under cursor stays fixed
		const newPos = {
			x: evt.offsetX - mousePointTo.x * newScale,
			y: evt.offsetY - mousePointTo.y * newScale
		};

		camera.set({ ...cam, scale: newScale, x: newPos.x, y: newPos.y });
	}

	// === Pan scene with middle mouse button or Shift+Alt+drag ===
	let isPanning = $state(false);
	let lastPos = $state({ x: 0, y: 0 });

	function handleMouseDown(e: any) {
		const evt = e.evt as MouseEvent;
		console.log('[Canvas] mousedown', { button: evt.button, tool, shiftKey: evt.shiftKey, altKey: evt.altKey });
		if (evt.button === 1 || (evt.button === 0 && evt.shiftKey && evt.altKey)) {
			isPanning = true;
			lastPos = { x: evt.clientX, y: evt.clientY };
		} else if (evt.button === 0 && tool !== 'select' && tool !== 'pan') {
			// Start drawing for shape tools
			const world = screenToWorld(evt.offsetX, evt.offsetY);
			console.log('[Canvas] starting drawing', { tool, world });
			handleDrawingStart(world.x, world.y);
		} else if (evt.button === 0 && tool === 'pan') {
			// Pan mode - start panning
			isPanning = true;
			lastPos = { x: evt.clientX, y: evt.clientY };
		} else if (evt.button === 0 && tool === 'select') {
			// In select mode, clicking on stage starts box selection
			const stage = stageRef?.getStage ? stageRef.getStage() : stageRef;
			if (e.target === stage) {
				const world = screenToWorld(evt.offsetX, evt.offsetY);
				isBoxSelecting = true;
				boxSelectStart = { x: world.x, y: world.y };
				boxSelectEnd = { x: world.x, y: world.y };
			}
		}
	}

	function handleMouseMove(e: any) {
		const evt = e.evt as MouseEvent;

		// Update local cursor position for presence (in world coordinates)
		const world = screenToWorld(evt.offsetX, evt.offsetY);
		if (stageRef && multiplayer && syncClient) {
			localCursor = { x: world.x, y: world.y };
			syncClient.sendPresence({ cursor: localCursor });
		}

		// Handle drawing preview
		if (isDrawing) {
			handleDrawingMove(world.x, world.y);
		}

		// Handle box selection
		if (isBoxSelecting) {
			boxSelectEnd = { x: world.x, y: world.y };
		}

		if (!isPanning) return;
		const dx = evt.clientX - lastPos.x;
		const dy = evt.clientY - lastPos.y;
		lastPos = { x: evt.clientX, y: evt.clientY };
		camera.set({ ...cam, x: cam.x + dx, y: cam.y + dy });
	}

	function handleMouseUp(e: any) {
		const evt = e.evt as MouseEvent;
		console.log('[Canvas] mouseup', { isDrawing, isPanning, isBoxSelecting });
		isPanning = false;

		// Finish drawing
		if (isDrawing) {
			const world = screenToWorld(evt.offsetX, evt.offsetY);
			console.log('[Canvas] finishing drawing', { world });
			handleDrawingEnd(world.x, world.y);
		}

		// Finish box selection
		if (isBoxSelecting) {
			const world = screenToWorld(evt.offsetX, evt.offsetY);
			boxSelectEnd = { x: world.x, y: world.y };

			const selectedShapeIds = getShapesInBox(
				boxSelectStart.x,
				boxSelectStart.y,
				boxSelectEnd.x,
				boxSelectEnd.y
			);

			if (selectedShapeIds.length > 0) {
				if (evt.shiftKey) {
					// Add to existing selection
					selection.update((s) => {
						const ids = new Set(s.ids);
						for (const id of selectedShapeIds) {
							ids.add(id);
						}
						return { ids };
					});
				} else if (evt.altKey) {
					// Remove from existing selection
					selection.update((s) => {
						const ids = new Set(s.ids);
						for (const id of selectedShapeIds) {
							ids.delete(id);
						}
						return { ids };
					});
				} else {
					// Replace selection
					selection.set({ ids: new Set(selectedShapeIds) });
				}
			} else if (!evt.shiftKey && !evt.altKey) {
				// No shapes selected and no modifier - clear selection
				clearSelection();
			}

			isBoxSelecting = false;
		}
	}

	function handleStageClick(e: any) {
		// Don't handle click if box selection was just performed
		// Box selection handles selection in handleMouseUp
		// This prevents double handling of selection
	}

	function isSelected(id: string) {
		return selectedIds.has(id);
	}

	// === Shape handlers ===

	function onShapeClick(shapeId: string, e: any) {
		const evt = e.evt as MouseEvent;
		toggleSelection(shapeId, evt.ctrlKey || evt.metaKey);
		e.cancelBubble = true;
	}

	// Handle shape transformation (resize/rotate)
	function onTransformEnd() {
		if (!transformerRef) return;

		const nodes = transformerRef.nodes();
		const updatedShapes: Shape[] = [];

		for (const node of nodes) {
			const shapeId = node.id();
			const shape = shapes.find((s) => s.id === shapeId);
			if (!shape) continue;

			// Get the new transformation values
			const scaleX = node.scaleX();
			const scaleY = node.scaleY();
			const rotation = node.rotation();
			const x = node.x();
			const y = node.y();

			let updated: Shape;

			if (shape.type === 'rect') {
				const rect = shape as RectShape;
				// Apply scale to actual dimensions and reset scale
				updated = {
					...rect,
					x,
					y,
					width: rect.width * scaleX,
					height: rect.height * scaleY,
					rotation,
					scaleX: 1,
					scaleY: 1
				};
				// Reset node scale after applying to dimensions
				node.scaleX(1);
				node.scaleY(1);
			} else if (shape.type === 'ellipse') {
				const ellipse = shape as EllipseShape;
				updated = {
					...ellipse,
					x,
					y,
					rx: ellipse.rx * scaleX,
					ry: ellipse.ry * scaleY,
					rotation,
					scaleX: 1,
					scaleY: 1
				};
				node.scaleX(1);
				node.scaleY(1);
			} else if (shape.type === 'text') {
				const text = shape as TextShape;
				updated = {
					...text,
					x,
					y,
					rotation,
					scaleX,
					scaleY
				};
			} else {
				// For other shapes, just update position and rotation
				updated = {
					...shape,
					x,
					y,
					rotation,
					scaleX,
					scaleY
				};
			}

			updatedShapes.push(updated);
		}

		if (updatedShapes.length > 0) {
			shapesHistory.updateShapes(updatedShapes);

			// Broadcast to other clients
			if (syncClient && multiplayer) {
				const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
				syncClient.sendOperation(op);
			}
		}
	}

	function onShapeDragEnd(shape: Shape, e: any) {
		const node = e.target;
		const pos = node.position();

		const updated: Shape = {
			...shape,
			x: pos.x,
			y: pos.y
		};

		shapesHistory.updateShapes([updated]);

		// Broadcast to other clients
		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, [updated]);
			syncClient.sendOperation(op);
		}
	}

	// Arrow drag end - snap to nearest shape
	function onArrowDragEnd(arrow: ArrowShape, e: any) {
		const node = e.target;
		const pos = node.position();
		const points = arrow.points;

		// Arrow end point in world coordinates
		const lastPoint = points[points.length - 1];
		const endPointWorld = {
			x: pos.x + lastPoint[0],
			y: pos.y + lastPoint[1]
		};

		const attached = attachArrowEndToNearestShape(
			{ ...arrow, x: pos.x, y: pos.y },
			shapes,
			'to',
			endPointWorld,
			40
		);

		shapesHistory.updateShapes([attached]);

		// Broadcast to other clients
		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, [attached]);
			syncClient.sendOperation(op);
		}
	}

	// === Hotkeys (RU/EN - by code) ===

	function handleKeyDown(e: KeyboardEvent) {
		// Handle text editing input
		if (editingText && editingShapeId) {
			// Let text input handle its own keys
			if (e.code === 'Escape') {
				e.preventDefault();
				cancelTextEditing();
				return;
			}
			if (e.code === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				commitTextEditing();
				return;
			}
			// Don't intercept other keys during text editing
			return;
		}

		// Use the new keyboard manager for all shortcuts
		const handled = handleKeyboardEvent(e);

		// If keyboard manager handled it, we're done
		if (handled) {
			// Broadcast operations to multiplayer if needed
			// The keyboard manager already executed the action
			return;
		}
	}

	// Handle double-click for text editing
	function handleDoubleClick(shapeId: string) {
		const shape = shapes.find((s) => s.id === shapeId);
		if (!shape) return;

		// Start text editing for shapes that support it
		if (shape.type === 'text' || shape.type === 'rect' || shape.type === 'ellipse') {
			startTextEditing(shapeId);
		}
	}

	// Handle text input change
	function handleTextInput(e: Event) {
		const target = e.target as HTMLInputElement;
		updateEditingText(target.value);
	}

	// Commit text editing on blur
	function handleTextBlur() {
		if (editingText) {
			commitTextEditing();
		}
	}

	// Get screen position for text editing overlay
	function getEditingInputPosition(): { x: number; y: number; width: number; height: number } | null {
		if (!editingShapeId) return null;

		const shape = shapes.find((s) => s.id === editingShapeId);
		if (!shape) return null;

		const bounds = getShapeBounds(shape);

		// Convert world coordinates to screen coordinates
		const screenX = bounds.x * cam.scale + cam.x;
		const screenY = bounds.y * cam.scale + cam.y;
		const screenWidth = bounds.width * cam.scale;
		const screenHeight = bounds.height * cam.scale;

		return {
			x: screenX,
			y: screenY,
			width: Math.max(screenWidth, 100),
			height: Math.max(screenHeight, 30)
		};
	}

	onMount(() => {
		console.log('[Canvas] onMount called', {
			stageWidth,
			stageHeight,
			shapesCount: shapes.length,
			tool,
			cam
		});
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			window.addEventListener('resize', updateDimensions);
		}
	});

	// Register shape node reference for transformer (deprecated - now using Layer.findOne)
	// function registerShapeRef(shapeId: string, node: KonvaNode | null) {
	// 	if (node) {
	// 		shapeRefs.set(shapeId, node);
	// 	} else {
	// 		shapeRefs.delete(shapeId);
	// 	}
	// }

	// Render helpers
	function renderRect(rect: RectShape) {
		return {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height
		};
	}

	function renderEllipse(el: EllipseShape) {
		return {
			x: el.x,
			y: el.y,
			radiusX: el.rx,
			radiusY: el.ry
		};
	}

	function renderArrow(arrow: ArrowShape) {
		// Konva Line takes points: [x1, y1, x2, y2, ...] in local coordinates
		const flat: number[] = [];
		for (const [px, py] of arrow.points) {
			flat.push(px, py);
		}
		return { points: flat };
	}

	// Helper to convert screen coordinates to world coordinates
	function screenToWorld(screenX: number, screenY: number) {
		// Use cam.x/cam.y since the transform is applied to the Layer, not Stage
		// Stage coordinates are always (0, 0)
		return {
			x: (screenX - cam.x) / cam.scale,
			y: (screenY - cam.y) / cam.scale
		};
	}

	// Create a new shape based on drawing bounds
	function createShapeFromBounds(
		toolType: ToolMode,
		startX: number,
		startY: number,
		endX: number,
		endY: number
	): Shape | null {
		const minX = Math.min(startX, endX);
		const minY = Math.min(startY, endY);
		let width = Math.abs(endX - startX);
		let height = Math.abs(endY - startY);

		// If click without drag, create shape with default size
		const isClick = width < 5 && height < 5;
		if (isClick) {
			// Default sizes for different shape types
			switch (toolType) {
				case 'rect':
					width = 100;
					height = 80;
					break;
				case 'ellipse':
					width = 100;
					height = 80;
					break;
				case 'arrow':
					width = 100;
					height = 0;
					break;
				case 'text':
					width = 100;
					height = 24;
					break;
				default:
					return null;
			}
		}

		const baseShape = {
			id: crypto.randomUUID(),
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#000000',
			strokeWidth: 2
		};

		// For click, center the shape at click position
		const centerX = isClick ? startX : minX + width / 2;
		const centerY = isClick ? startY : minY + height / 2;

		switch (toolType) {
			case 'rect':
				return {
					...baseShape,
					type: 'rect',
					x: centerX,
					y: centerY,
					width,
					height
				} as RectShape;

			case 'ellipse':
				return {
					...baseShape,
					type: 'ellipse',
					x: centerX,
					y: centerY,
					rx: width / 2,
					ry: height / 2
				} as EllipseShape;

			case 'arrow':
				return {
					...baseShape,
					type: 'arrow',
					x: startX,
					y: startY,
					points: [
						[0, 0],
						[isClick ? width : endX - startX, isClick ? height : endY - startY]
					]
				} as ArrowShape;

			case 'text':
				return {
					...baseShape,
					type: 'text',
					x: centerX,
					y: centerY,
					text: 'Text',
					fontSize: 16,
					fontFamily: 'Arial',
					align: 'center',
					width,
					height
				} as TextShape;

			default:
				return null;
		}
	}

	// Handle drawing start
	function handleDrawingStart(worldX: number, worldY: number) {
		if (tool === 'select' || tool === 'pan') return;

		isDrawing = true;
		drawingStart = { x: worldX, y: worldY };

		// Create preview shape
		previewShape = createShapeFromBounds(tool, worldX, worldY, worldX, worldY);
	}

	// Handle drawing move
	function handleDrawingMove(worldX: number, worldY: number) {
		if (!isDrawing || tool === 'select' || tool === 'pan') return;

		// Update preview shape
		previewShape = createShapeFromBounds(tool, drawingStart.x, drawingStart.y, worldX, worldY);
	}

	// Handle drawing end
	function handleDrawingEnd(worldX: number, worldY: number) {
		console.log('[Canvas] handleDrawingEnd', { isDrawing, tool, worldX, worldY, drawingStart });
		if (!isDrawing || tool === 'select' || tool === 'pan') return;

		isDrawing = false;

		const newShape = createShapeFromBounds(tool, drawingStart.x, drawingStart.y, worldX, worldY);
		console.log('[Canvas] created shape', newShape);
		if (newShape) {
			shapesHistory.addShapes([newShape]);

			// Broadcast to other clients
			if (syncClient && multiplayer) {
				const op = createAddShapesOp(sceneId, clientId, [newShape]);
				syncClient.sendOperation(op);
			}

			// Select the new shape
			selection.set({ ids: new Set([newShape.id]) });
		}

		previewShape = null;

		// Switch back to select tool after drawing
		setTool('select');
	}

	// Get shape bounding box
	function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
		if (shape.type === 'rect') {
			const rect = shape as RectShape;
			return {
				x: rect.x - rect.width / 2,
				y: rect.y - rect.height / 2,
				width: rect.width,
				height: rect.height
			};
		} else if (shape.type === 'ellipse') {
			const ellipse = shape as EllipseShape;
			return {
				x: ellipse.x - ellipse.rx,
				y: ellipse.y - ellipse.ry,
				width: ellipse.rx * 2,
				height: ellipse.ry * 2
			};
		} else if (shape.type === 'text') {
			const text = shape as TextShape;
			const width = text.width ?? text.text.length * text.fontSize * 0.6;
			const height = text.height ?? text.fontSize * 1.2;
			return {
				x: text.x - width / 2,
				y: text.y - height / 2,
				width,
				height
			};
		} else if (shape.type === 'arrow') {
			const arrow = shape as ArrowShape;
			const points = arrow.points.map(([px, py]) => ({
				x: arrow.x + px,
				y: arrow.y + py
			}));
			const minX = Math.min(...points.map((p) => p.x));
			const minY = Math.min(...points.map((p) => p.y));
			const maxX = Math.max(...points.map((p) => p.x));
			const maxY = Math.max(...points.map((p) => p.y));
			return {
				x: minX,
				y: minY,
				width: maxX - minX,
				height: maxY - minY
			};
		}
		return { x: shape.x, y: shape.y, width: 0, height: 0 };
	}

	// Check if two rectangles intersect
	function rectsIntersect(
		r1: { x: number; y: number; width: number; height: number },
		r2: { x: number; y: number; width: number; height: number }
	): boolean {
		return !(
			r2.x > r1.x + r1.width ||
			r2.x + r2.width < r1.x ||
			r2.y > r1.y + r1.height ||
			r2.y + r2.height < r1.y
		);
	}

	// Get shapes that intersect with a selection box
	function getShapesInBox(
		boxStartX: number,
		boxStartY: number,
		boxEndX: number,
		boxEndY: number
	): string[] {
		const selectionRect = {
			x: Math.min(boxStartX, boxEndX),
			y: Math.min(boxStartY, boxEndY),
			width: Math.abs(boxEndX - boxStartX),
			height: Math.abs(boxEndY - boxStartY)
		};

		const intersectingIds: string[] = [];
		for (const shape of shapes) {
			const shapeBounds = getShapeBounds(shape);
			if (rectsIntersect(selectionRect, shapeBounds)) {
				intersectingIds.push(shape.id);
			}
		}
		return intersectingIds;
	}

	// ROUGH.JS HOOK:
	// To integrate Rough.js for hand-drawn style:
	// 1. Import rough from 'roughjs'
	// 2. Create offscreen canvas
	// 3. Use rough.canvas(offscreenCanvas) to draw shapes
	// 4. Convert to Konva.Image and render instead of Rect/Ellipse
	// Example:
	// import rough from 'roughjs';
	// const rc = rough.canvas(offscreenCanvas);
	// rc.rectangle(10, 10, 100, 100, { roughness: 2.8, fill: 'blue' });
	// Then use Konva.Image with the offscreen canvas as image source

	// Helper to get remote presences as array for rendering
	function getRemotePresencesArray(): Presence[] {
		return Array.from(remotePresences.values());
	}

	// Connection status color
	function getStatusColor(): string {
		switch (connectionStatus) {
			case 'connected':
				return '#22C55E'; // green
			case 'connecting':
				return '#F59E0B'; // yellow
			case 'reconnecting':
				return '#EF4444'; // red
			default:
				return '#6B7280'; // gray
		}
	}

	function getStatusText(): string {
		switch (connectionStatus) {
			case 'connected':
				return 'Online';
			case 'connecting':
				return 'Connecting...';
			case 'reconnecting':
				return 'Reconnecting...';
			default:
				return 'Offline';
		}
	}
</script>

<div class="relative h-full w-full" style="cursor: {getToolCursor(tool)}">
	<!-- Toolbar -->
	<Toolbar />

	<!-- Connection status indicator -->
	{#if multiplayer}
		<div class="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-md">
			<div
				class="h-3 w-3 rounded-full"
				style="background-color: {getStatusColor()}"
			></div>
			<span class="text-sm font-medium">{getStatusText()}</span>
			{#if remotePresences.size > 0}
				<span class="text-xs text-gray-500">({remotePresences.size} online)</span>
			{/if}
		</div>
	{/if}

	<Stage
		bind:this={stageComponent}
		width={stageWidth}
		height={stageHeight}
		onwheel={handleWheel}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onclick={handleStageClick}
	>
		<Layer
			bind:this={layerComponent}
			x={cam.x}
			y={cam.y}
			scaleX={cam.scale}
			scaleY={cam.scale}
		>
			{#each shapes as shape (shape.id)}
				{#if shape.type === 'rect'}
					{@const rect = shape as RectShape}
					<Rect
						id={rect.id}
						x={rect.x}
						y={rect.y}
						width={rect.width}
						height={rect.height}
						offsetX={rect.width / 2}
						offsetY={rect.height / 2}
						stroke={rect.stroke}
						strokeWidth={rect.strokeWidth}
						fill={rect.fill ?? undefined}
						rotation={rect.rotation}
						draggable={true}
						opacity={isSelected(rect.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(rect.id, e)}
						ondblclick={() => handleDoubleClick(rect.id)}
						ondragend={(e) => onShapeDragEnd(rect, e)}
					/>
					{#if rect.text}
						<KonvaText
							x={rect.x}
							y={rect.y}
							offsetX={rect.width / 2}
							offsetY={rect.height / 2}
							width={rect.width}
							height={rect.height}
							align="center"
							verticalAlign="middle"
							text={rect.text}
							fontSize={14}
							listening={false}
						/>
					{/if}
				{:else if shape.type === 'ellipse'}
					{@const el = shape as EllipseShape}
					<Ellipse
						id={el.id}
						x={el.x}
						y={el.y}
						radiusX={el.rx}
						radiusY={el.ry}
						stroke={el.stroke}
						strokeWidth={el.strokeWidth}
						fill={el.fill ?? undefined}
						rotation={el.rotation}
						draggable={true}
						opacity={isSelected(el.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(el.id, e)}
						ondblclick={() => handleDoubleClick(el.id)}
						ondragend={(e) => onShapeDragEnd(el, e)}
					/>
					{#if el.text}
						<KonvaText
							x={el.x}
							y={el.y}
							offsetX={el.rx}
							offsetY={el.ry}
							width={el.rx * 2}
							height={el.ry * 2}
							align="center"
							verticalAlign="middle"
							text={el.text}
							fontSize={14}
							listening={false}
						/>
					{/if}
				{:else if shape.type === 'text'}
					{@const t = shape as TextShape}
					<KonvaText
						id={t.id}
						x={t.x}
						y={t.y}
						offsetX={(t.width ?? t.text.length * t.fontSize * 0.6) / 2}
						offsetY={(t.height ?? t.fontSize * 1.2) / 2}
						text={t.text}
						fontSize={t.fontSize}
						fontFamily={t.fontFamily}
						align={t.align}
						draggable={true}
						opacity={isSelected(t.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(t.id, e)}
						ondblclick={() => handleDoubleClick(t.id)}
						ondragend={(e) => onShapeDragEnd(t, e)}
					/>
				{:else if shape.type === 'arrow'}
					{@const a = shape as ArrowShape}
					<Arrow
						id={a.id}
						x={a.x}
						y={a.y}
						points={renderArrow(a).points}
						stroke={a.stroke}
						strokeWidth={a.strokeWidth}
						fill={a.stroke}
						lineCap="round"
						lineJoin="round"
						pointerLength={10}
						pointerWidth={10}
						draggable={true}
						opacity={isSelected(a.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(a.id, e)}
						ondragend={(e) => onArrowDragEnd(a, e)}
					/>
				{:else if shape.type === 'group'}
					{@const g = shape as GroupShape}
					<Group
						x={g.x}
						y={g.y}
						rotation={g.rotation}
						scaleX={g.scaleX}
						scaleY={g.scaleY}
						draggable={true}
						opacity={isSelected(g.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(g.id, e)}
						ondragend={(e) => onShapeDragEnd(g, e)}
					>
						<!-- Group children are rendered by looking up child shapes -->
						{#each g.children as childId}
							{@const child = shapes.find((s) => s.id === childId)}
							{#if child?.type === 'rect'}
								{@const rect = child as RectShape}
								<Rect
									x={rect.x - g.x}
									y={rect.y - g.y}
									width={rect.width}
									height={rect.height}
									offsetX={rect.width / 2}
									offsetY={rect.height / 2}
									stroke={rect.stroke}
									strokeWidth={rect.strokeWidth}
									fill={rect.fill ?? undefined}
									rotation={rect.rotation}
								/>
							{/if}
						{/each}
					</Group>
				{/if}
			{/each}

			<!-- Transformer for selected shapes -->
			<Transformer
				bind:this={transformerComponent}
				boundBoxFunc={(
					oldBox: { x: number; y: number; width: number; height: number; rotation: number },
					newBox: { x: number; y: number; width: number; height: number; rotation: number }
				) => {
					// Limit minimum size
					if (newBox.width < 10 || newBox.height < 10) {
						return oldBox;
					}
					return newBox;
				}}
				enabledAnchors={[
					'top-left',
					'top-center',
					'top-right',
					'middle-right',
					'bottom-right',
					'bottom-center',
					'bottom-left',
					'middle-left'
				]}
				rotateEnabled={true}
				keepRatio={false}
				ontransformend={onTransformEnd}
			/>

			<!-- Preview shape while drawing -->
			{#if previewShape && isDrawing}
				{#if previewShape.type === 'rect'}
					{@const rect = previewShape as RectShape}
					<Rect
						x={rect.x}
						y={rect.y}
						width={rect.width}
						height={rect.height}
						offsetX={rect.width / 2}
						offsetY={rect.height / 2}
						stroke={rect.stroke}
						strokeWidth={rect.strokeWidth}
						opacity={0.5}
						dash={[10, 5]}
						listening={false}
					/>
				{:else if previewShape.type === 'ellipse'}
					{@const el = previewShape as EllipseShape}
					<Ellipse
						x={el.x}
						y={el.y}
						radiusX={el.rx}
						radiusY={el.ry}
						offsetX={el.rx}
						offsetY={el.ry}
						stroke={el.stroke}
						strokeWidth={el.strokeWidth}
						opacity={0.5}
						dash={[10, 5]}
						listening={false}
					/>
				{:else if previewShape.type === 'arrow'}
					{@const a = previewShape as ArrowShape}
					<Arrow
						x={a.x}
						y={a.y}
						points={renderArrow(a).points}
						stroke={a.stroke}
						strokeWidth={a.strokeWidth}
						fill={a.stroke}
						opacity={0.5}
						dash={[10, 5]}
						listening={false}
					/>
				{:else if previewShape.type === 'text'}
					{@const t = previewShape as TextShape}
					<KonvaText
						x={t.x}
						y={t.y}
						offsetX={(t.width ?? 50) / 2}
						offsetY={(t.height ?? 20) / 2}
						text={t.text}
						fontSize={t.fontSize}
						opacity={0.5}
						listening={false}
					/>
				{/if}
			{/if}

			<!-- Box selection rectangle -->
			{#if isBoxSelecting}
				{@const boxX = Math.min(boxSelectStart.x, boxSelectEnd.x)}
				{@const boxY = Math.min(boxSelectStart.y, boxSelectEnd.y)}
				{@const boxWidth = Math.abs(boxSelectEnd.x - boxSelectStart.x)}
				{@const boxHeight = Math.abs(boxSelectEnd.y - boxSelectStart.y)}
				<Rect
					x={boxX}
					y={boxY}
					width={boxWidth}
					height={boxHeight}
					stroke="#2196F3"
					strokeWidth={1}
					fill="rgba(33, 150, 243, 0.1)"
					dash={[5, 3]}
					listening={false}
				/>
			{/if}

			<!-- Remote cursors -->
			{#if multiplayer}
				{#each getRemotePresencesArray() as presence (presence.clientId)}
					{#if presence.cursor}
						{@const color = getUserColor(presence.clientId)}
						<!-- Cursor pointer -->
						<Line
							points={[0, 0, 0, 18, 4, 14, 9, 22, 12, 21, 8, 13, 14, 13]}
							x={presence.cursor.x}
							y={presence.cursor.y}
							fill={color}
							stroke="#000"
							strokeWidth={1}
							closed={true}
							listening={false}
						/>
						<!-- User name label -->
						<KonvaText
							x={presence.cursor.x + 16}
							y={presence.cursor.y + 10}
							text={presence.name || `User ${presence.clientId.slice(0, 4)}`}
							fontSize={12}
							fontFamily="system-ui"
							fill="#fff"
							padding={4}
							listening={false}
						/>
						<!-- Name background -->
						<Rect
							x={presence.cursor.x + 14}
							y={presence.cursor.y + 8}
							width={(presence.name || `User ${presence.clientId.slice(0, 4)}`).length * 7 + 12}
							height={20}
							fill={color}
							cornerRadius={4}
							listening={false}
						/>
						<!-- Re-render text on top -->
						<KonvaText
							x={presence.cursor.x + 16}
							y={presence.cursor.y + 10}
							text={presence.name || `User ${presence.clientId.slice(0, 4)}`}
							fontSize={12}
							fontFamily="system-ui"
							fill="#fff"
							padding={4}
							listening={false}
						/>
					{/if}
				{/each}
			{/if}
		</Layer>
	</Stage>

	<!-- Text editing input overlay -->
	{#if editingText && editingShapeId}
		{@const inputPos = getEditingInputPosition()}
		{#if inputPos}
			<input
				type="text"
				class="absolute z-50 border-2 border-blue-500 bg-white px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
				style="left: {inputPos.x}px; top: {inputPos.y}px; width: {inputPos.width}px; min-height: {inputPos.height}px;"
				value={editingTextContent}
				oninput={handleTextInput}
				onblur={handleTextBlur}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						e.preventDefault();
						cancelTextEditing();
					} else if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						commitTextEditing();
					}
				}}
				autofocus
			/>
		{/if}
	{/if}
</div>

<style>
	div {
		overflow: hidden;
	}
</style>
