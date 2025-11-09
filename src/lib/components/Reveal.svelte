<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		children?: import('svelte').Snippet;
		width?: 'fit-content' | 'full';
		axis?: 'x' | 'y';
		threshold?: number;
		distance?: number;
		minDuration?: number;
		maxDuration?: number;
		minDelay?: number;
		maxDelay?: number;
		easing?: string;
		class?: string;
	}

	let {
		children,
		width = 'fit-content',
		axis = 'y',
		threshold = 0.1,
		distance = 75,
		minDuration = 1200,
		maxDuration = 2000,
		minDelay = 50,
		maxDelay = 400,
		easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
		class: className = ''
	}: Props = $props();

	const widthClass = width === 'full' ? 'w-full' : 'w-fit';
</script>

<div
	class={`${widthClass} ${className}`}
	use:reveal={{ axis, threshold, distance, minDuration, maxDuration, minDelay, maxDelay, easing }}
>
	{@render children?.()}
</div>
