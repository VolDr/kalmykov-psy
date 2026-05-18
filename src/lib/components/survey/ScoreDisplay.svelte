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

	const accentBgClasses = {
		green: 'before:bg-green-500',
		yellow: 'before:bg-yellow-500',
		orange: 'before:bg-orange-500',
		red: 'before:bg-red-500',
		darkred: 'before:bg-red-700'
	} as const;

	type ResultColor = keyof typeof textColorClasses;

	const getTextColor = (color: string) =>
		textColorClasses[color as ResultColor] ?? textColorClasses.green;

	const getAccentBg = (color: string) =>
		accentBgClasses[color as ResultColor] ?? accentBgClasses.green;

	const mainTextClass = $derived(getTextColor(interpretation.color));
	const mainAccentClass = $derived(getAccentBg(interpretation.color));
</script>

<div class="space-y-8 font- md:space-y-10">
	<section
		class={cn(
			"relative overflow-hidden rounded-xl border border-[#f0f0f0] bg-[#fcfcfc] p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] md:p-5 md:pl-6",
			mainAccentClass
		)}
	>
		<div class="mb-2 text-sm text-[#666666]">Общий показатель</div>

		<div class={cn('mb-1 text-[30px] font-bold leading-none md:text-4xl', mainTextClass)}>
			{#if averageScore !== undefined}
				{averageScore.toFixed(2)}
				<span class=" font-semibold text-[#191919]/50 md:text-xl">
					/ {maxAverageScore.toFixed(2)}
				</span>
			{:else}
				{score}
				<span class=" font-semibold text-[#191919]/50 md:text-xl"> / {maxScore} </span>
			{/if}
		</div>

		<div class="text-lg font-semibold leading-snug text-[#191919]">
			{interpretation.severity}
		</div>
	</section>

	{#if subscales && subscales.length > 0}
		<section>
			<h3 class="mb-4 text-xl font-semibold leading-tight text-[#191919]">Что значат эти цифры?</h3>

			<div class="space-y-5 md:space-y-[30px]">
				{#each subscales as subscale}
					{@const subscaleTextClass = getTextColor(subscale.interpretation.color)}
					{@const subscaleAccentClass = getAccentBg(subscale.interpretation.color)}

					<article
						class={cn(
							"relative overflow-hidden rounded-xl border border-[#f0f0f0] bg-[#fcfcfc] p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] md:p-5 md:pl-6",
							subscaleAccentClass
						)}
					>
						<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
							<h4 class="text-lg font-semibold leading-snug text-[#191919]">
								{subscale.name}
							</h4>

							<div class="md:whitespace-nowrap md:pl-4 md:text-right">
								<div class={cn(' font-bold leading-tight', subscaleTextClass)}>
									Балл:
									{#if subscale.displayMethod === 'sum'}
										{subscale.score}
										<span class="font-semibold text-[#191919]/45"> / {subscale.maxScore}</span>
									{:else}
										{subscale.averageScore.toFixed(2)}
										<span class="font-semibold text-[#191919]/45">
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
							<div class="whitespace-pre-line text-sm leading-[1.6] text-[#4a4a4a]">
								<MarkdownLink text={subscale.description} />
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h3 class="mb-4 text-xl font-semibold leading-tight text-[#191919]">Рекомендации</h3>
		<div class="whitespace-pre-line  leading-[1.7] text-[#4a4a4a]">
			<MarkdownLink text={interpretation.recommendation} />
		</div>
	</section>
</div>
