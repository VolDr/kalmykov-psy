<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';

	let {
		imageUrl,
		title,
		isLoaded,
		isFirstOpen,
		direction,
		onLoad
	}: {
		imageUrl: string;
		title: string;
		isLoaded: boolean;
		isFirstOpen: boolean;
		direction: number;
		onLoad: (imageUrl: string) => void;
	} = $props();

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		if (window.innerWidth < 768) {
			window.open(imageUrl, '_blank');
		}
	}
</script>

<div
	in:fly={{
		x: isFirstOpen ? 0 : direction * 300,
		duration: isFirstOpen ? 0 : 300,
		easing: cubicOut
	}}
	out:fly={{
		x: isFirstOpen ? 0 : direction * -300,
		duration: isFirstOpen ? 0 : 300,
		easing: cubicOut
	}}
	class="absolute inset-0 flex items-center justify-center"
>
	<img
		src={imageUrl}
		alt={title}
		class={cn(
			'max-h-full w-auto max-w-full transition-opacity',
			isLoaded ? 'opacity-100' : 'opacity-0'
		)}
		onclick={handleClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick(new MouseEvent('click') as any);
			}
		}}
		onload={() => onLoad(imageUrl)}
		loading="eager"
		role="button"
		tabindex="0"
		aria-label={`${title}. ${window.innerWidth < 768 ? 'Нажмите для открытия в новой вкладке' : ''}`}
	/>
	{#if !isLoaded}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-[#cfc1a3]"></div>
		</div>
	{/if}
</div>
