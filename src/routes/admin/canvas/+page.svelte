<script lang="ts">
	import { page } from '$app/stores';
	import Excalidraw from '$lib/components/excalidraw/Excalidraw.svelte';
	import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

	let excalidrawAPI: ExcalidrawImperativeAPI | undefined = $state();
	let clientId = $derived($page.url.searchParams.get('id'));

	$effect(() => {
		if (excalidrawAPI && clientId) {
			// Load canvas data for this client
			loadCanvasData(clientId);
		}
	});

	async function loadCanvasData(id: string) {
		try {
			const response = await fetch(`/api/canvas/${id}`);
			if (response.ok) {
				const data = await response.json();
				if (excalidrawAPI && data.elements) {
					excalidrawAPI.updateScene({
						elements: data.elements,
						appState: data.appState,
						collaborators: []
					});
				}
			}
		} catch (error) {
			console.error('Failed to load canvas data:', error);
		}
	}

	async function saveCanvasData() {
		if (!excalidrawAPI || !clientId) return;

		try {
			const elements = excalidrawAPI.getSceneElements();
			const appState = excalidrawAPI.getAppState();

			const response = await fetch(`/api/canvas/${clientId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ elements, appState })
			});

			if (response.ok) {
				console.log('Canvas saved successfully');
			}
		} catch (error) {
			console.error('Failed to save canvas data:', error);
		}
	}

	$effect(() => {
		if (excalidrawAPI) {
			// Auto-save every 30 seconds
			const interval = setInterval(() => {
				saveCanvasData();
			}, 3000);

			return () => clearInterval(interval);
		}
	});
</script>

<svelte:head>
	<title>Канвас клиента - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Excalidraw theme="light" excalidrawAPI={(api) => (excalidrawAPI = api)} />
