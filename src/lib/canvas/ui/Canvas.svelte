<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Stage, Layer, Rect, Ellipse, Text as KonvaText, Line, Arrow, Group } from 'svelte-konva';
	import type { Stage as KonvaStage, Layer as KonvaLayer } from 'konva/lib/index-types';

	import {
		shapesHistory,
		selection,
		camera,
		toggleSelection,
		clearSelection
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

	let stageRef: KonvaStage | null = $state(null);
	let layerRef: KonvaLayer | null = $state(null);

	let shapes: Shape[] = $state([]);
	let selectedIds: Set<string> = $state(new Set());
	let cam = $state({ x: 0, y: 0, scale: 1 });

	// Responsive canvas dimensions
	let stageWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 800);
	let stageHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 600);

	function updateDimensions() {
		if (typeof window !== 'undefined') {
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
		}
	}

	const unsubscribeShapes = shapesHistory.subscribe((state) => {
		shapes = state.shapes;
	});
	const unsubscribeSel = selection.subscribe((s) => {
		selectedIds = s.ids;
	});
	const unsubscribeCam = camera.subscribe((c) => {
		cam = c;
	});

	onDestroy(() => {
		unsubscribeShapes();
		unsubscribeSel();
		unsubscribeCam();
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', updateDimensions);
		}
	});

	// === Panning with mouse wheel (zoom to cursor) ===
	function handleWheel(e: any) {
		const evt = e.evt as WheelEvent;
		evt.preventDefault?.();

		if (!stageRef) return;

		const scaleBy = 1.05;
		const oldScale = cam.scale;
		const stage = stageRef.getStage ? stageRef.getStage() : stageRef;
		const mousePointTo = {
			x: (evt.offsetX - stage.x()) / oldScale,
			y: (evt.offsetY - stage.y()) / oldScale
		};

		const newScale = evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

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
		if (evt.button === 1 || (evt.button === 0 && evt.shiftKey && evt.altKey)) {
			isPanning = true;
			lastPos = { x: evt.clientX, y: evt.clientY };
		}
	}

	function handleMouseMove(e: any) {
		if (!isPanning) return;
		const evt = e.evt as MouseEvent;
		const dx = evt.clientX - lastPos.x;
		const dy = evt.clientY - lastPos.y;
		lastPos = { x: evt.clientX, y: evt.clientY };
		camera.set({ ...cam, x: cam.x + dx, y: cam.y + dy });
	}

	function handleMouseUp() {
		isPanning = false;
	}

	function handleStageClick(e: any) {
		// Click on empty space - clear selection
		const stage = stageRef?.getStage ? stageRef.getStage() : stageRef;
		if (e.target === stage) {
			clearSelection();
		}
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

	function onShapeDragEnd(shape: Shape, e: any) {
		const node = e.target;
		const pos = node.position();

		const updated: Shape = {
			...shape,
			x: pos.x,
			y: pos.y
		};

		shapesHistory.updateShapes([updated]);
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
	}

	// === Hotkeys (RU/EN - by code) ===

	function handleKeyDown(e: KeyboardEvent) {
		// ctrl/cmd + Z — undo
		if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
			e.preventDefault();
			shapesHistory.undo();
			return;
		}

		// ctrl/cmd + shift + Z — redo
		if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey)) {
			e.preventDefault();
			shapesHistory.redo();
			return;
		}

		// Delete / Backspace — delete selected
		if (e.code === 'Delete' || e.code === 'Backspace') {
			if (selectedIds.size > 0) {
				e.preventDefault();
				const ids = Array.from(selectedIds);
				shapesHistory.deleteShapes(ids);
				clearSelection();
			}
			return;
		}

		// ctrl + D — duplicate
		if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (!selectedIds.size) return;
			const ids = Array.from(selectedIds);
			const toCopy = shapes.filter((s) => ids.includes(s.id));
			const copies = toCopy.map((s) => ({
				...s,
				id: crypto.randomUUID(),
				x: s.x + 20,
				y: s.y + 20
			}));
			shapesHistory.addShapes(copies);
			return;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			window.addEventListener('resize', updateDimensions);
		}
	});

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
</script>

