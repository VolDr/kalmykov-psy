<script lang="ts">
	import { page } from '$app/stores';
	import Excalidraw from '$lib/components/excalidraw/Excalidraw.svelte';
	import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

	let excalidrawAPI: ExcalidrawImperativeAPI | undefined = $state();
	let canvasId = $derived($page.url.searchParams.get('id'));
	let error = $state<string | null>(null);

	$effect(() => {
		if (excalidrawAPI && canvasId) {
			// Load canvas data
			loadCanvasData(canvasId);
		}
	});

	async function loadCanvasData(id: string) {
		try {
			const response = await fetch(`/api/canvas/${id}`);
			if (!response.ok) {
				if (response.status === 403) {
					error = 'Доступ к этому канвасу запрещен. Канвас не является публичным.';
					return;
				}
				throw new Error('Failed to load canvas');
			}

			const data = await response.json();
			if (excalidrawAPI && data.elements) {
				excalidrawAPI.updateScene({
					elements: data.elements,
					appState: data.appState,
					collaborators: []
				});
			}
		} catch (err) {
			console.error('Failed to load canvas data:', err);
			error = 'Не удалось загрузить канвас';
		}
	}
</script>

<svelte:head>
	<title>Публичный канвас</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if error}
	<div class="flex h-screen items-center justify-center bg-gray-100">
		<div class="rounded-lg bg-white p-8 shadow-lg">
			<h1 class="mb-4 text-2xl font-bold text-red-600">Ошибка доступа</h1>
			<p class="text-gray-700">{error}</p>
		</div>
	</div>
{:else if !canvasId}
	<div class="flex h-screen items-center justify-center bg-gray-100">
		<div class="rounded-lg bg-white p-8 shadow-lg">
			<h1 class="mb-4 text-2xl font-bold text-gray-800">ID канваса не указан</h1>
			<p class="text-gray-700">Пожалуйста, укажите ID канваса в параметре URL: ?id=...</p>
		</div>
	</div>
{:else}
<Excalidraw theme="light" excalidrawAPI={(api) => (excalidrawAPI = api)} />

{/if}
