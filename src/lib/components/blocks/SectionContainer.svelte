<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		maxWidth?: 'sm' | 'md' | 'lg';
		gap?: 'sm' | 'md' | 'lg';
		titleAlign?: 'left' | 'center';
		children: Snippet;
		class?: string;
	}

	let {
		title = '',
		subtitle = '',
		maxWidth = 'lg',
		gap = 'lg',
		titleAlign = 'center',
		children,
		class: className = ''
	}: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-[720px]',
		md: 'max-w-[960px]',
		lg: 'max-w-[720px] md:max-w-[960px] lg:max-w-[1200px]'
	};

	const gapClasses = {
		sm: 'gap-6',
		md: 'gap-8',
		lg: 'gap-10'
	};

	const titleAlignClasses = {
		left: 'text-left',
		center: 'text-center'
	};
</script>

<div
	class={cn(
		'mx-auto flex flex-col items-center',
		maxWidthClasses[maxWidth],
		gapClasses[gap],
		className
	)}
>
	{#if title}
		<h3 class={cn('subtitle px-6 md:px-0', titleAlignClasses[titleAlign])}>
			{title}
		</h3>
	{/if}

	{#if subtitle}
		<p class={cn('px-6 md:px-0', titleAlignClasses[titleAlign])}>
			{subtitle}
		</p>
	{/if}

	{@render children()}
</div>
