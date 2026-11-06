<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TranslationItem } from '#lib/data/translation.js';
	import {
		isRatedItem,
		relevanceOptions,
		type ExpertAnswer,
		type ExpertField
	} from '#lib/data/translation-expert.js';

	let {
		item,
		scaleTitle,
		position,
		total,
		answer,
		heading = 'h2',
		discussion,
		readOnly = false,
		onchange
	}: {
		item: TranslationItem;
		/** Компонент, к которому относится пункт; null у инструкции и формата ответов */
		scaleTitle: string | null;
		position: number;
		total: number;
		answer: ExpertAnswer;
		heading?: 'h2' | 'h3';
		discussion?: Snippet;
		readOnly?: boolean;
		onchange: (field: ExpertField, value: string) => void;
	} = $props();

	const id = $derived(`expert-${item.key}`);
	const rated = $derived(isRatedItem(item));
	const choiceClass =
		'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-navy transition-colors duration-150 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary border-navy/15 bg-white hover:border-navy/40';
	const clarityOptions = [
		{ value: 'clear', label: 'Понятна' },
		{ value: 'unclear', label: 'Неясна' }
	] as const;
</script>

<article aria-labelledby={`${id}-heading`} class="space-y-6">
	<div>
		<div class="mb-3 flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
			<svelte:element
				this={heading}
				id={`${id}-heading`}
				tabindex="-1"
				class="text-base font-semibold text-navy focus:outline-none"
			>
				{item.label}
			</svelte:element>
			<span class="tabular-nums">{position} из {total}</span>
		</div>
		{#if scaleTitle}
			<p class="mb-2 text-sm text-muted-foreground">Компонент: {scaleTitle}</p>
		{/if}
		<p
			lang="ru"
			class="text-md rounded-2xl bg-[#f6f4ef] px-5 py-5 leading-relaxed whitespace-pre-line text-navy sm:px-6 sm:text-lg"
		>
			{item.source}
		</p>
	</div>

	<fieldset class="space-y-3">
		<legend class="mb-2 text-sm font-medium text-navy">Ясность формулировки</legend>
		<div class="grid gap-2 sm:grid-cols-2">
			{#each clarityOptions as option (option.value)}
				<label class={choiceClass}>
					<input
						type="radio"
						name={`${id}-clarity`}
						value={option.value}
						checked={answer.clarity === option.value}
						disabled={readOnly}
						onchange={() => onchange('clarity', option.value)}
						class="size-4 text-primary focus:ring-0 focus:ring-offset-0"
					/>
					{option.label}
				</label>
			{/each}
		</div>
	</fieldset>

	{#if rated}
		<fieldset class="space-y-3">
			<legend class="mb-2 text-sm font-medium text-navy">
				Релевантность{scaleTitle ? ` компоненту «${scaleTitle}»` : ''}
			</legend>
			<div class="grid gap-2">
				{#each relevanceOptions as option (option.value)}
					<label class={choiceClass}>
						<input
							type="radio"
							name={`${id}-relevance`}
							value={option.value}
							checked={answer.relevance === option.value}
							disabled={readOnly}
							onchange={() => onchange('relevance', option.value)}
							class="size-4 text-primary focus:ring-0 focus:ring-offset-0"
						/>
						<span class="w-4 font-semibold tabular-nums">{option.value}</span>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}

	{#if discussion}<div><p class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Обсуждение</p>{@render discussion()}</div>{/if}
</article>
