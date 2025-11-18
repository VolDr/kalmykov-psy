<script lang="ts">
	import { createElement } from 'react';
	import { createRoot } from 'react-dom/client';
	import type { ExcalidrawProps } from '@excalidraw/excalidraw/types/types';

	// Only accept props we actually use, not the entire ExcalidrawProps interface
	interface Props {
		theme?: ExcalidrawProps['theme'];
		excalidrawAPI?: ExcalidrawProps['excalidrawAPI'];
		initialData?: ExcalidrawProps['initialData'];
		onChange?: ExcalidrawProps['onChange'];
	}

	let props: Props = $props();
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
			const excalidraw = createElement(Excalidraw, props, [welcome, menu]);
			root.render(excalidraw);
		});

		return () => root.unmount();
	});
</script>

<div bind:this={rootEl} class="root"></div>

<style>
	.root {
		height: 100svh;
	}
</style>
