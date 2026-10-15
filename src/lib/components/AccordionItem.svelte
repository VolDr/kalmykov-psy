<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { cubicOut, cubicIn } from 'svelte/easing';

	let {
		header,
		children,
		isOpen = false,
		class: className = ''
	}: { header: Snippet; children: Snippet; isOpen?: boolean; class?: string } = $props();

	let open = $state(isOpen);

	$effect(() => {
		open = isOpen;
	});

	function toggle() {
		open = !open;
	}

	function slideOpen(node: Element, { duration = 300 }: { duration?: number } = {}) {
		const h = (node as HTMLElement).scrollHeight;
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => `height:${t * h}px;overflow:hidden;opacity:${t}`
		};
	}

	function slideClose(node: Element, { duration = 300 }: { duration?: number } = {}) {
		const h = (node as HTMLElement).scrollHeight;
		return {
			duration,
			easing: cubicIn,
			css: (t: number) => `height:${t * h}px;overflow:hidden;opacity:${t}`
		};
	}
</script>

<div>
	<button
		class={cn('group flex w-full cursor-pointer p-4 text-left transition-colors', className)}
		onclick={toggle}
		aria-expanded={open}
		autocomplete="off"
	>
		<div
			class="min-w-0 cursor-pointer transition-colors duration-300 group-hover:text-primary lg:min-w-full"
		>
			{@render header()}
		</div>
		<div class="t-icon-swap ml-auto shrink-0 cursor-pointer" data-state={open ? 'b' : 'a'}>
			<span class="t-icon" data-icon="a">
				<svg
					class="h-6 w-6 transition-colors duration-300 group-hover:text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</span>
			<span class="t-icon" data-icon="b">
				<svg
					class="h-6 w-6 transition-colors duration-300 group-hover:text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
				</svg>
			</span>
		</div>
	</button>

	{#if open}
		<div in:slideOpen out:slideClose>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	@media (prefers-reduced-motion: reduce) {
		div {
			transition: none !important;
		}
	}
</style>
