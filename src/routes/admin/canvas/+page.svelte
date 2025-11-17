<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Canvas from '$lib/canvas/ui/Canvas.svelte';
	import { shapesHistory, camera } from '$lib/canvas/stores';
	import type { SceneData } from '$lib/canvas/model/shapes';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	let isSaving = $state(false);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let isShared = $state(data.isShared);
	let isUpdatingSharing = $state(false);
	let shareUrl = $state('');
	let copySuccess = $state(false);

	onMount(async () => {
		// Generate share URL
		if (typeof window !== 'undefined') {
			shareUrl = `${window.location.origin}/canvas?id=${data.sceneId}`;
		}
		try {
			const res = await fetch(`/api/scenes/${data.sceneId}`);
			if (res.ok) {
				const scene = (await res.json()) as SceneData;
				shapesHistory.setAllShapes(scene.shapes);
				camera.set(scene.camera);
			} else if (res.status === 404) {
				// No saved scene - start with empty canvas
				shapesHistory.setAllShapes([]);
			} else {
				const errorData = await res.json();
				loadError = errorData.message || 'Failed to load canvas';
			}
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Network error';
		} finally {
			isLoading = false;
		}
	});

	async function save() {
		isSaving = true;
		loadError = null;

		try {
			const shapesState = get(shapesHistory);
			const cameraSnapshot = get(camera);

			const scene: SceneData = {
				id: data.sceneId,
				shapes: shapesState.shapes,
				camera: cameraSnapshot
			};

			const res = await fetch(`/api/scenes/${data.sceneId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scene)
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to save');
			}
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

	async function toggleSharing() {
		isUpdatingSharing = true;
		loadError = null;

		try {
			const res = await fetch('/api/canvas/sharing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientId: data.clientId,
					isShared: !isShared
				})
			});

			if (!res.ok) {
				throw new Error('Failed to update sharing');
			}

			isShared = !isShared;
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Failed to update sharing';
		} finally {
			isUpdatingSharing = false;
		}
	}

	async function copyShareUrl() {
		if (navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(shareUrl);
				copySuccess = true;
				setTimeout(() => {
					copySuccess = false;
				}, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
		}
	}
</script>

<svelte:head>
	<title>Canvas - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="relative h-screen w-screen bg-gray-50">
	<!-- Top toolbar -->
	<div class="absolute top-4 right-4 z-10 flex gap-2 rounded-lg bg-white p-2 shadow-md">
		<a href="/admin/profile?clientId={data.clientId}">
			<Button variant="outline" size="sm">
				<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
				Назад к профилю
			</Button>
		</a>
		<div class="mx-1 w-px bg-gray-300"></div>
		<button
			onclick={handleUndo}
			class="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
			title="Undo (Ctrl+Z)"
			aria-label="Undo"
		>
			<span class="icon-[lucide--undo-2] h-5 w-5"></span>
		</button>
		<button
			onclick={handleRedo}
			class="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
			title="Redo (Ctrl+Shift+Z)"
			aria-label="Redo"
		>
			<span class="icon-[lucide--redo-2] h-5 w-5"></span>
		</button>
		<div class="mx-1 w-px bg-gray-300"></div>
		<button
			onclick={save}
			disabled={isSaving}
			class="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
			title={isSaving ? 'Сохранение...' : 'Сохранить (Ctrl+S)'}
			aria-label="Save canvas"
		>
			{#if isSaving}
				<span class="icon-[lucide--loader-2] h-5 w-5 animate-spin"></span>
			{:else}
				<span class="icon-[lucide--save] h-5 w-5"></span>
			{/if}
		</button>
	</div>

	<!-- Sharing Panel -->
	<div class="absolute top-20 right-4 z-10 rounded-lg bg-white p-3 shadow-md">
		<div class="flex items-center gap-2 mb-2">
			<h3 class="text-sm font-semibold">Совместный доступ</h3>
		</div>
		<div class="flex items-center gap-2">
			<label class="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					class="peer sr-only"
					checked={isShared}
					onchange={toggleSharing}
					disabled={isUpdatingSharing}
				/>
				<div
					class="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50"
				></div>
			</label>
			<span class="text-sm text-gray-700">{isShared ? 'Включено' : 'Выключено'}</span>
		</div>
		{#if isShared}
			<div class="mt-3 space-y-2">
				<p class="text-xs text-gray-600">Ссылка для клиента:</p>
				<div class="flex gap-1">
					<input
						type="text"
						readonly
						value={shareUrl}
						class="flex-1 rounded border px-2 py-1 text-xs bg-gray-50"
					/>
					<button
						onclick={copyShareUrl}
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-100"
						title="Копировать ссылку"
						aria-label="Copy share URL"
					>
						{#if copySuccess}
							<span class="icon-[lucide--check] h-4 w-4 text-green-600"></span>
						{:else}
							<span class="icon-[lucide--copy] h-4 w-4"></span>
						{/if}
					</button>
				</div>
			</div>
		{/if}
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
			<div class="text-gray-500">Загрузка канваса...</div>
		</div>
	{:else}
		<Canvas multiplayer={false} sceneId={data.sceneId} />
	{/if}
</div>
