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
		const mq = window.matchMedia('(max-width: 767px)');
		if (mq.matches) {
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
	<button
		type="button"
		onclick={handleClick}
		class="block max-h-full max-w-full"
		aria-label={title}
	>
		<img
			src={imageUrl}
			alt=""
			class={cn(
				'max-h-full w-auto max-w-full transition-opacity',
				isLoaded ? 'opacity-100' : 'opacity-0'
			)}
			onload={() => onLoad(imageUrl)}
			loading="eager"
		/>
	</button>
	{#if !isLoaded}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-light"></div>
		</div>
	{/if}
</div>
