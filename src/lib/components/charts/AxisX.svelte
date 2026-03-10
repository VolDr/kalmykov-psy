<script lang="ts">
	import { getContext } from 'svelte';

	const { width, height, xScale, data } = getContext('LayerCake');

	const ticks = $derived.by(() => {
		if (!$data || $data.length === 0) return [];
		return $data.map((d: any) => ({
			value: $xScale(d.x),
			label: d.label
		}));
	});
</script>

<g class="axis x-axis">
	<line x1="0" y1={$height} x2={$width} y2={$height} stroke="#000" stroke-width="1" />
	{#each ticks as tick}
		<g transform="translate({tick.value}, {$height})">
			<line y2="6" stroke="#000" />
			<text y="20" text-anchor="middle" font-size="12">{tick.label}</text>
		</g>
	{/each}
</g>
