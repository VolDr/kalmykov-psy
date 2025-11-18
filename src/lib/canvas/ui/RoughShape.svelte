<script lang="ts">
	import { Image as KonvaImage } from 'svelte-konva';
	import type { RectShape, EllipseShape, ArrowShape } from '../model/shapes';
	import { renderRoughRect, renderRoughEllipse, renderRoughArrow } from '../engine/rough';

	interface Props {
		shape: RectShape | EllipseShape | ArrowShape;
		isSelected: boolean;
		onclick?: (e: any) => void;
		ondblclick?: () => void;
		ondragend?: (e: any) => void;
		ondragmove?: (e: any) => void;
	}

	let { shape, isSelected, onclick, ondblclick, ondragend, ondragmove }: Props = $props();

	// Render rough canvas on change
	let roughCanvas: HTMLCanvasElement | null = $state(null);

	$effect(() => {
		if (shape.type === 'rect') {
			roughCanvas = renderRoughRect(shape as RectShape);
		} else if (shape.type === 'ellipse') {
			roughCanvas = renderRoughEllipse(shape as EllipseShape);
		} else if (shape.type === 'arrow') {
			roughCanvas = renderRoughArrow(shape as ArrowShape);
		}
	});

	// Calculate offset for centering (accounting for padding)
	const padding = 20;
	const arrowPadding = 30;
	let offsetX = $derived(
		shape.type === 'rect'
			? (shape as RectShape).width / 2 + padding
			: shape.type === 'ellipse'
				? (shape as EllipseShape).rx + padding
				: (() => {
						const arrow = shape as ArrowShape;
						const allX = arrow.points.map((p) => p[0]);
						const minX = Math.min(...allX);
						return -minX + arrowPadding;
					})()
	);
	let offsetY = $derived(
		shape.type === 'rect'
			? (shape as RectShape).height / 2 + padding
			: shape.type === 'ellipse'
				? (shape as EllipseShape).ry + padding
				: (() => {
						const arrow = shape as ArrowShape;
						const allY = arrow.points.map((p) => p[1]);
						const minY = Math.min(...allY);
						return -minY + arrowPadding;
					})()
	);
</script>

{#if roughCanvas}
	<KonvaImage
		id={shape.id}
		x={0}
		y={0}
		image={roughCanvas}
		{offsetX}
		{offsetY}
		rotation={0}
		scaleX={shape.scaleX}
		scaleY={shape.scaleY}
		draggable={true}
		opacity={isSelected ? 0.8 : 1}
		listening={true}
		{onclick}
		{ondblclick}
		{ondragend}
		{ondragmove}
	/>
{/if}
