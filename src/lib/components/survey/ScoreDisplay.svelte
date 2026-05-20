<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import type { ScoringInterpretation } from '$lib/data/surveys/types';
	import type { SubscaleResult } from '$lib/utils/survey/scoringEngine';
	import { cn } from '$lib/utils';

	type Props = {
		score: number;
		maxScore: number;
		interpretation: ScoringInterpretation;
		averageScore?: number;
		maxAverageScore?: number;
		subscales?: SubscaleResult[];
	};

	let {
		score,
		maxScore,
		interpretation,
		maxAverageScore = 5,
		averageScore,
		subscales
	}: Props = $props();

	const textColorClasses = {
		green: 'text-green-600',
		yellow: 'text-yellow-600',
		orange: 'text-orange-500',
		red: 'text-red-500',
		darkred: 'text-red-700'
	} as const;

	const accentCardClasses = {
		green: 'bg-green-50/80 border-green-200',
		yellow: 'bg-yellow-50/80 border-yellow-200',
		orange: 'bg-orange-50/80 border-orange-200',
		red: 'bg-red-50/80 border-red-200',
		darkred: 'bg-red-100/80 border-red-300'
	} as const;

	type ResultColor = keyof typeof textColorClasses;

	const getTextColor = (color: string) =>
		textColorClasses[color as ResultColor] ?? textColorClasses.green;

	const getAccentCard = (color: string) =>
		accentCardClasses[color as ResultColor] ?? accentCardClasses.green;

	const mainTextClass = $derived(getTextColor(interpretation.color));
	const mainAccentClass = $derived(getAccentCard(interpretation.color));
</script>

<div class="space-y-8 font- md:space-y-10">
	<section
		class={cn('rounded-xl border p-4 md:p-5', mainAccentClass)}
	>
		<div class="mb-2 text-sm text-muted-foreground">Общий показатель</div>

		<div class={cn('mb-1 text-[30px] font-bold leading-none md:text-4xl', mainTextClass)}>
			{#if averageScore !== undefined}
				{averageScore.toFixed(2)}
				<span class=" font-semibold text-foreground/50 md:text-xl">
					/ {maxAverageScore.toFixed(2)}
				</span>
			{:else}
				{score}
				<span class=" font-semibold text-foreground/50 md:text-xl"> / {maxScore} </span>
			{/if}
		</div>

		<div class="text-lg font-semibold leading-snug text-foreground">
			{interpretation.severity}
		</div>
	</section>

	{#if subscales && subscales.length > 0}
		<section>
			<h3 class="mb-4 text-xl font-semibold leading-tight text-foreground">Что значат эти цифры?</h3>

			<div class="space-y-5 md:space-y-[30px]">
				{#each subscales as subscale}
					{@const subscaleTextClass = getTextColor(subscale.interpretation.color)}
					{@const subscaleAccentClass = getAccentCard(subscale.interpretation.color)}

					<article
						class={cn('rounded-xl border p-4 md:p-5', subscaleAccentClass)}
					>
						<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
							<h4 class="text-lg font-semibold leading-snug text-foreground">
								{subscale.name}
							</h4>

							<div class="md:whitespace-nowrap md:pl-4 md:text-right">
								<div class={cn(' font-bold leading-tight', subscaleTextClass)}>
									Балл:
									{#if subscale.displayMethod === 'sum'}
										{subscale.score}
										<span class="font-semibold text-foreground/45"> / {subscale.maxScore}</span>
									{:else}
										{subscale.averageScore.toFixed(2)}
										<span class="font-semibold text-foreground/45">
											/ {maxAverageScore.toFixed(2)}
										</span>
									{/if}
								</div>

								<div class={cn('mt-0.5 text-[13px] font-semibold leading-snug', subscaleTextClass)}>
									{subscale.interpretation.severity}
								</div>
							</div>
						</div>

						{#if subscale.description}
							<div class="whitespace-pre-line text-sm leading-[1.6] text-muted-foreground">
								<MarkdownLink text={subscale.description} />
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h3 class="mb-4 text-xl font-semibold leading-tight text-foreground">Рекомендации</h3>
		<div class="whitespace-pre-line  leading-[1.7] text-muted-foreground">
			<MarkdownLink text={interpretation.recommendation} />
		</div>
	</section>
</div>
