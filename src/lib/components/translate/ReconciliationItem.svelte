<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';
	import type { TranslationField, TranslationItem } from '#lib/data/translation.js';
	import type { ReconciliationParticipant } from '#lib/data/translation-reconciliation.js';
	import { reviewOptionOrder } from '#lib/data/translation-review-order.js';
	import { withFinalPeriod } from '#lib/data/translation-review-text.js';
	import ReviewerAvatar from './ReviewerAvatar.svelte';
	let {
		item,
		a,
		b,
		choice,
		participants,
		ownSlot,
		roundId,
		position,
		total,
		heading = 'h2',
		discussion,
		onchange
	}: {
		item: TranslationItem;
		a: string;
		b: string;
		choice: string;
		/** h3, когда пункт стоит под заголовком шкалы */
		heading?: 'h2' | 'h3';
		participants: ReconciliationParticipant[];
		ownSlot: number;
		roundId: number;
		position: number;
		total: number;
		/** Комментарии участников к пункту */
		discussion?: Snippet;
		onchange: (field: TranslationField, value: string) => void;
	} = $props();
	const options = $derived(
		reviewOptionOrder(roundId, item.key).map((key) => ({
			key,
			text: key === 'a' ? a : b
		}))
	);
</script>

<article class="space-y-5" aria-labelledby={`review-heading-${position}`}>
	<div>
		<div class="mb-3 flex justify-between gap-4 text-sm text-muted-foreground">
			<svelte:element
				this={heading}
				id={`review-heading-${position}`}
				tabindex="-1"
				class="font-semibold text-foreground">{item.label}</svelte:element
			>
			<span>{position} из {total}</span>
		</div>
		<p
			lang="en"
			class="rounded-xl bg-muted/50 px-5 py-4 leading-relaxed text-foreground select-text"
		>
			{item.source}
		</p>
	</div>
	<fieldset>
		<div class="grid gap-3 md:grid-cols-2">
			{#each options as option, optionIndex (option.key)}
				{@const selected = participants.filter(
					(p) => p.entries[item.key]?.translation === option.key
				)}
				<div
					class={cn(
						'flex flex-col rounded-xl text-foreground transition-colors duration-150',
						choice === option.key
							? 'bg-primary/10 ring-2 ring-primary ring-inset'
							: 'bg-card hover:bg-muted/70'
					)}
				>
					<label
						class="flex flex-1 cursor-pointer flex-col gap-3 rounded-xl p-5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
					>
						<span class="flex items-center gap-2 text-sm font-semibold">
							<input
								type="radio"
								name={`review-choice-${position}`}
								value={option.key}
								checked={choice === option.key}
								onchange={() => onchange('translation', option.key)}
								class="size-4 accent-primary"
							/>
							{#if selected.length}
								<!-- Кто выбрал вариант: аватарки в строке заголовка, без отдельной полосы -->
								<span class="flex -space-x-1.5" role="group" aria-label="Выбрали этот вариант">
									{#each selected as participant (participant.slot)}
										{@const name = `${participant.profile.name}${participant.slot === ownSlot ? ' (вы)' : ''}`}
										<span title={name} class="rounded-full ring-2 ring-card"
											><ReviewerAvatar profile={participant.profile} size="small" /><span
												class="sr-only">{name}</span
											></span
										>
									{/each}
								</span>
							{/if}
							Вариант {optionIndex + 1}
						</span>
						<span class="leading-relaxed whitespace-pre-wrap select-text"
							>{withFinalPeriod(option.text)}</span
						>
					</label>
				</div>
			{/each}
		</div>
		{#if choice}<button
				type="button"
				class="mt-2 min-h-11 text-sm text-muted-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary"
				onclick={() => onchange('translation', '')}>Снять выбор</button
			>{/if}
	</fieldset>
	{#if discussion}
		<div class="pt-1">
			{@render discussion()}
		</div>
	{/if}
</article>
