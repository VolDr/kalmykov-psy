<script lang="ts">
	import { page } from '$app/stores';
	import Excalidraw from '$lib/components/excalidraw/Excalidraw.svelte';

	// Типы для Excalidraw v0.17 (импорт не работает корректно, используем any)
	let excalidrawAPI: any | undefined = $state();
	let clientId = $derived($page.url.searchParams.get('id'));

	// Настройка UI для зума без Ctrl
	const uiOptions: any = {
		canvasActions: {
			changeViewBackgroundColor: true,
			clearCanvas: true,
			export: true,
			loadScene: true,
			saveToActiveFile: true,
			theme: true,
			saveAsImage: true
		}
	};

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
			// Если Ctrl не нажат, эмулируем Ctrl+wheel для зума
			if (!e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				e.stopPropagation();

				// Создаем новое событие с ctrlKey = true
				const newEvent = new WheelEvent('wheel', {
					...e,
					ctrlKey: true,
					bubbles: true,
					cancelable: true,
					deltaY: e.deltaY
				});

				e.target?.dispatchEvent(newEvent);
			}
		};

		wrapperElement.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			wrapperElement.removeEventListener('wheel', handleWheel);
		};
	});
</script>

<svelte:head>
	<title>Канвас клиента - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="excalidraw-wrapper" bind:this={wrapperElement}>
	<Excalidraw
		theme="light"
		excalidrawAPI={(api: any) => (excalidrawAPI = api)}
		UIOptions={uiOptions}
	/>
</div>

<style>
	.excalidraw-wrapper {
		height: 100svh;
	}
</style>
