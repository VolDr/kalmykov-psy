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
		'text-center font-light tracking-wide py-[10px] px-[30px] border border-solid rounded-[10px] inline-block transition-all duration-500 ease-out active:transform active:scale-95';

	const variantClasses = {
		primary:
			'text-black border-black bg-opacity-0 hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md hover:-translate-y-0.5',
		secondary: 'text-white border-white bg-opacity-0 hover:bg-white hover:text-black'
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