<div class="h-full w-full">
	<Stage
		config={{
			width: stageWidth,
			height: stageHeight
		}}
		on:wheel={handleWheel}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:click={handleStageClick}
		on:load={(e) => (stageRef = e.detail as KonvaStage)}
	>
		<Layer
			config={{
				x: cam.x,
				y: cam.y,
				scaleX: cam.scale,
				scaleY: cam.scale
			}}
			on:load={(e) => (layerRef = e.detail as KonvaLayer)}
		>
			{#each shapes as shape (shape.id)}
				{#if shape.type === 'rect'}
					{@const rect = shape as RectShape}
					<Rect
						config={{
							...renderRect(rect),
							offsetX: rect.width / 2,
							offsetY: rect.height / 2,
							stroke: rect.stroke,
							strokeWidth: rect.strokeWidth,
							fill: rect.fill ?? undefined,
							rotation: rect.rotation,
							draggable: true,
							opacity: isSelected(rect.id) ? 0.8 : 1
						}}
						on:click={(e) => onShapeClick(rect.id, e)}
						on:dragend={(e) => onShapeDragEnd(rect, e)}
					/>
					{#if rect.text}
						<KonvaText
							config={{
								x: rect.x,
								y: rect.y,
								offsetX: rect.width / 2,
								offsetY: rect.height / 2,
								width: rect.width,
								height: rect.height,
								align: 'center',
								verticalAlign: 'middle',
								text: rect.text,
								fontSize: 14,
								listening: false
							}}
						/>
					{/if}
				{:else if shape.type === 'ellipse'}
					{@const el = shape as EllipseShape}
					<Ellipse
						radiusX={el.rx}
						radiusY={el.ry}
						config={{
							x: el.x,
							y: el.y,
							offsetX: el.rx,
							offsetY: el.ry,
							stroke: el.stroke,
							strokeWidth: el.strokeWidth,
							fill: el.fill ?? undefined,
							rotation: el.rotation,
							draggable: true,
							opacity: isSelected(el.id) ? 0.8 : 1
						}}
						on:click={(e) => onShapeClick(el.id, e)}
						on:dragend={(e) => onShapeDragEnd(el, e)}
					/>
					{#if el.text}
						<KonvaText
							config={{
								x: el.x,
								y: el.y,
								offsetX: el.rx,
								offsetY: el.ry,
								width: el.rx * 2,
								height: el.ry * 2,
								align: 'center',
								verticalAlign: 'middle',
								text: el.text,
								fontSize: 14,
								listening: false
							}}
						/>
					{/if}
				{:else if shape.type === 'text'}
					{@const t = shape as TextShape}
					<KonvaText
						config={{
							x: t.x,
							y: t.y,
							offsetX: (t.width ?? t.text.length * t.fontSize * 0.6) / 2,
							offsetY: (t.height ?? t.fontSize * 1.2) / 2,
							text: t.text,
							fontSize: t.fontSize,
							fontFamily: t.fontFamily,
							align: t.align,
							draggable: true,
							opacity: isSelected(t.id) ? 0.8 : 1
						}}
						on:click={(e) => onShapeClick(t.id, e)}
						on:dragend={(e) => onShapeDragEnd(t, e)}
					/>
				{:else if shape.type === 'arrow'}
					{@const a = shape as ArrowShape}
					<Arrow
						config={{
							...renderArrow(a),
							x: a.x,
							y: a.y,
							stroke: a.stroke,
							strokeWidth: a.strokeWidth,
							fill: a.stroke,
							lineCap: 'round',
							lineJoin: 'round',
							pointerLength: 10,
							pointerWidth: 10,
							draggable: true,
							opacity: isSelected(a.id) ? 0.8 : 1
						}}
						on:click={(e) => onShapeClick(a.id, e)}
						on:dragend={(e) => onArrowDragEnd(a, e)}
					/>
				{:else if shape.type === 'group'}
					{@const g = shape as GroupShape}
					<Group
						config={{
							x: g.x,
							y: g.y,
							rotation: g.rotation,
							scaleX: g.scaleX,
							scaleY: g.scaleY,
							draggable: true,
							opacity: isSelected(g.id) ? 0.8 : 1
						}}
						on:click={(e) => onShapeClick(g.id, e)}
						on:dragend={(e) => onShapeDragEnd(g, e)}
					>
						<!-- Group children are rendered by looking up child shapes -->
						{#each g.children as childId}
							{@const child = shapes.find((s) => s.id === childId)}
							{#if child?.type === 'rect'}
								{@const rect = child as RectShape}
								<Rect
									config={{
										x: rect.x - g.x,
										y: rect.y - g.y,
										width: rect.width,
										height: rect.height,
										offsetX: rect.width / 2,
										offsetY: rect.height / 2,
										stroke: rect.stroke,
										strokeWidth: rect.strokeWidth,
										fill: rect.fill ?? undefined,
										rotation: rect.rotation
									}}
								/>
							{/if}
						{/each}
					</Group>
				{/if}
			{/each}
		</Layer>
	</Stage>
</div>

<style>
	div {
		overflow: hidden;
	}
</style>
