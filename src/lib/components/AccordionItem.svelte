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

<div class="">
    <button
        class={cn(
            'group flex w-full cursor-pointer p-4 text-left transition-colors',
            className
        )}
        onclick={toggle}
        aria-expanded={open}
    >
        <div class="cursor-pointer transition-colors duration-300 group-hover:text-primary">
            {@render header()}
        </div>
        <div
            class={cn(
                'ml-auto cursor-pointer transition-transform duration-300 ease-out',
                open && 'rotate-180'
            )}
        >
            <svg class="h-6 w-6 transition-colors duration-300 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </button>

    {#if open}
        <div transition:slide={{ duration: 300 }} class="p-4">
            {@render children()}
        </div>
    {/if}
</div>