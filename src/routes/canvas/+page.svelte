<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import Canvas from '$lib/canvas/ui/Canvas.svelte';
	import { shapesHistory, camera } from '$lib/canvas/stores';
	import type { SceneData, RectShape, EllipseShape, ArrowShape, TextShape } from '$lib/canvas/model/shapes';
	import {
		createSyncClient,
		createSyncedHistoryStore,
		type SyncClient,
		type ConnectionStatus
	} from '$lib/canvas/sync/client';
	import { generateClientId, type Presence } from '$lib/canvas/sync/types';

	const sceneId = 'demo-scene-001';
	const clientId = generateClientId();

	let isSaving = $state(false);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// WebSocket sync state
	let syncClient: SyncClient | null = $state(null);
	let connectionStatus: ConnectionStatus = $state('disconnected');
	let remoteUsers: Presence[] = $state([]);
	let syncedHistory: ReturnType<typeof createSyncedHistoryStore> | null = $state(null);

	// Determine WebSocket URL
	function getWebSocketUrl(): string {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.hostname;
		const port = 3001; // WebSocket server port
		return `${protocol}//${host}:${port}/ws/scenes/${sceneId}`;
	}

	onMount(async () => {
		try {
			const res = await fetch(`/api/scenes/${sceneId}`);
			if (res.ok) {
				const scene = (await res.json()) as SceneData;
				shapesHistory.setAllShapes(scene.shapes);
				if (scene.camera) {
					camera.set(scene.camera);
				}
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

		// Initialize WebSocket connection
		initializeSync();
	});

	function initializeSync() {
		const wsUrl = getWebSocketUrl();

		syncClient = createSyncClient({
			url: wsUrl,
			sceneId,
			clientId,
			historyStore: shapesHistory,
			cameraStore: camera,
			userName: `User ${clientId.slice(0, 4)}`,
			reconnectAttempts: 5,
			reconnectDelay: 1000
		});

		// Create synced history wrapper
		syncedHistory = createSyncedHistoryStore(shapesHistory, syncClient, sceneId, clientId);

		// Subscribe to connection status
		const unsubStatus = syncClient.status.subscribe((status) => {
			connectionStatus = status;
		});

		// Subscribe to remote presences
		const unsubPresence = syncClient.remotePresences.subscribe((presences) => {
			remoteUsers = Array.from(presences.values());
		});

		// Connect to WebSocket server
		syncClient.connect();

		// Clean up on destroy
		onDestroy(() => {
			unsubStatus();
			unsubPresence();
			syncClient?.destroy();
		});
	}

	onDestroy(() => {
		syncClient?.destroy();
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
			text: 'Rectangle'
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
			fill: '#d8f5a2'
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
			fontFamily: 'Arial',
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
			let shapesSnapshot: any[] = [];
			const unsub1 = shapesHistory.subscribe((s) => (shapesSnapshot = s.shapes));
			unsub1();

			let cameraSnapshot = { x: 0, y: 0, scale: 1 };
			const unsub2 = camera.subscribe((c) => (cameraSnapshot = c));
			unsub2();

			const scene: SceneData = {
				id: sceneId,
				shapes: shapesSnapshot,
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
		// Use synced history if available (broadcasts to other clients)
		if (syncedHistory) {
			syncedHistory.addShapes([rect]);
		} else {
			shapesHistory.addShapes([rect]);
		}
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
		// Use synced history if available (broadcasts to other clients)
		if (syncedHistory) {
			syncedHistory.addShapes([ellipse]);
		} else {
			shapesHistory.addShapes([ellipse]);
		}
	}

	function handleUndo() {
		shapesHistory.undo();
	}

	function handleRedo() {
		shapesHistory.redo();
	}

	function getStatusColor(status: ConnectionStatus): string {
		switch (status) {
			case 'connected':
				return 'bg-green-500';
			case 'connecting':
			case 'reconnecting':
				return 'bg-yellow-500';
			case 'disconnected':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusText(status: ConnectionStatus): string {
		switch (status) {
			case 'connected':
				return 'Connected';
			case 'connecting':
				return 'Connecting...';
			case 'reconnecting':
				return 'Reconnecting...';
			case 'disconnected':
				return 'Disconnected';
			default:
				return 'Unknown';
		}
	}
</script>

<svelte:head>
	<title>Canvas Demo - Excalidraw Clone</title>
</svelte:head>

<div class="relative h-screen w-screen bg-gray-50">
	<!-- Toolbar -->
	<div class="absolute left-4 top-4 z-10 flex gap-2 rounded-lg bg-white p-2 shadow-md">
		<button
			onclick={addRect}
			class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
			aria-label="Add rectangle"
		>
			Rect
		</button>
		<button
			onclick={addEllipse}
			class="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
			aria-label="Add ellipse"
		>
			Ellipse
		</button>
		<button
			onclick={handleUndo}
			class="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
			aria-label="Undo"
		>
			Undo
		</button>
		<button
			onclick={handleRedo}
			class="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
			aria-label="Redo"
		>
			Redo
		</button>
		<button
			onclick={save}
			disabled={isSaving}
			class="rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600 disabled:opacity-50"
			aria-label="Save scene"
		>
			{isSaving ? 'Saving...' : 'Save'}
		</button>
	</div>

	<!-- Instructions -->
	<div class="absolute right-4 top-4 z-10 max-w-xs rounded-lg bg-white p-3 text-xs shadow-md">
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
		<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded bg-red-100 px-4 py-2 text-red-700">
			{loadError}
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-gray-500">Loading canvas...</div>
		</div>
	{:else}
		<Canvas />
	{/if}
</div>
