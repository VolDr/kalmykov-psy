<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Canvas from '$lib/canvas/ui/Canvas.svelte';
	import { shapesHistory, camera } from '$lib/canvas/stores';
	import type {
		SceneData,
		RectShape,
		EllipseShape,
		ArrowShape,
		TextShape
	} from '$lib/canvas/model/shapes';
	import { createAddShapesOp } from '$lib/canvas/sync/types';
	import { CANVAS_FONT_FAMILY, DEFAULT_FONT_SIZE } from '$lib/canvas/constants';
	import { createDefaultRoughOptions } from '$lib/canvas/engine/rough';
	import { icons } from '$lib/canvas/ui/icons';
	import { page } from '$app/stores';

	// Get sceneId from URL query parameter or use demo scene UUID
	let sceneId = $derived($page.url.searchParams.get('id') || '550e8400-e29b-41d4-a716-446655440000');

	let isSaving = $state(false);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Multiplayer settings
	let multiplayerEnabled = $state(true); // Enable multiplayer by default
	let userName = $state('');
	let wsUrl = $state('');

	onMount(async () => {
		// Set WebSocket URL - connect to standalone WS server on port 3001
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.hostname;
		wsUrl = `${protocol}//${host}:3001`;

		// Generate default username
		userName = `User_${Math.random().toString(36).slice(2, 6)}`;

		try {
			const res = await fetch(`/api/scenes/${sceneId}`);
			if (res.ok) {
				const scene = (await res.json()) as SceneData;
				shapesHistory.setAllShapes(scene.shapes);
				camera.set(scene.camera);
			} else if (res.status === 404) {
				// No saved scene - create demo shapes
				createDemoShapes();
			}
		} catch {
			// Network error - create demo shapes
			createDemoShapes();
		} finally {
			isLoading = false;
		}
	});

	function createDemoShapes() {
		const rect: RectShape = {
			id: crypto.randomUUID(),
			type: 'rect',
			x: 200,
			y: 200,
			width: 120,
			height: 80,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#1971c2',
			strokeWidth: 2,
			fill: '#d0ebff',
			text: 'Rectangle',
			roughOptions: createDefaultRoughOptions()
		};

		const ellipse: EllipseShape = {
			id: crypto.randomUUID(),
			type: 'ellipse',
			x: 450,
			y: 200,
			rx: 70,
			ry: 50,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#2f9e44',
			strokeWidth: 2,
			fill: '#d8f5a2',
			roughOptions: createDefaultRoughOptions()
		};

		const arrow: ArrowShape = {
			id: crypto.randomUUID(),
			type: 'arrow',
			x: 320,
			y: 200,
			points: [
				[0, 0],
				[60, 0]
			],
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#e8590c',
			strokeWidth: 3,
			doubleEnded: true,
			from: { shapeId: rect.id, anchor: 'right' },
			to: { shapeId: ellipse.id, anchor: 'left' }
		};

		const text: TextShape = {
			id: crypto.randomUUID(),
			type: 'text',
			x: 350,
			y: 350,
			text: 'Excalidraw Clone',
			fontSize: 24,
			fontFamily: CANVAS_FONT_FAMILY,
			align: 'center',
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#495057',
			strokeWidth: 1
		};

		shapesHistory.addShapes([rect, ellipse, arrow, text]);
	}

	async function save() {
		isSaving = true;
		loadError = null;

		try {
			const shapesState = get(shapesHistory);
			const cameraSnapshot = get(camera);

			const scene: SceneData = {
				id: sceneId,
				shapes: shapesState.shapes,
				camera: cameraSnapshot
			};

			const res = await fetch(`/api/scenes/${sceneId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scene)
			});

			if (!res.ok) {
				throw new Error('Failed to save');
			}
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Save failed';
		} finally {
			isSaving = false;
		}
	}

	function addRect() {
		const rect: RectShape = {
			id: crypto.randomUUID(),
			type: 'rect',
			x: 100 + Math.random() * 400,
			y: 100 + Math.random() * 300,
			width: 100,
			height: 70,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#1971c2',
			strokeWidth: 2,
			fill: '#d0ebff'
		};
		shapesHistory.addShapes([rect]);
	}

	function addEllipse() {
		const ellipse: EllipseShape = {
			id: crypto.randomUUID(),
			type: 'ellipse',
			x: 100 + Math.random() * 400,
			y: 100 + Math.random() * 300,
			rx: 60,
			ry: 40,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			stroke: '#2f9e44',
			strokeWidth: 2,
			fill: '#d8f5a2'
		};
		shapesHistory.addShapes([ellipse]);
	}

	function handleUndo() {
		shapesHistory.undo();
	}

	function handleRedo() {
		shapesHistory.redo();
	}
</script>

<svelte:head>
	<title>Canvas Demo - Excalidraw Clone</title>
</svelte:head>

<div class="relative h-screen w-screen bg-gray-50">
	<!-- Toolbar -->
	<div class="absolute top-4 left-4 z-10 flex gap-1 rounded-lg bg-white p-2 shadow-md">
		<button
			onclick={handleUndo}
			class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
			title="Undo (Ctrl+Z)"
			aria-label="Undo"
		>
			{@html icons.undo}
		</button>
		<button
			onclick={handleRedo}
			class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
			title="Redo (Ctrl+Shift+Z)"
			aria-label="Redo"
		>
			{@html icons.redo}
		</button>
		<div class="mx-1 w-px bg-gray-200"></div>
		<button
			onclick={save}
			disabled={isSaving}
			class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
			title="Save scene"
			aria-label="Save scene"
		>
			{@html icons.save}
		</button>
	</div>

	<!-- Multiplayer Controls -->
	<div class="absolute top-20 left-4 z-10 rounded-lg bg-white p-3 shadow-md">
		<h3 class="mb-2 text-sm font-semibold">Multiplayer</h3>
		<div class="space-y-2">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={multiplayerEnabled}
					class="h-4 w-4 rounded border-gray-300"
				/>
				<span class="text-sm">Enable</span>
			</label>
			{#if multiplayerEnabled}
				<input
					type="text"
					bind:value={userName}
					placeholder="Your name"
					class="w-full rounded border px-2 py-1 text-sm"
				/>
			{/if}
		</div>
	</div>

	<!-- Instructions -->
	<div class="absolute top-4 right-4 z-10 max-w-xs rounded-lg bg-white p-3 text-xs shadow-md">
		<h3 class="mb-2 font-semibold">Controls:</h3>
		<ul class="space-y-1 text-gray-600">
			<li>Click shape to select</li>
			<li>Ctrl/Cmd + Click for multi-select</li>
			<li>Drag shapes to move</li>
			<li>Scroll to zoom</li>
			<li>Shift+Alt+Drag or Middle-click to pan</li>
			<li>Delete/Backspace to remove selected</li>
			<li>Ctrl/Cmd+Z to undo</li>
			<li>Ctrl/Cmd+Shift+Z to redo</li>
			<li>Ctrl/Cmd+D to duplicate</li>
		</ul>
	</div>

	<!-- Error display -->
	{#if loadError}
		<div
			class="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded bg-red-100 px-4 py-2 text-red-700"
		>
			{loadError}
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-gray-500">Loading canvas...</div>
		</div>
	{:else}
		<Canvas multiplayer={multiplayerEnabled} {wsUrl} {sceneId} {userName} />
	{/if}
</div>
