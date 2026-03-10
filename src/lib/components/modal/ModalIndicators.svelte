<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		total,
		current,
		onSelect
	}: {
		total: number;
		current: number;
		onSelect: (index: number) => void;
	} = $props();

	function handleClick(e: MouseEvent, index: number) {
		e.stopPropagation();
		onSelect(index);
	}
</script>

<div class="flex w-full items-center justify-center gap-2 pt-[30px] pb-4">
	{#each Array(total) as _, index}
		<button
			onclick={(e) => handleClick(e, index)}
			class={cn(
				'cursor-pointer rounded-full transition-all duration-200',
				index === current ? 'h-2 w-8 bg-[#cfc1a3]' : 'h-2 w-2 bg-gray-300 hover:bg-gray-400'
			)}
			aria-label="Перейти к диплому {index + 1}"
		></button>
	{/each}
</div>
