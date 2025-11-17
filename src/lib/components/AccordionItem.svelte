<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

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
</script>

<div class="border-b">
	<button
		class={cn(
			'flex w-full cursor-pointer p-4 text-left transition-colors ',
			className,
			!className && 'hover:bg-[#F2F0EF]',
			!className && open && 'bg-[#F2F0EF]'
		)}
		onclick={toggle}
		aria-expanded={open}
	>
		<div class="cursor-pointer">{@render header()}</div>
		<div
			class={cn(
				'ml-auto cursor-pointer transition-transform duration-500 ease-out',
				open && 'rotate-180'
			)}
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</button>

	{#if open}
		<div transition:slide={{ duration: 500 }} class="p-4">
			{@render children()}
		</div>
	{/if}
</div>
