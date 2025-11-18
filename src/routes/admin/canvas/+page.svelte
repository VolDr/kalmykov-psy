<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Canvas from '$lib/canvas/ui/Canvas.svelte';
	import { shapesHistory, camera } from '$lib/canvas/stores';
	import type { SceneData } from '$lib/canvas/model/shapes';
	import { icons } from '$lib/canvas/ui/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { clientId, sceneId } = data;

	let isSaving = $state(false);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let saveSuccess = $state(false);

	// Multiplayer settings
	let multiplayerEnabled = $state(true); // Enable multiplayer by default
	let userName = $state('Admin');
	let wsUrl = $state('');

	onMount(async () => {
		// Set WebSocket URL - connect to standalone WS server on port 3001
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.hostname;
		wsUrl = `${protocol}//${host}:3001`;

		const fetchStartTime = Date.now();
		console.log(`[Canvas ${sceneId}] Starting to load scene...`);

		try {
			// Add timeout to prevent hanging forever
			const controller = new AbortController();
			const timeoutId = setTimeout(() => {
				console.error(`[Canvas ${sceneId}] Fetch timeout after 10 seconds`);
				controller.abort();
			}, 10000); // 10 second timeout

			console.log(`[Canvas ${sceneId}] Fetching from /api/scenes/${sceneId}...`);
			const res = await fetch(`/api/scenes/${sceneId}`, { signal: controller.signal });
			clearTimeout(timeoutId);

			const fetchTime = Date.now() - fetchStartTime;
			console.log(
				`[Canvas ${sceneId}] Fetch completed in ${fetchTime}ms, status: ${res.status}`
			);

			if (res.ok) {
				console.log(`[Canvas ${sceneId}] Parsing JSON response...`);
				const scene = (await res.json()) as SceneData;
				console.log(
					`[Canvas ${sceneId}] Scene loaded, ${scene.shapes.length} shapes, camera:`,
					scene.camera
				);
				shapesHistory.setAllShapes(scene.shapes);
				camera.set(scene.camera);
				console.log(`[Canvas ${sceneId}] Scene applied to stores successfully`);
			} else if (res.status === 404) {
				console.log(`[Canvas ${sceneId}] Scene not found (404), starting with empty canvas`);
				// Consume the response body to ensure the connection is properly closed
				try {
					const errorBody = await res.json();
					console.log(`[Canvas ${sceneId}] Error response:`, errorBody);
				} catch (e) {
					// Ignore JSON parse errors for error responses
				}
			} else {
				console.log(
					`[Canvas ${sceneId}] Response not OK (status ${res.status}), starting with empty canvas`
				);
				// Consume the response body to ensure the connection is properly closed
				try {
					const errorBody = await res.text();
					console.log(`[Canvas ${sceneId}] Error response:`, errorBody);
				} catch (e) {
					// Ignore parse errors for error responses
				}
			}
		} catch (err) {
			const fetchTime = Date.now() - fetchStartTime;
			if (err instanceof Error && err.name === 'AbortError') {
				console.error(
					`[Canvas ${sceneId}] Request was aborted after ${fetchTime}ms (timeout or manual abort)`
				);
				loadError =
					'Не удалось загрузить канвас: превышено время ожидания. Проверьте подключение к базе данных.';
			} else {
				console.error(`[Canvas ${sceneId}] Failed to load canvas after ${fetchTime}ms:`, err);
				loadError = 'Не удалось загрузить канвас. Проверьте консоль для деталей.';
			}
		} finally {
			const totalTime = Date.now() - fetchStartTime;
			console.log(`[Canvas ${sceneId}] Loading finished, total time: ${totalTime}ms`);
			isLoading = false;
		}
	});

	async function save() {
		isSaving = true;
		loadError = null;
		saveSuccess = false;

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
				const data = await res.json();
				throw new Error(data.message || 'Failed to save');
			}

			saveSuccess = true;
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Save failed';
		} finally {
			isSaving = false;
		}
	}

	function handleUndo() {
		shapesHistory.undo();
	}

	function handleRedo() {
		shapesHistory.redo();
	}

	let shareLinkCopied = $state(false);

	async function copyShareLink() {
		const shareUrl = `${window.location.origin}/canvas?id=${sceneId}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			shareLinkCopied = true;
			setTimeout(() => {
				shareLinkCopied = false;
			}, 3000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}
</script>

<svelte:head>
	<title>Canvas - Client {clientId}</title>
</svelte:head>

<div class="relative h-screen w-screen bg-gray-50">
	<!-- Top toolbar -->
	<div class="absolute top-4 left-4 z-10 flex gap-2">
		<!-- History controls -->
		<div class="flex gap-1 rounded-lg bg-white p-2 shadow-md">
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
				class="flex h-8 items-center gap-2 rounded px-3 hover:bg-gray-100 disabled:opacity-50"
				title="Save canvas"
				aria-label="Save canvas"
			>
				{@html icons.save}
				<span class="text-sm">{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
			</button>
		</div>

		<!-- Share button -->
		<div class="flex gap-1 rounded-lg bg-white p-2 shadow-md">
			<button
				onclick={copyShareLink}
				class="flex h-8 items-center gap-2 rounded px-3 hover:bg-gray-100"
				title="Скопировать ссылку для совместного доступа"
				aria-label="Copy share link"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
					<polyline points="16 6 12 2 8 6" />
					<line x1="12" y1="2" x2="12" y2="15" />
				</svg>
				<span class="text-sm">{shareLinkCopied ? 'Скопировано!' : 'Поделиться'}</span>
			</button>
		</div>
	</div>

	<!-- Success message -->
	{#if saveSuccess}
		<div
			class="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-green-100 px-4 py-2 text-green-700 shadow-md"
		>
			Канвас сохранен
		</div>
	{/if}

	<!-- Error display -->
	{#if loadError}
		<div
			class="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-red-100 px-4 py-2 text-red-700 shadow-md"
		>
			{loadError}
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-gray-500">Загрузка канваса...</div>
		</div>
	{:else}
		<Canvas multiplayer={multiplayerEnabled} {wsUrl} {sceneId} {userName} />
	{/if}
</div>
