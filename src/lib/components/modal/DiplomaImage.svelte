<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';

	function pageSlide(_node: Element, { dir = 1, skip = false }: { dir?: number; skip?: boolean } = {}) {
		if (skip) return { duration: 0, css: () => '' };
		const s = getComputedStyle(document.documentElement);
		const dur = parseFloat(s.getPropertyValue('--page-slide-dur')) || 200;
		const dist = parseFloat(s.getPropertyValue('--page-slide-distance')) || 8;
		const blur = parseFloat(s.getPropertyValue('--page-blur')) || 3;
		return {
			duration: dur,
			easing: cubicOut,
			css: (t: number) =>
				`opacity:${t};transform:translateX(${(1 - t) * dist * dir}px);filter:blur(${(1 - t) * blur}px)`
		};
	}

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
	in:pageSlide={{ dir: direction, skip: isFirstOpen }}
	out:pageSlide={{ dir: -direction, skip: isFirstOpen }}
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
