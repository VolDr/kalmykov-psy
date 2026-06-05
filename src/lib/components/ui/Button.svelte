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
		'text-center tracking-wide py-[10px] px-[30px] outline outline-solid rounded-4xl inline-block transition-all duration-200 ease-out active:transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-default';

	const variantClasses = {
		primary:
			'text-white outline-none bg-opacity-0 bg-primary hover:bg-primary-light hover:border-primary-light hover:text-white hover:shadow-md ',
		secondary: 'text-white outline-red-50 bg-opacity-0 hover:bg-primary hover:text-white hover:outline-none'
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
