<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		href,
		children,
		variant = 'primary',
		class: className = '',
		...restProps
	}: {
		href?: string;
		children: Snippet;
		variant?: 'primary' | 'secondary';
		class?: string;
		target?: string;
		rel?: string;
	} = $props();

	const baseClasses =
		'text-center tracking-wide py-[10px] px-[30px] outline outline-solid rounded-[10px] inline-block transition-all duration-200 ease-out active:transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-default';

	const variantClasses = {
		primary:
			'text-white outline-none bg-opacity-0 bg-[#B8A98A] hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md ',
		secondary: 'text-white outline-red-50 bg-opacity-0 hover:bg-[#B8A98A] hover:text-white hover:outline-none'
	};
</script>

{#if href}
	<a {href} class={cn(baseClasses, variantClasses[variant], className)} {...restProps}>
		{@render children()}
	</a>
{:else}
	<button class={cn(baseClasses, variantClasses[variant], className)} {...restProps}>
		{@render children()}
	</button>
{/if}
