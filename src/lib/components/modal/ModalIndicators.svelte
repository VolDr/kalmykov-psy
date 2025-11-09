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

<div class="flex justify-center items-center gap-2 pb-4 pt-[30px] w-full">
	{#each Array(total) as _, index}
		<button
			onclick={(e) => handleClick(e, index)}
			class={cn(
				'transition-all duration-200 cursor-pointer rounded-full',
				index === current ? 'bg-[#cfc1a3] w-8 h-2' : 'bg-gray-300 hover:bg-gray-400 w-2 h-2'
			)}
			aria-label="Перейти к диплому {index + 1}"
		></button>
	{/each}
</div>
