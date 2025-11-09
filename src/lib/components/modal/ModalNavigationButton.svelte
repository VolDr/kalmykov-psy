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
	const iconPath =
		direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
</script>

<button
	{onclick}
	class={cn(
		'absolute invisible md:visible top-1/2 -translate-y-1/2 z-20',
		'p-2 text-[#191919] font-light tracking-wide',
		'border border-solid rounded-[10px] border-black',
		'bg-white bg-opacity-90',
		'transition-all duration-200 ease-out',
		'hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md',
		'active:transform active:scale-95',
		positionClasses
	)}
	aria-label={label}
>
	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
	</svg>
</button>
