<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		options: string[];
		/** Подтверждённые на сервере варианты; null — ещё не отвечал */
		answers: number[] | null;
		/** Верные варианты и счётчики выборов — только после закрытия вопроса */
		correctOptions: number[] | null;
		counts: number[] | null;
		revealed: boolean;
		busy: boolean;
		onconfirm: (options: number[]) => void;
		/** Что-то отмечено, но не подтверждено — родителю нужно для подписи итога */
		onselect?: (hasSelection: boolean) => void;
	};

	let { options, answers, correctOptions, counts, revealed, busy, onconfirm, onselect }: Props =
		$props();

	// Отметки живут только на экране и уходят на сервер по кнопке «Подтвердить»
	let selected = $state<number[]>([]);

	const locked = $derived(revealed || answers !== null);
	const marked = $derived(answers ?? selected);

	function toggle(i: number) {
		if (locked) return;
		selected = selected.includes(i) ? selected.filter((o) => o !== i) : [...selected, i];
		onselect?.(selected.length > 0);
	}

	function optionClass(i: number): string {
		if (revealed) {
			const isRight = correctOptions?.includes(i) ?? false;
			const isMine = answers?.includes(i) ?? false;
			if (isRight)
				return isMine ? 'border-green-600 bg-green-50' : 'border-green-600 border-dashed';
			if (isMine) return 'border-destructive bg-destructive/10';
			return 'opacity-60';
		}
		return marked.includes(i) ? 'border-primary bg-primary/10' : 'hover:border-primary';
	}
</script>

<div class="space-y-3">
	{#if !locked}
		<p class="text-sm text-muted-foreground">
			Выберите все верные варианты. За неверные баллы снимаются
		</p>
	{/if}

	<div class="grid gap-3" role="group" aria-label="Варианты ответа, можно несколько">
		{#each options as option, i (i)}
			<button
				type="button"
				aria-pressed={marked.includes(i)}
				disabled={locked}
				onclick={() => toggle(i)}
				class={cn(
					'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left transition-colors duration-150 disabled:cursor-default',
					optionClass(i)
				)}
			>
				<span>{option}</span>
				{#if revealed}
					<span class="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
						{#if correctOptions?.includes(i)}
							<span aria-label="верный вариант">✓</span>
						{:else if answers?.includes(i)}
							<span aria-label="лишний вариант">✗</span>
						{/if}
						{#if counts}{counts[i]}{/if}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if !locked}
		<Button
			onclick={() => onconfirm([...selected].sort((a, b) => a - b))}
			disabled={selected.length === 0 || busy}
			class="w-full"
		>
			Подтвердить
		</Button>
	{/if}
</div>
