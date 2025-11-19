<script lang="ts">
	import { page } from '$app/stores';
	import Excalidraw from '$lib/components/excalidraw/Excalidraw.svelte';

	// Типы для Excalidraw v0.17 (импорт не работает корректно, используем any)
	let excalidrawAPI: any | undefined = $state();
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

	// Обработчик для зума без Ctrl (просто колесико)
	let wrapperElement: HTMLDivElement;
	$effect(() => {
		if (!wrapperElement) return;

		const handleWheel = (e: WheelEvent) => {
			// Если Ctrl не нажат, добавляем ctrlKey к событию
			if (!e.ctrlKey && !e.metaKey) {
				// Используем Object.defineProperty чтобы переопределить ctrlKey
				Object.defineProperty(e, 'ctrlKey', {
					writable: false,
					value: true
				});
			}
		};

		// Используем capture phase чтобы перехватить событие ДО того как его получит Excalidraw
		wrapperElement.addEventListener('wheel', handleWheel, { passive: false, capture: true });

		return () => {
			wrapperElement.removeEventListener('wheel', handleWheel, { capture: true });
		};
	});
</script>

<svelte:head>
	<title>Канвас клиента - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="excalidraw-wrapper" bind:this={wrapperElement}>
	<Excalidraw theme="light" excalidrawAPI={(api: any) => (excalidrawAPI = api)} />
</div>

<style>
	.excalidraw-wrapper {
		height: 100svh;
	}
</style>
