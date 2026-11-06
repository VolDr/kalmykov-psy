<script lang="ts">
	import { TRANSLATION_MAX_LENGTH, type TranslationItem } from '#lib/data/translation.js';
	import { cn } from '#lib/utils.js';
	let {
		item,
		a,
		b,
		choice,
		comment,
		onchange,
		hasPrev,
		hasNext,
		onprev,
		onnext,
		position,
		total
	}: {
		item: TranslationItem;
		a: string;
		b: string;
		choice: string;
		comment: string;
		onchange: (field: 'translation' | 'comment', value: string) => void;
		hasPrev: boolean;
		hasNext: boolean;
		onprev: () => void;
		onnext: () => void;
		position: number;
		total: number;
	} = $props();
	const options = $derived([
		{ key: 'a', label: 'Вариант 1', text: a },
		{ key: 'b', label: 'Вариант 2', text: b }
	]);
	const buttonClass =
		'min-h-11 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40';
</script>

<article class="space-y-6" aria-labelledby="review-item-label">
	<div>
		<div class="mb-3 flex justify-between gap-4 text-sm text-muted-foreground">
			<h2 id="review-item-label" class="font-medium text-foreground">{item.label}</h2>
			<span>{position} из {total}</span>
		</div>
		<p lang="en" class="rounded-xl bg-muted/50 px-5 py-4 leading-relaxed text-foreground">
			{item.source}
		</p>
	</div>
	<fieldset>
		<legend id="review-choice-legend" tabindex="-1" class="mb-3 text-sm font-medium text-foreground">Какой перевод вы выбираете?</legend>
		<div class="grid gap-3 md:grid-cols-2" data-translation-copy>
			{#each options as option (option.key)}
				<label
					class={cn(
						'relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-5 text-foreground focus-within:ring-2 focus-within:ring-primary',
						choice === option.key
							? 'border-primary bg-primary/10'
							: 'border-border hover:border-foreground/40'
					)}
				>
					<span class="flex items-center gap-2 text-sm font-semibold">
						<input
							id={option.key === 'a' ? 'tr-translation' : 'review-choice-b'}
							type="radio"
							name="review-choice"
							value={option.key}
							checked={choice === option.key}
							onchange={() => onchange('translation', option.key)}
							class="size-4 accent-primary"
						/>
						{option.label}
					</span>
					<span class="leading-relaxed whitespace-pre-wrap select-text">{option.text}</span>
				</label>
			{/each}
		</div>
		{#if choice}<button
				type="button"
				class="mt-3 min-h-11 text-sm text-muted-foreground underline underline-offset-4"
				onclick={() => onchange('translation', '')}>Снять выбор</button
			>{/if}
	</fieldset>
	<label class="block space-y-2 text-sm font-medium text-foreground">
		<span>Комментарий <span class="font-normal text-muted-foreground">(необязательно)</span></span>
		<textarea
			id="tr-comment"
			value={comment}
			maxlength={TRANSLATION_MAX_LENGTH}
			oninput={(event) => onchange('comment', event.currentTarget.value)}
			rows="3"
			class="block min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 text-base leading-relaxed font-normal select-text focus:ring-2 focus:ring-primary focus:outline-none"
			placeholder="Почему этот вариант лучше? Что стоит уточнить?"
		></textarea>
	</label>
	<div class="flex items-center justify-between gap-3">
		<button type="button" class={buttonClass} onclick={onprev} disabled={!hasPrev}>← Назад</button>
		<span class="hidden text-xs text-muted-foreground sm:inline">Ctrl + Enter: следующий пункт</span
		>
		<button type="button" class={buttonClass} onclick={onnext} disabled={!hasNext}>Дальше →</button>
	</div>
</article>
