<script lang="ts">
	import { getContext } from 'svelte';

	const { height, yScale } = getContext('LayerCake');

	const ticks = $derived.by(() => {
		const domain = $yScale.domain();
		const step = 10;
		const result = [];
		for (let i = domain[0]; i <= domain[1]; i += step) {
			result.push({
				value: $yScale(i),
				label: i
			});
		}
		return result;
	});
</script>

<g class="axis y-axis">
	<line x1="0" y1="0" x2="0" y2={$height} stroke="#000" stroke-width="1" />
	{#each ticks as tick}
		<g transform="translate(0, {tick.value})">
			<line x2="-6" stroke="#000" />
			<text x="-10" text-anchor="end" dominant-baseline="middle" font-size="12">{tick.label}</text>
		</g>
	{/each}
</g>
