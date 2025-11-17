<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	let {
		href,
		children,
		variant = 'primary',
		class: className = '',
		...restProps
	}: {
		href?: string;
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'outline';
		class?: string;
	} & Omit<HTMLButtonAttributes, 'class'> &
		Omit<HTMLAnchorAttributes, 'class' | 'href'> = $props();

	const baseClasses =
		'text-center font-light tracking-wide py-[10px] px-[30px] border border-solid rounded-[10px] inline-block transition-all duration-200 ease-out active:transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-default';

	const variantClasses = {
		primary:
			'text-black border-black bg-opacity-0 hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md ',
		secondary: 'text-white border-white bg-opacity-0 hover:bg-white hover:text-black',
		outline: 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'
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
