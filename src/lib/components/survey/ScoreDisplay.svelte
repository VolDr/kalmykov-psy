<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import Card from '$lib/components/ui/Card.svelte';
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

	const colorClasses = {
		green: 'text-green-600',
		yellow: 'text-yellow-600',
		orange: 'text-orange-500',
		red: 'text-red-500',
		darkred: 'text-red-700'
	};

	const borderColorClasses = {
		green: 'border-t-green-500',
		yellow: 'border-t-yellow-500',
		orange: 'border-t-orange-500',
		red: 'border-t-red-500',
		darkred: 'border-t-red-700'
	};

	const badgeClass = colorClasses[interpretation.color];
	const borderClass = borderColorClasses[interpretation.color];
</script>

<div class="space-y-6">
	<div class={cn('overflow-hidden rounded-lg border-0 border-t-4 bg-[#f7f5f0]/40', borderClass)}>
		<div class="space-y-4 p-6 md:p-8">
			<div class="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
				<h3 class="text-base font-semibold text-[#191919] md:text-lg">Общий результат</h3>
				<div class="text-left md:text-right">
					<div class="text-2xl font-bold text-[#191919] md:text-3xl">
						{#if averageScore !== undefined}
							{averageScore.toFixed(2)}
							<span class="text-base text-[#191919] opacity-60 md:text-xl">
								/ {maxAverageScore.toFixed(2)}
							</span>
						{:else}
							{score}
							<span class="text-base text-[#191919] opacity-60 md:text-xl">
								/ {maxScore}
							</span>
						{/if}
					</div>
				</div>
			</div>

			<div>
				<span class={cn('inline-block text-xl font-semibold', badgeClass)}>
					{interpretation.severity}
				</span>
			</div>

			<div class="space-y-2">
				<h4 class="text-base font-semibold text-black md:text-lg">Рекомендации:</h4>
				<div class="text-base leading-relaxed whitespace-pre-line text-black opacity-80 md:text-lg">
					<MarkdownLink text={interpretation.recommendation} />
				</div>
			</div>
		</div>
	</div>

	{#if subscales && subscales.length > 0}
		<div class="border-0 bg-[#f7f5f0] shadow-md">
			<div class="space-y-4 p-6 md:p-8">
				<div class="pb-4">
					<h3 class="text-base font-semibold text-black md:text-lg">Результаты по шкалам</h3>
					{#if subscales.length > 0 && subscales[0].description}
						<p class="mt-2 text-sm text-black opacity-70">
							{subscales[0].displayMethod === 'sum'
								? 'Сумма баллов по каждой из шкал'
								: 'Средний балл по каждой из шкал'}
						</p>
					{/if}
				</div>

				{#each subscales as subscale}
					{@const subscaleBorderClass = borderColorClasses[subscale.interpretation.color]}
					<div
						class={cn(
							'flex flex-col gap-3 overflow-hidden rounded-lg border-t-4 bg-white p-4',
							subscaleBorderClass
						)}
					>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex-1">
								<h5 class="text-base font-semibold text-[#191919]">
									{subscale.name}
								</h5>
								<span
									class={cn(
										'mt-2 inline-block rounded bg-[#f7f5f0] px-2 py-1 text-sm',
										colorClasses[subscale.interpretation.color]
									)}
								>
									{subscale.interpretation.severity}
								</span>
							</div>
							<div class="text-right">
								<div class="text-xl font-bold text-[#191919] md:text-2xl">
									{#if subscale.displayMethod === 'sum'}
										{subscale.score}
										<span class="text-sm text-[#191919] opacity-60 md:text-base">
											/ {subscale.maxScore}
										</span>
									{:else}
										{subscale.averageScore.toFixed(2)}
										<span class="text-sm text-[#191919] opacity-60 md:text-base">
											/ {maxAverageScore.toFixed(2)}
										</span>
									{/if}
								</div>
							</div>
						</div>
						{#if subscale.description}
							<div class="space-y-1 text-sm leading-relaxed text-[#191919] opacity-70">
								{#each subscale.description.split('\n') as line}
									{#if line.trim().match(/^\d+\./)}
										<div class="pl-4">{line.trim()}</div>
									{:else if line.trim()}
										<div>{line}</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
