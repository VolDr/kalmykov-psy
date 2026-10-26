<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	// Рукописный заголовок раздела с жёлтым «свушем» снизу, как на главной.
	type Props = {
		children: Snippet;
		id?: string;
		class?: string;
	};

	let { children, id, class: className = '' }: Props = $props();
</script>

<div class={cn('relative inline-block', className)}>
	<h2 {id} class="font-caveat text-[34px] leading-[1.15] font-bold text-navy lg:text-[40px]">
		{@render children()}
	</h2>
	<svg
		class="absolute right-[-6px] -bottom-3 left-0 w-full"
		height="14"
		viewBox="0 0 240 16"
		fill="none"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<path
			d="M3 11 C60 4 120 4 178 8 C200 9 222 11 237 7"
			stroke="var(--color-primary)"
			stroke-width="4"
			stroke-linecap="round"
		/>
	</svg>
</div>
