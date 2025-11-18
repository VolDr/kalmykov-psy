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
	import { currentStyle } from '../properties';
	import {
		attachArrowEndToNearestShape,
		updateConnectedArrows,
		getMagnetFeedbackBounds,
		type Bounds
	} from '../engine/magnets';
	import { isRoughEnabled, createDefaultRoughOptions } from '../engine/rough';
	import RoughShape from './RoughShape.svelte';
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
	import { CANVAS_FONT_FAMILY, DEFAULT_FONT_SIZE } from '../constants';

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
	import { bringToFront, sendToBack, bringForward, sendBackward } from '../layers';
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
		multiplayer = true, // Multiplayer enabled by default
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
	let style = $state({ stroke: '#1971c2', strokeWidth: 2, fill: '#a5d8ff', fillStyle: 'hachure' });

	// Tool state
	let tool: ToolMode = $state('select');

	// Drawing state
	let isDrawing = $state(false);
	let drawingStart = $state({ x: 0, y: 0 });
	let previewShape: Shape | null = $state(null);
	let drawingToolOptions = $state<{ doubleEnded?: boolean; curved?: boolean }>({});

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

	// Track if shift key is pressed for rotation snapping
	let isShiftPressed = $state(false);

	// Magnet feedback state
	let magnetFeedback: { bounds: Bounds; shapeId: string } | null = $state(null);

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
	const unsubscribeStyle = currentStyle.subscribe((s) => {
		style = s as any;
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

	// Check if selection contains only arrows
	function isArrowOnlySelection(): boolean {
		if (selectedIds.size === 0) return false;
		for (const id of selectedIds) {
			const shape = shapes.find((s) => s.id === id);
			if (!shape || shape.type !== 'arrow') return false;
		}
		return true;
	}

	// Get selected arrows
	function getSelectedArrows(): ArrowShape[] {
		const arrows: ArrowShape[] = [];
		for (const id of selectedIds) {
			const shape = shapes.find((s) => s.id === id);
			if (shape && shape.type === 'arrow') {
				arrows.push(shape as ArrowShape);
			}
		}
		return arrows;
	}

	// Update transformer nodes when selection changes
	$effect(() => {
		if (!transformerRef || !layerRef) return;

		const nodes: KonvaNode[] = [];
		// Don't attach transformer to arrows - we use custom handles
		for (const id of selectedIds) {
			const shape = shapes.find((s) => s.id === id);
			if (!shape || shape.type === 'arrow') continue;

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

	// Handle arrow endpoint drag (during drag for real-time feedback)
	function onArrowEndpointDragMove(arrow: ArrowShape, endpointIndex: number, e: any) {
		const node = e.target;
		const pos = node.position();

		// Update the arrow points in real-time
		const newPoints = [...arrow.points];
		newPoints[endpointIndex] = [pos.x - arrow.x, pos.y - arrow.y];

		const updated: ArrowShape = {
			...arrow,
			points: newPoints
		};

		// Show magnet feedback
		const worldPos = { x: pos.x, y: pos.y };
		magnetFeedback = getMagnetFeedbackBounds(worldPos, shapes, arrow.id, 40);

		// Update without history (just visual feedback) - use applyRemoteUpdate which doesn't touch history
		shapesHistory.applyRemoteUpdate([updated]);
	}

	// Handle arrow endpoint drag end (commit to history)
	function onArrowEndpointDragEnd(arrow: ArrowShape, endpointIndex: number, e: any) {
		const node = e.target;
		const pos = node.position();

		// Clear magnet feedback
		magnetFeedback = null;

		// Update the arrow points
		const newPoints = [...arrow.points];
		newPoints[endpointIndex] = [pos.x - arrow.x, pos.y - arrow.y];

		const updated: ArrowShape = {
			...arrow,
			points: newPoints
		};

		// If dragging end point, try to snap
		if (endpointIndex === arrow.points.length - 1) {
			const worldPos = { x: pos.x, y: pos.y };
			const attached = attachArrowEndToNearestShape(updated, shapes, 'to', worldPos, 40);
			shapesHistory.updateShapes([attached]);

			if (syncClient && multiplayer) {
				const op = createUpdateShapesOp(sceneId, clientId, [attached]);
				syncClient.sendOperation(op);
			}
		} else if (endpointIndex === 0) {
			const worldPos = { x: pos.x, y: pos.y };
			const attached = attachArrowEndToNearestShape(updated, shapes, 'from', worldPos, 40);
			shapesHistory.updateShapes([attached]);

			if (syncClient && multiplayer) {
				const op = createUpdateShapesOp(sceneId, clientId, [attached]);
				syncClient.sendOperation(op);
			}
		} else {
			shapesHistory.updateShapes([updated]);

			if (syncClient && multiplayer) {
				const op = createUpdateShapesOp(sceneId, clientId, [updated]);
				syncClient.sendOperation(op);
			}
		}
	}

	// Cleanup on destroy
	onDestroy(() => {
		unsubscribeShapes();
		unsubscribeSel();
		unsubscribeCam();
		unsubscribeStyle();
		unsubscribeTool();
		unsubscribeTextEditing();
		if (syncClient) {
			syncClient.destroy();
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
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

		const scaleBy = 1.15; // Increased from 1.05 for faster zoom
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
		console.log('[Canvas] mousedown', {
			button: evt.button,
			tool,
			shiftKey: evt.shiftKey,
			altKey: evt.altKey
		});
		// Priority 1: Middle mouse button or Shift+Alt+drag for panning
		if (evt.button === 1 || (evt.button === 0 && evt.shiftKey && evt.altKey)) {
			evt.preventDefault?.();
			isPanning = true;
			lastPos = { x: evt.clientX, y: evt.clientY };
			return; // Early return to prevent other handlers
		}

		// Priority 2: Pan tool
		if (evt.button === 0 && tool === 'pan') {
			isPanning = true;
			lastPos = { x: evt.clientX, y: evt.clientY };
			return;
		}

		// Priority 3: Drawing tools
		if (evt.button === 0 && tool !== 'select' && tool !== 'pan') {
			const world = screenToWorld(evt.offsetX, evt.offsetY);
			console.log('[Canvas] starting drawing', { tool, world });
			// Set drawing options based on tool
			drawingToolOptions = {
				doubleEnded: tool === 'doubleArrow',
				curved: tool === 'curvedArrow'
			};
			handleDrawingStart(world.x, world.y);
			return;
		}

		// Priority 4: Box selection in select mode
		if (evt.button === 0 && tool === 'select') {
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
		// Ignore middle mouse button clicks on shapes - always pan canvas
		if (evt.button === 1) {
			return;
		}
		toggleSelection(shapeId, evt.ctrlKey || evt.metaKey);
		e.cancelBubble = true;
	}

	// Handle shape transformation (resize/rotate)
	function onTransformEnd() {
		if (!transformerRef) return;

		const nodes = transformerRef.nodes();
		const updatedShapes: Shape[] = [];
		const movedShapeIds: string[] = [];

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
				const currentWidth = text.width ?? text.text.length * text.fontSize * 0.6;
				const currentHeight = text.height ?? text.fontSize * 1.2;
				updated = {
					...text,
					x,
					y,
					width: currentWidth * scaleX,
					height: currentHeight * scaleY,
					rotation,
					scaleX: 1,
					scaleY: 1
				};
				// Reset node scale after applying to dimensions
				node.scaleX(1);
				node.scaleY(1);
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
			movedShapeIds.push(shapeId);
		}

		if (updatedShapes.length > 0) {
			// Get current shapes with updates applied
			const currentShapes = shapes.map((s) => {
				const updatedShape = updatedShapes.find((u) => u.id === s.id);
				return updatedShape || s;
			});

			// Update all arrows connected to transformed shapes
			const connectedArrowUpdates = updateConnectedArrows(movedShapeIds, currentShapes);

			// Combine updates
			const allUpdates = [...updatedShapes, ...connectedArrowUpdates];

			shapesHistory.updateShapes(allUpdates);

			// Broadcast to other clients
			if (syncClient && multiplayer) {
				const op = createUpdateShapesOp(sceneId, clientId, allUpdates);
				syncClient.sendOperation(op);
			}
		}
	}

	// Shape drag move - real-time update for smooth movement
	function onShapeDragMove(shape: Shape, e: any) {
		const node = e.target;
		const pos = node.position();

		const updated: Shape = {
			...shape,
			x: pos.x,
			y: pos.y
		};

		// Get current shapes and update the moved shape
		const currentShapes = shapes.map((s) => (s.id === shape.id ? updated : s));

		// Update all arrows connected to this shape in real-time
		const connectedArrowUpdates = updateConnectedArrows([shape.id], currentShapes);

		// Combine updates
		const allUpdates = [updated, ...connectedArrowUpdates];

		// Update without history for visual feedback
		shapesHistory.applyRemoteUpdate(allUpdates);
	}

	function onShapeDragEnd(shape: Shape, e: any) {
		const node = e.target;
		const pos = node.position();

		const updated: Shape = {
			...shape,
			x: pos.x,
			y: pos.y
		};

		// Get current shapes and update the moved shape
		const currentShapes = shapes.map((s) => (s.id === shape.id ? updated : s));

		// Update all arrows connected to this shape
		const connectedArrowUpdates = updateConnectedArrows([shape.id], currentShapes);

		// Combine updates
		const allUpdates = [updated, ...connectedArrowUpdates];

		shapesHistory.updateShapes(allUpdates);

		// Broadcast to other clients
		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, allUpdates);
			syncClient.sendOperation(op);
		}
	}

	// Arrow drag move - real-time update for handles to follow
	function onArrowDragMove(arrow: ArrowShape, e: any) {
		const node = e.target;
		const pos = node.position();

		const updated: ArrowShape = {
			...arrow,
			x: pos.x,
			y: pos.y
		};

		// Update without history for visual feedback
		shapesHistory.applyRemoteUpdate([updated]);
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
		// Track shift key for rotation snapping
		if (e.key === 'Shift') {
			isShiftPressed = true;
		}

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
		const target = e.target as HTMLTextAreaElement;
		updateEditingText(target.value);
	}

	// Commit text editing on blur
	function handleTextBlur() {
		if (editingText) {
			commitTextEditing();
		}
	}

	// Get screen position for text editing overlay
	function getEditingInputPosition(): {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null {
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
			window.addEventListener('keyup', handleKeyUp);
			window.addEventListener('resize', updateDimensions);
		}
	});

	// Track shift key state for rotation snapping
	function handleKeyUp(e: KeyboardEvent) {
		if (e.key === 'Shift') {
			isShiftPressed = false;
		}
	}

	// Handle rotation snapping during transform
	function onTransform(e: any) {
		if (!transformerRef || !isShiftPressed) return;

		const nodes = transformerRef.nodes();
		for (const node of nodes) {
			// Snap rotation if shift is pressed
			const rotation = node.rotation();
			// Snap to 15 degree increments (0, 15, 30, 45, 60, 75, 90, etc.)
			const snapAngle = 15;
			const snappedRotation = Math.round(rotation / snapAngle) * snapAngle;
			node.rotation(snappedRotation);
		}
	}

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
			stroke: style.stroke,
			strokeWidth: style.strokeWidth,
			fill: style.fill
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
					height,
					roughOptions: {
						...createDefaultRoughOptions(),
						fillStyle: style.fillStyle as any
					}
				} as RectShape;

			case 'ellipse':
				return {
					...baseShape,
					type: 'ellipse',
					x: centerX,
					y: centerY,
					rx: width / 2,
					ry: height / 2,
					roughOptions: {
						...createDefaultRoughOptions(),
						fillStyle: style.fillStyle as any
					}
				} as EllipseShape;

			case 'arrow':
			case 'doubleArrow':
			case 'curvedArrow':
				const arrowPoints: [number, number][] = [
					[0, 0],
					[isClick ? width : endX - startX, isClick ? height : endY - startY]
				];
				// If curved arrow, add middle control point
				if (toolType === 'curvedArrow' || drawingToolOptions.curved) {
					const midX = arrowPoints[1][0] / 2;
					const midY = arrowPoints[1][1] / 2;
					// Add control point offset perpendicular to the line
					arrowPoints.splice(1, 0, [midX, midY - 50]);
				}
				return {
					...baseShape,
					type: 'arrow',
					x: startX,
					y: startY,
					points: arrowPoints,
					doubleEnded: toolType === 'doubleArrow' || drawingToolOptions.doubleEnded,
					curved: toolType === 'curvedArrow' || drawingToolOptions.curved
				} as ArrowShape;

			case 'text':
				return {
					...baseShape,
					type: 'text',
					x: centerX,
					y: centerY,
					text: 'Text',
					fontSize: DEFAULT_FONT_SIZE,
					fontFamily: CANVAS_FONT_FAMILY,
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

			// Auto-start text editing for text shapes
			if (newShape.type === 'text') {
				setTimeout(() => {
					startTextEditing(newShape.id);
				}, 10);
			}
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

	// Check if camera is away from content
	function isAwayFromContent(): boolean {
		if (shapes.length === 0) return false;

		// Calculate the bounding box of all shapes
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const shape of shapes) {
			const bounds = getShapeBounds(shape);
			minX = Math.min(minX, bounds.x);
			minY = Math.min(minY, bounds.y);
			maxX = Math.max(maxX, bounds.x + bounds.width);
			maxY = Math.max(maxY, bounds.y + bounds.height);
		}

		// Convert viewport corners to world coordinates
		const viewportLeft = -cam.x / cam.scale;
		const viewportTop = -cam.y / cam.scale;
		const viewportRight = (stageWidth - cam.x) / cam.scale;
		const viewportBottom = (stageHeight - cam.y) / cam.scale;

		// Check if content is visible in viewport
		const isVisible = !(
			maxX < viewportLeft ||
			minX > viewportRight ||
			maxY < viewportTop ||
			minY > viewportBottom
		);
		return !isVisible;
	}

	// Center camera on all content
	function centerOnContent() {
		if (shapes.length === 0) return;

		// Calculate the bounding box of all shapes
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const shape of shapes) {
			const bounds = getShapeBounds(shape);
			minX = Math.min(minX, bounds.x);
			minY = Math.min(minY, bounds.y);
			maxX = Math.max(maxX, bounds.x + bounds.width);
			maxY = Math.max(maxY, bounds.y + bounds.height);
		}

		const contentWidth = maxX - minX;
		const contentHeight = maxY - minY;
		const contentCenterX = minX + contentWidth / 2;
		const contentCenterY = minY + contentHeight / 2;

		// Calculate scale to fit content with padding
		const padding = 50;
		const scaleX = (stageWidth - padding * 2) / contentWidth;
		const scaleY = (stageHeight - padding * 2) / contentHeight;
		const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 100%

		// Center the content
		const newX = stageWidth / 2 - contentCenterX * newScale;
		const newY = stageHeight / 2 - contentCenterY * newScale;

		camera.set({ x: newX, y: newY, scale: newScale });
	}

	// Properties panel functions
	function getSelectedShapes(): Shape[] {
		const selected: Shape[] = [];
		for (const id of selectedIds) {
			const shape = shapes.find((s) => s.id === id);
			if (shape) selected.push(shape);
		}
		return selected;
	}

	function hasSelectedNonArrows(): boolean {
		const selected = getSelectedShapes();
		return selected.some((s) => s.type !== 'arrow');
	}

	function getCommonFill(): string | null | undefined {
		const selected = getSelectedShapes().filter((s) => s.type !== 'arrow');
		if (selected.length === 0) return undefined;
		const firstFill = selected[0].fill;
		for (const shape of selected) {
			if (shape.fill !== firstFill) return undefined; // Mixed values
		}
		return firstFill;
	}

	function getCommonDash(): number[] | undefined {
		const selected = getSelectedShapes();
		if (selected.length === 0) return undefined;
		const firstDash = selected[0].dash;
		for (const shape of selected) {
			const shapeHasDash = shape.dash && shape.dash.length > 0;
			const firstHasDash = firstDash && firstDash.length > 0;
			if (shapeHasDash !== firstHasDash) return undefined; // Mixed values
		}
		return firstDash;
	}

	function toggleFill() {
		const selected = getSelectedShapes().filter((s) => s.type !== 'arrow');
		if (selected.length === 0) return;

		const hasFill = selected[0].fill;
		const updatedShapes: Shape[] = selected.map((s) => ({
			...s,
			fill: hasFill ? null : '#D1D5DB' // Toggle between no fill and gray fill
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function setFillColor(color: string | null) {
		const selected = getSelectedShapes().filter((s) => s.type !== 'arrow');
		if (selected.length === 0) return;

		const updatedShapes: Shape[] = selected.map((s) => ({
			...s,
			fill: color
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function toggleDash() {
		const selected = getSelectedShapes();
		if (selected.length === 0) return;

		const hasDash = selected[0].dash && selected[0].dash.length > 0;
		const updatedShapes: Shape[] = selected.map((s) => ({
			...s,
			dash: hasDash ? undefined : [10, 5] // Toggle between solid and dashed
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function setStrokeColor(color: string) {
		const selected = getSelectedShapes();
		if (selected.length === 0) return;

		const updatedShapes: Shape[] = selected.map((s) => ({
			...s,
			stroke: color
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function toggleStroke() {
		const selected = getSelectedShapes().filter((s) => s.type !== 'arrow');
		if (selected.length === 0) return;

		const hasStroke = selected[0].strokeWidth > 0;
		const updatedShapes: Shape[] = selected.map((s) => ({
			...s,
			strokeWidth: hasStroke ? 0 : 2
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function hasSelectedArrows(): boolean {
		const selected = getSelectedShapes();
		return selected.some((s) => s.type === 'arrow');
	}

	function getCommonDoubleEnded(): boolean | undefined {
		const arrows = getSelectedShapes().filter((s) => s.type === 'arrow') as ArrowShape[];
		if (arrows.length === 0) return undefined;
		const first = arrows[0].doubleEnded ?? false;
		for (const arrow of arrows) {
			if ((arrow.doubleEnded ?? false) !== first) return undefined;
		}
		return first;
	}

	function getCommonCurved(): boolean | undefined {
		const arrows = getSelectedShapes().filter((s) => s.type === 'arrow') as ArrowShape[];
		if (arrows.length === 0) return undefined;
		const first = arrows[0].curved ?? false;
		for (const arrow of arrows) {
			if ((arrow.curved ?? false) !== first) return undefined;
		}
		return first;
	}

	function toggleDoubleEnded() {
		const arrows = getSelectedShapes().filter((s) => s.type === 'arrow') as ArrowShape[];
		if (arrows.length === 0) return;

		const currentValue = arrows[0].doubleEnded ?? false;
		const updatedShapes: Shape[] = arrows.map((a) => ({
			...a,
			doubleEnded: !currentValue
		}));

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	function toggleCurved() {
		const arrows = getSelectedShapes().filter((s) => s.type === 'arrow') as ArrowShape[];
		if (arrows.length === 0) return;

		const currentValue = arrows[0].curved ?? false;
		const updatedShapes: Shape[] = arrows.map((a) => {
			const isCurved = !currentValue;
			// If toggling to curved and only has 2 points, add middle control point
			if (isCurved && a.points.length === 2) {
				const midX = (a.points[0][0] + a.points[1][0]) / 2;
				const midY = (a.points[0][1] + a.points[1][1]) / 2;
				return {
					...a,
					curved: true,
					points: [a.points[0], [midX, midY - 50], a.points[1]] // Add control point above midpoint
				};
			} else if (!isCurved && a.points.length === 3) {
				// If toggling to straight and has 3 points, remove middle point
				return {
					...a,
					curved: false,
					points: [a.points[0], a.points[2]]
				};
			}
			return {
				...a,
				curved: isCurved
			};
		});

		shapesHistory.updateShapes(updatedShapes);

		if (syncClient && multiplayer) {
			const op = createUpdateShapesOp(sceneId, clientId, updatedShapes);
			syncClient.sendOperation(op);
		}
	}

	// Calculate text height based on wrapping
	function calculateTextHeight(text: string, width: number, fontSize: number): number {
		const avgCharWidth = fontSize * 0.6;
		const charsPerLine = Math.floor(width / avgCharWidth);
		if (charsPerLine <= 0) return fontSize * 1.2;

		const words = text.split(' ');
		let lines = 1;
		let currentLineLength = 0;

		for (const word of words) {
			if (currentLineLength + word.length > charsPerLine) {
				lines++;
				currentLineLength = word.length + 1;
			} else {
				currentLineLength += word.length + 1;
			}
		}

		return lines * fontSize * 1.2;
	}
</script>

<div class="relative h-full w-full bg-white" style="cursor: {getToolCursor(tool)}">
	<!-- Toolbar -->
	<Toolbar />

	<!-- Connection status indicator -->
	{#if multiplayer}
		<div
			class="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-md"
		>
			<div class="h-3 w-3 rounded-full" style="background-color: {getStatusColor()}"></div>
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
		<Layer bind:this={layerComponent} x={cam.x} y={cam.y} scaleX={cam.scale} scaleY={cam.scale}>
			{#each shapes as shape (shape.id)}
				{#if shape.type === 'rect'}
					{@const rect = shape as RectShape}
					{@const textHeight = rect.text
						? calculateTextHeight(rect.text, rect.width, DEFAULT_FONT_SIZE)
						: 0}
					{@const effectiveHeight = Math.max(rect.height, textHeight + 20)}
					<!-- Wrap rect and text in Group so they move together -->
					<Group
						id={rect.id}
						x={rect.x}
						y={rect.y}
						rotation={rect.rotation}
						draggable={true}
						opacity={isSelected(rect.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(rect.id, e)}
						ondblclick={() => handleDoubleClick(rect.id)}
						ondragmove={(e) => onShapeDragMove(rect, e)}
						ondragend={(e) => onShapeDragEnd(rect, e)}
					>
						{#if isRoughEnabled(rect)}
							<RoughShape
								shape={{ ...rect, x: 0, y: 0, rotation: 0 }}
								isSelected={isSelected(rect.id)}
								onclick={(e) => {
									e.cancelBubble = true;
								}}
								ondblclick={() => {}}
								ondragend={() => {}}
							/>
						{:else}
							<Rect
								x={0}
								y={0}
								width={rect.width}
								height={effectiveHeight}
								offsetX={rect.width / 2}
								offsetY={effectiveHeight / 2}
								stroke={rect.stroke}
								strokeWidth={rect.strokeWidth}
								strokeScaleEnabled={false}
								fill={rect.fill ?? undefined}
								dash={rect.dash ?? undefined}
							/>
						{/if}
						{#if rect.text}
							<KonvaText
								x={0}
								y={0}
								offsetX={rect.width / 2}
								offsetY={effectiveHeight / 2}
								width={rect.width}
								height={effectiveHeight}
								align="center"
								verticalAlign="middle"
								text={rect.text}
								fontSize={DEFAULT_FONT_SIZE}
								fontFamily={CANVAS_FONT_FAMILY}
								wrap="word"
								listening={false}
							/>
						{/if}
					</Group>
				{:else if shape.type === 'ellipse'}
					{@const el = shape as EllipseShape}
					{@const textHeight = el.text
						? calculateTextHeight(el.text, el.rx * 2, DEFAULT_FONT_SIZE)
						: 0}
					{@const effectiveRy = Math.max(el.ry, (textHeight + 20) / 2)}
					<!-- Wrap ellipse and text in Group so they move together -->
					<Group
						id={el.id}
						x={el.x}
						y={el.y}
						rotation={el.rotation}
						draggable={true}
						opacity={isSelected(el.id) ? 0.8 : 1}
						onclick={(e) => onShapeClick(el.id, e)}
						ondblclick={() => handleDoubleClick(el.id)}
						ondragmove={(e) => onShapeDragMove(el, e)}
						ondragend={(e) => onShapeDragEnd(el, e)}
					>
						{#if isRoughEnabled(el)}
							<RoughShape
								shape={{ ...el, x: 0, y: 0, rotation: 0 }}
								isSelected={isSelected(el.id)}
								onclick={(e) => {
									e.cancelBubble = true;
								}}
								ondblclick={() => {}}
								ondragend={() => {}}
							/>
						{:else}
							<Ellipse
								x={0}
								y={0}
								radiusX={el.rx}
								radiusY={effectiveRy}
								stroke={el.stroke}
								strokeWidth={el.strokeWidth}
								strokeScaleEnabled={false}
								fill={el.fill ?? undefined}
								dash={el.dash ?? undefined}
							/>
						{/if}
						{#if el.text}
							<KonvaText
								x={0}
								y={0}
								offsetX={el.rx}
								offsetY={effectiveRy}
								width={el.rx * 2}
								height={effectiveRy * 2}
								align="center"
								verticalAlign="middle"
								text={el.text}
								fontSize={DEFAULT_FONT_SIZE}
								fontFamily={CANVAS_FONT_FAMILY}
								wrap="word"
								listening={false}
							/>
						{/if}
					</Group>
				{:else if shape.type === 'text'}
					{@const t = shape as TextShape}
					{@const textWidth = t.width ?? t.text.length * t.fontSize * 0.6}
					{@const textHeight = t.height ?? t.fontSize * 1.2}
					<!-- Invisible rect for transformer support -->
					<Rect
						id={t.id}
						x={t.x}
						y={t.y}
						width={textWidth}
						height={textHeight}
						offsetX={textWidth / 2}
						offsetY={textHeight / 2}
						rotation={t.rotation}
						draggable={true}
						opacity={0}
						fill="transparent"
						stroke="transparent"
						strokeScaleEnabled={false}
						onclick={(e) => onShapeClick(t.id, e)}
						ondblclick={() => handleDoubleClick(t.id)}
						ondragmove={(e) => onShapeDragMove(t, e)}
						ondragend={(e) => onShapeDragEnd(t, e)}
					/>
					<!-- Text content -->
					<KonvaText
						x={t.x}
						y={t.y}
						offsetX={textWidth / 2}
						offsetY={textHeight / 2}
						width={textWidth}
						height={textHeight}
						text={t.text}
						fontSize={t.fontSize}
						fontFamily={t.fontFamily}
						fill={t.fill ?? t.stroke ?? '#000000'}
						align={t.align}
						verticalAlign="middle"
						rotation={t.rotation}
						listening={false}
					/>
				{:else if shape.type === 'arrow'}
					{@const a = shape as ArrowShape}
					{#if a.curved && a.points.length === 3}
						<!-- Curved arrow using quadratic bezier -->
						{@const controlX = a.points[1][0]}
						{@const controlY = a.points[1][1]}
						{@const endX = a.points[2][0]}
						{@const endY = a.points[2][1]}
						{@const startX = a.points[0][0]}
						{@const startY = a.points[0][1]}
						{@const endDx = endX - controlX}
						{@const endDy = endY - controlY}
						{@const endLen = Math.sqrt(endDx * endDx + endDy * endDy)}
						{@const startDx = startX - controlX}
						{@const startDy = startY - controlY}
						{@const startLen = Math.sqrt(startDx * startDx + startDy * startDy)}
						<Line
							id={a.id}
							x={a.x}
							y={a.y}
							points={renderArrow(a).points}
							stroke={a.stroke}
							strokeWidth={a.strokeWidth}
							strokeScaleEnabled={false}
							dash={a.dash ?? undefined}
							lineCap="round"
							lineJoin="round"
							tension={0.5}
							draggable={true}
							opacity={isSelected(a.id) ? 0.8 : 1}
							onclick={(e) => onShapeClick(a.id, e)}
							ondragmove={(e) => onArrowDragMove(a, e)}
							ondragend={(e) => onArrowDragEnd(a, e)}
						/>
						<!-- Arrow head at end - only arrowhead, no line -->
						<Arrow
							x={a.x}
							y={a.y}
							points={[endX - (endDx / endLen) * 0.1, endY - (endDy / endLen) * 0.1, endX, endY]}
							stroke={a.stroke}
							strokeWidth={a.strokeWidth}
							fill={a.stroke}
							pointerLength={10}
							pointerWidth={10}
							listening={false}
						/>
						{#if a.doubleEnded}
							<!-- Arrow head at beginning for curved -->
							<Arrow
								x={a.x}
								y={a.y}
								points={[
									startX - (startDx / startLen) * 0.1,
									startY - (startDy / startLen) * 0.1,
									startX,
									startY
								]}
								stroke={a.stroke}
								strokeWidth={a.strokeWidth}
								fill={a.stroke}
								pointerLength={10}
								pointerWidth={10}
								listening={false}
							/>
						{/if}
					{:else}
						<Arrow
							id={a.id}
							x={a.x}
							y={a.y}
							points={renderArrow(a).points}
							stroke={a.stroke}
							strokeWidth={a.strokeWidth}
							strokeScaleEnabled={false}
							fill={a.stroke}
							dash={a.dash ?? undefined}
							lineCap="round"
							lineJoin="round"
							pointerLength={10}
							pointerWidth={10}
							pointerAtBeginning={a.doubleEnded ?? false}
							draggable={true}
							opacity={isSelected(a.id) ? 0.8 : 1}
							onclick={(e) => onShapeClick(a.id, e)}
							ondragmove={(e) => onArrowDragMove(a, e)}
							ondragend={(e) => onArrowDragEnd(a, e)}
						/>
					{/if}
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
						ondragmove={(e) => onShapeDragMove(g, e)}
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
				borderStroke="#9333EA"
				anchorFill="#FFFFFF"
				anchorStroke="#9333EA"
				anchorCornerRadius={2}
				ontransform={onTransform}
				ontransformend={onTransformEnd}
			/>

			<!-- Arrow endpoint handles -->
			{#each getSelectedArrows() as arrow (arrow.id)}
				{#each arrow.points as point, i}
					<Circle
						x={arrow.x + point[0]}
						y={arrow.y + point[1]}
						radius={6}
						fill="#FFFFFF"
						stroke="#9333EA"
						strokeWidth={2}
						draggable={true}
						ondragmove={(e) => onArrowEndpointDragMove(arrow, i, e)}
						ondragend={(e) => onArrowEndpointDragEnd(arrow, i, e)}
					/>
				{/each}
			{/each}

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
					{@const previewWidth = t.width ?? 50}
					{@const previewHeight = t.height ?? 20}
					<!-- Preview rect outline -->
					<Rect
						x={t.x}
						y={t.y}
						width={previewWidth}
						height={previewHeight}
						offsetX={previewWidth / 2}
						offsetY={previewHeight / 2}
						opacity={0.5}
						dash={[10, 5]}
						stroke="#9333EA"
						strokeWidth={1}
						listening={false}
					/>
					<KonvaText
						x={t.x}
						y={t.y}
						offsetX={previewWidth / 2}
						offsetY={previewHeight / 2}
						width={previewWidth}
						height={previewHeight}
						text={t.text}
						fontSize={t.fontSize}
						fontFamily={t.fontFamily}
						fill={t.fill ?? t.stroke ?? '#000000'}
						align="center"
						verticalAlign="middle"
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
					stroke="#9333EA"
					strokeWidth={1}
					fill="rgba(147, 51, 234, 0.1)"
					dash={[5, 3]}
					listening={false}
				/>
			{/if}

			<!-- Magnet feedback highlight -->
			{#if magnetFeedback}
				<Rect
					x={magnetFeedback.bounds.x}
					y={magnetFeedback.bounds.y}
					width={magnetFeedback.bounds.width}
					height={magnetFeedback.bounds.height}
					stroke="#10B981"
					strokeWidth={2}
					fill="rgba(16, 185, 129, 0.08)"
					cornerRadius={4}
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
			<textarea
				class="absolute z-50 resize-none rounded border-2 border-purple-500 bg-white/95 px-2 py-1 text-center shadow-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-300 focus:outline-none"
				style="left: {inputPos.x}px; top: {inputPos.y}px; width: {inputPos.width}px; min-height: {inputPos.height}px; font-size: {DEFAULT_FONT_SIZE *
					cam.scale}px; line-height: 1.4; font-family: {CANVAS_FONT_FAMILY};"
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
					// Shift+Enter inserts a new line (default behavior)
				}}
				onfocus={(e) => {
					// Select all text on focus for easy replacement
					const target = e.target as HTMLTextAreaElement;
					target.select();
				}}
				onmount={(e: any) => {
					// Auto-focus when textarea is mounted
					const target = e.target as HTMLTextAreaElement;
					setTimeout(() => {
						target.focus();
						target.select();
					}, 10);
				}}
				autofocus
			></textarea>
		{/if}
	{/if}

	<!-- Return to content button -->
	{#if isAwayFromContent()}
		<button
			type="button"
			class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-normal text-gray-700 shadow-md transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:outline-none"
			onclick={centerOnContent}
		>
			Вернуться к содержимому
		</button>
	{/if}

	<!-- Shape properties panel -->
	{#if selectedIds.size > 0}
		<div class="absolute top-20 left-4 z-50 flex flex-col gap-2 rounded-lg bg-white p-3 shadow-lg">
			<div class="text-xs font-semibold text-gray-600">Свойства</div>

			<!-- Fill color picker (not for arrows) -->
			{#if hasSelectedNonArrows()}
				<div class="flex flex-col gap-1">
					<div class="flex flex-wrap items-center gap-1">
						<span class="w-full text-xs text-gray-500">Заливка:</span>
						<button
							type="button"
							class="h-5 w-5 rounded border-2 border-gray-400"
							style="background: repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px"
							onclick={() => setFillColor(null)}
							aria-label="No fill"
							title="Без заливки"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #f3f4f6"
							onclick={() => setFillColor('#f3f4f6')}
							aria-label="Light gray fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #fee2e2"
							onclick={() => setFillColor('#fee2e2')}
							aria-label="Light red fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #ffedd5"
							onclick={() => setFillColor('#ffedd5')}
							aria-label="Light orange fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #fef3c7"
							onclick={() => setFillColor('#fef3c7')}
							aria-label="Light yellow fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #ecfccb"
							onclick={() => setFillColor('#ecfccb')}
							aria-label="Light lime fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #d1fae5"
							onclick={() => setFillColor('#d1fae5')}
							aria-label="Light green fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #cffafe"
							onclick={() => setFillColor('#cffafe')}
							aria-label="Light cyan fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #dbeafe"
							onclick={() => setFillColor('#dbeafe')}
							aria-label="Light blue fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #ede9fe"
							onclick={() => setFillColor('#ede9fe')}
							aria-label="Light purple fill"
						></button>
						<button
							type="button"
							class="h-5 w-5 rounded border border-gray-300"
							style="background-color: #fce7f3"
							onclick={() => setFillColor('#fce7f3')}
							aria-label="Light pink fill"
						></button>
					</div>
				</div>
			{/if}

			<!-- Line type toggle -->
			<button
				type="button"
				class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100"
				onclick={toggleDash}
			>
				<div class="flex h-4 w-4 items-center justify-center">
					{#if getCommonDash() && getCommonDash()!.length > 0}
						<svg width="16" height="16" viewBox="0 0 16 16">
							<line
								x1="0"
								y1="8"
								x2="16"
								y2="8"
								stroke="currentColor"
								stroke-width="2"
								stroke-dasharray="4 2"
							/>
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 16 16">
							<line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="2" />
						</svg>
					{/if}
				</div>
				<span>Штрих</span>
			</button>

			<!-- Stroke color -->
			<div class="flex flex-wrap items-center gap-1">
				<span class="w-full text-xs text-gray-500">Контур:</span>
				{#if hasSelectedNonArrows()}
					<button
						type="button"
						class="h-5 w-5 rounded border-2 border-gray-400"
						style="background: repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px"
						onclick={() => toggleStroke()}
						aria-label="Toggle stroke"
						title="Без контура / С контуром"
					></button>
				{/if}
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #6b7280"
					onclick={() => setStrokeColor('#6b7280')}
					aria-label="Gray stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #f87171"
					onclick={() => setStrokeColor('#f87171')}
					aria-label="Soft red stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #fb923c"
					onclick={() => setStrokeColor('#fb923c')}
					aria-label="Soft orange stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #fbbf24"
					onclick={() => setStrokeColor('#fbbf24')}
					aria-label="Soft yellow stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #a3e635"
					onclick={() => setStrokeColor('#a3e635')}
					aria-label="Soft lime stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #4ade80"
					onclick={() => setStrokeColor('#4ade80')}
					aria-label="Soft green stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #22d3ee"
					onclick={() => setStrokeColor('#22d3ee')}
					aria-label="Soft cyan stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #60a5fa"
					onclick={() => setStrokeColor('#60a5fa')}
					aria-label="Soft blue stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #a78bfa"
					onclick={() => setStrokeColor('#a78bfa')}
					aria-label="Soft purple stroke"
				></button>
				<button
					type="button"
					class="h-5 w-5 rounded border border-gray-300"
					style="background-color: #f472b6"
					onclick={() => setStrokeColor('#f472b6')}
					aria-label="Soft pink stroke"
				></button>
			</div>

			<!-- Arrow-specific options -->
			{#if hasSelectedArrows()}
				<div class="mt-2 border-t border-gray-200 pt-2">
					<div class="text-xs font-semibold text-gray-600">Стрелка</div>
					<button
						type="button"
						class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100"
						onclick={toggleDoubleEnded}
					>
						<div class="flex h-4 w-4 items-center justify-center">
							{#if getCommonDoubleEnded()}
								<svg width="16" height="16" viewBox="0 0 16 16">
									<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" />
									<polygon points="2,8 6,5 6,11" fill="currentColor" />
									<polygon points="14,8 10,5 10,11" fill="currentColor" />
								</svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 16 16">
									<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" />
									<polygon points="14,8 10,5 10,11" fill="currentColor" />
								</svg>
							{/if}
						</div>
						<span>Двусторонняя</span>
					</button>
					<button
						type="button"
						class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100"
						onclick={toggleCurved}
					>
						<div class="flex h-4 w-4 items-center justify-center">
							{#if getCommonCurved()}
								<svg width="16" height="16" viewBox="0 0 16 16">
									<path d="M 2 12 Q 8 2 14 12" stroke="currentColor" stroke-width="2" fill="none" />
								</svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 16 16">
									<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" />
								</svg>
							{/if}
						</div>
						<span>Изогнутая</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	div {
		overflow: hidden;
	}
</style>
