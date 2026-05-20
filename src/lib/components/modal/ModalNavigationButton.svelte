<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		direction,
		onclick,
		label
	}: {
		direction: 'prev' | 'next';
		onclick: (e: MouseEvent) => void;
		label: string;
	} = $props();

	const positionClasses = direction === 'prev' ? 'left-2 md:left-4' : 'right-2 md:right-4';
	const iconPath = direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
</script>

<button
	{onclick}
	class={cn(
		'invisible absolute top-1/2 z-20 -translate-y-1/2 md:visible',
		'p-3 font-light tracking-wide text-foreground',
		'rounded-md border border-solid border-black',
		'bg-opacity-90 bg-white',
		'transition-all duration-200 ease-out',
		'hover:border-primary-light hover:bg-primary-light hover:text-white hover:shadow-md',
		'active:scale-95 active:transform',
		positionClasses
	)}
	aria-label={label}
>
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
	</svg>
</button>
