<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		cols?: '1' | '2' | '3' | '24';
		gap?: 'sm' | 'md' | 'lg';
		responsive?: boolean;
		children: Snippet;
		class?: string;
	}

	let {
		cols = '2',
		gap = 'md',
		responsive = true,
		children,
		class: className = ''
	}: Props = $props();

	const getColsClass = () => {
		if (!responsive) {
			if (cols === '24') return 'grid-cols-24';
			return `grid-cols-${cols}`;
		}

		switch (cols) {
			case '1':
				return 'grid-cols-1';
			case '2':
				return 'grid-cols-1 md:grid-cols-2';
			case '3':
				return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
			case '24':
				return 'grid-cols-1 md:grid-cols-24 lg:grid-cols-24';
			default:
				return 'grid-cols-1 md:grid-cols-2';
		}
	};

	const gapClasses = {
		sm: 'gap-4',
		md: 'gap-4 lg:gap-6',
		lg: 'gap-4 sm:gap-6 lg:gap-8'
	};
</script>

<div class={cn('grid w-full px-5 md:px-0', getColsClass(), gapClasses[gap], className)}>
	{@render children()}
</div>
