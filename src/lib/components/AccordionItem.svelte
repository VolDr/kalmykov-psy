<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { cubicOut, cubicIn } from 'svelte/easing';

	let {
		header,
		children,
		isOpen = false,
		class: className = '',
		variant = 'default'
	}: {
		header: Snippet;
		children: Snippet;
		isOpen?: boolean;
		class?: string;
		variant?: 'default' | 'education';
	} = $props();

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
		type="button"
		class={cn(
			'group flex w-full cursor-pointer text-left transition-colors',
			variant === 'education'
				? 'items-center gap-5 rounded-[18px] bg-white/40 p-4 shadow-[0_10px_32px_rgba(43,42,78,0.025)] transition-[background-color,box-shadow] duration-200 hover:bg-[#fffdf7] hover:shadow-[0_12px_36px_rgba(43,42,78,0.04)]'
				: 'p-4',
			className
		)}
		onclick={toggle}
		aria-expanded={open}
	>
		<div
			class={cn(
				'min-w-0 cursor-pointer transition-colors duration-300',
				variant === 'education' ? 'flex-1' : 'group-hover:text-primary lg:min-w-full'
			)}
		>
			{@render header()}
		</div>
		{#if variant === 'education'}
			<svg
				class="education-chevron h-7 w-7 shrink-0 text-navy group-hover:text-primary"
				data-expanded={open}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m9 5 7 7-7 7" />
			</svg>
		{:else}
			<div class="t-icon-swap ml-auto shrink-0 cursor-pointer" data-state={open ? 'b' : 'a'}>
				<span class="t-icon" data-icon="a">
					<svg
						class="h-6 w-6 transition-colors duration-300 group-hover:text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
						aria-hidden="true"
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
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
					</svg>
				</span>
			</div>
		{/if}
	</button>

	{#if open}
		<div in:slideOpen out:slideClose>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.education-chevron {
		transform: rotate(0deg);
		transform-origin: center;
		transition:
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			color 180ms ease;
	}

	.education-chevron[data-expanded='true'] {
		transform: rotate(90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.education-chevron {
			transition: none;
		}

		div {
			transition: none !important;
		}
	}
</style>
