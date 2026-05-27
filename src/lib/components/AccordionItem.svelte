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
            'group flex w-full cursor-pointer  text-left transition-colors p-4',
            className
        )}
        onclick={toggle}
        aria-expanded={open}
    >
        <div class="cursor-pointer transition-colors duration-300 group-hover:text-primary">
            {@render header()}
        </div>
        <div class="t-icon-swap ml-auto cursor-pointer" data-state={open ? 'b' : 'a'}>
            <span class="t-icon" data-icon="a">
                <svg class="h-6 w-6 transition-colors duration-300 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </span>
            <span class="t-icon" data-icon="b">
                <svg class="h-6 w-6 transition-colors duration-300 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </span>
        </div>
    </button>

    {#if open}
        <div transition:slide={{ duration: 300 }} class="">
            {@render children()}
        </div>
    {/if}
</div>