<script lang="ts">
	import { createElement } from 'react';
	import { createRoot } from 'react-dom/client';
	import type { ExcalidrawProps } from '@excalidraw/excalidraw/types/types';

	let props: ExcalidrawProps = $props();
	let rootEl: HTMLElement;

	$effect(() => {
		const root = createRoot(rootEl);

		import('@excalidraw/excalidraw').then(({ Excalidraw, WelcomeScreen, MainMenu }) => {
			const welcome = createElement(WelcomeScreen, { key: 'WelcomeScreen' });
			const menu = createElement(MainMenu, { key: 'MainMenu' }, [
				createElement(MainMenu.DefaultItems.LoadScene, { key: 'LoadScene' }),
				createElement(MainMenu.DefaultItems.SaveAsImage, { key: 'SaveAsImage' }),
				createElement(MainMenu.DefaultItems.Export, { key: 'Export' }),
				createElement(MainMenu.Separator, { key: 'Separator' }),
				createElement(MainMenu.DefaultItems.ChangeCanvasBackground, {
					key: 'ChangeCanvasBackground'
				})
			]);
			const excalidraw = createElement(Excalidraw, { ...props }, [welcome, menu]);
			root.render(excalidraw);
		});

		return () => root.unmount();
	});
</script>

<div bind:this={rootEl} class="root"></div>

<style>
	.root {
		height: 100svh;
		font-size: 16px;
	}

	.root :global(.ExcalidrawLogo) {
		max-width: 150px;
		max-height: 40px;
	}

	.root :global(.ExcalidrawLogo.is-small) {
		max-width: 100px;
		max-height: 30px;
	}

	.root :global(.ExcalidrawLogo svg) {
		max-width: 100%;
		max-height: 100%;
	}
</style>
