<script lang="ts">
	import { Image as KonvaImage } from 'svelte-konva';
	import type { RectShape, EllipseShape } from '../model/shapes';
	import { renderRoughRect, renderRoughEllipse } from '../engine/rough';

	interface Props {
		shape: RectShape | EllipseShape;
		isSelected: boolean;
		onclick?: (e: any) => void;
		ondblclick?: () => void;
		ondragend?: (e: any) => void;
	}

	let { shape, isSelected, onclick, ondblclick, ondragend }: Props = $props();

	// Render rough canvas on change
	let roughCanvas: HTMLCanvasElement | null = $state(null);

	$effect(() => {
		if (shape.type === 'rect') {
			roughCanvas = renderRoughRect(shape as RectShape);
		} else if (shape.type === 'ellipse') {
			roughCanvas = renderRoughEllipse(shape as EllipseShape);
		}
	});

	// Calculate offset for centering (accounting for padding)
	const padding = 20;
	let offsetX = $derived(
		shape.type === 'rect'
			? (shape as RectShape).width / 2 + padding
			: (shape as EllipseShape).rx + padding
	);
	let offsetY = $derived(
		shape.type === 'rect'
			? (shape as RectShape).height / 2 + padding
			: (shape as EllipseShape).ry + padding
	);
</script>

{#if roughCanvas}
	<KonvaImage
		id={shape.id}
		x={shape.x}
		y={shape.y}
		image={roughCanvas}
		{offsetX}
		{offsetY}
		rotation={shape.rotation}
		scaleX={shape.scaleX}
		scaleY={shape.scaleY}
		draggable={true}
		opacity={isSelected ? 0.8 : 1}
		{onclick}
		{ondblclick}
		{ondragend}
	/>
{/if}
