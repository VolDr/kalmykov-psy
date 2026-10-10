<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		options: string[];
		/** Подтверждённый на сервере вариант; null — ещё не отвечал */
		answer: number | null;
		/** Верный вариант и счётчики выборов — только после закрытия вопроса */
		correct: number | null;
		counts: number[] | null;
		revealed: boolean;
		busy: boolean;
		onconfirm: (option: number) => void;
		/** Выбранный, но не подтверждённый вариант — родителю нужен для подписи итога */
		onselect?: (option: number | null) => void;
	};

	let { options, answer, correct, counts, revealed, busy, onconfirm, onselect }: Props = $props();

	// Выбор живёт только на экране и уходит на сервер по кнопке «Подтвердить»
	let selected = $state<number | null>(null);

	const locked = $derived(revealed || answer !== null);
	const marked = $derived(answer ?? selected);

	function choose(i: number) {
		if (locked) return;
		selected = i;
		onselect?.(i);
	}

	function optionClass(i: number): string {
		if (revealed) {
			if (i === correct) return 'border-green-600 bg-green-50';
			if (i === answer) return 'border-destructive bg-destructive/10';
			return 'opacity-60';
		}
		return i === marked ? 'border-primary bg-primary/10' : 'hover:border-primary';
	}
</script>

<div class="space-y-3">
	<div class="grid gap-3" role="group" aria-label="Варианты ответа">
		{#each options as option, i (i)}
			<button
				type="button"
				aria-pressed={marked === i}
				disabled={locked}
				onclick={() => choose(i)}
				class={cn(
					'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left transition-colors duration-150 disabled:cursor-default',
					optionClass(i)
				)}
			>
				<span>{option}</span>
				{#if revealed && counts}
					<span class="text-sm text-muted-foreground tabular-nums">{counts[i]}</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if !locked}
		<Button
			onclick={() => selected !== null && onconfirm(selected)}
			disabled={selected === null || busy}
			class="w-full"
		>
			Подтвердить
		</Button>
	{/if}
</div>
