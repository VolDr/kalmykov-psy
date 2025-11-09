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
	<div
		class={cn('border-0 bg-[#F2F0EF]/40 rounded-lg border-t-4 overflow-hidden', borderClass)}
	>
		<div class="p-6 md:p-8 space-y-4">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
				<h3 class="text-base md:text-lg text-[#191919] font-semibold">
					Общий результат
				</h3>
				<div class="text-left md:text-right">
					<div class="text-2xl md:text-3xl font-bold text-[#191919]">
						{#if averageScore !== undefined}
							{averageScore.toFixed(2)}
							<span class="text-base md:text-xl text-[#191919] opacity-60">
								/ {maxAverageScore.toFixed(2)}
							</span>
						{:else}
							{score}
							<span class="text-base md:text-xl text-[#191919] opacity-60">
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
				<h4 class="font-semibold text-black text-base md:text-lg">Рекомендации:</h4>
				<div
					class="text-base md:text-lg text-black opacity-80 leading-relaxed whitespace-pre-line"
				>
					<MarkdownLink text={interpretation.recommendation} />
				</div>
			</div>
		</div>
	</div>

	{#if subscales && subscales.length > 0}
		<div class="shadow-md border-0 bg-[#F2F0EF]">
			<div class="p-6 md:p-8 space-y-4">
				<div class="pb-4">
					<h3 class="text-base md:text-lg text-black font-semibold">
						Результаты по шкалам
					</h3>
					{#if subscales.length > 0 && subscales[0].description}
						<p class="text-sm text-black opacity-70 mt-2">
							Средний балл по каждой из шкал
						</p>
					{/if}
				</div>

				{#each subscales as subscale}
					{@const subscaleBorderClass = borderColorClasses[subscale.interpretation.color]}
					<div
						class={cn(
							'flex flex-col gap-3 p-4 bg-white rounded-lg border-t-4 overflow-hidden',
							subscaleBorderClass
						)}
					>
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div class="flex-1">
								<h5 class="font-semibold text-[#191919] text-base">
									{subscale.name}
								</h5>
								<span
									class={cn(
										'inline-block text-sm mt-2 px-2 py-1 bg-[#F2F0EF] rounded',
										colorClasses[subscale.interpretation.color]
									)}
								>
									{subscale.interpretation.severity}
								</span>
							</div>
							<div class="text-right">
								<div class="text-xl md:text-2xl font-bold text-[#191919]">
									{subscale.averageScore.toFixed(2)}
									<span class="text-sm md:text-base text-[#191919] opacity-60">
										/ {maxAverageScore.toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						{#if subscale.description}
							<p class="text-sm text-[#191919] opacity-70 leading-relaxed">
								{subscale.description}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
