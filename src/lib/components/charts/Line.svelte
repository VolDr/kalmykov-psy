<script lang="ts">
	import { getContext } from 'svelte';

	interface Props {
		stroke?: string;
		y?: string;
	}

	let { stroke = '#000', y }: Props = $props();

	const { data, xGet, yGet, yScale } = getContext('LayerCake');

	const path = $derived.by(() => {
		if (!$data || $data.length === 0) return '';

		const yAccessor = y || $yScale.field;
		const points = $data.map((d: any) => {
			const xVal = $xGet(d);
			const yVal = typeof yAccessor === 'function' ? yAccessor(d) : d[yAccessor];
			return `${xVal},${$yScale(yVal)}`;
		});

		return `M${points.join('L')}`;
	});
</script>

<path d={path} fill="none" {stroke} stroke-width="2" />
