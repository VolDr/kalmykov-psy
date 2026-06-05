<!--
  Заменяет: src/lib/components/survey/ScoreDisplay.svelte
  Дизайн: тёплая карточка результата со шкалой-индикатором, navy-заголовки,
  цветовая палитра в тон сайта. Логика/пропсы (subscales, averageScore, color) не изменены.
-->
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

	// Тёплая палитра в тон сайта
	const meterColors = {
		green: '#7FB069',
		yellow: '#E9B84E',
		orange: '#E0945C',
		red: '#D86A55',
		darkred: '#B23B3B'
	} as const;

	const textColorClasses = {
		green: 'text-[#5E9248]',
		yellow: 'text-[#C28A12]',
		orange: 'text-[#C26A38]',
		red: 'text-[#C24B3A]',
		darkred: 'text-[#9E2F2F]'
	} as const;

	type ResultColor = keyof typeof textColorClasses;

	const getText = (c: string) => textColorClasses[c as ResultColor] ?? textColorClasses.green;
	const getMeter = (c: string) => meterColors[c as ResultColor] ?? meterColors.green;

	const mainTextClass = $derived(getText(interpretation.color));

	const mainPercent = $derived(
		averageScore !== undefined
			? Math.min(100, Math.round((averageScore / maxAverageScore) * 100))
			: Math.min(100, Math.round((score / maxScore) * 100))
	);
</script>

<div class="space-y-8 md:space-y-10">
	<!-- Общий показатель -->
	<section class="rounded-3xl bg-card p-6 md:p-8">
		<div class="mb-4 text-[14px] font-semibold tracking-wide text-muted-foreground uppercase">
			Общий показатель
		</div>

		<div class="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-[#e4dccb]">
			<div
				class="h-full rounded-full transition-[width] duration-500"
				style="width: {mainPercent}%; background: {getMeter(interpretation.color)};"
			></div>
		</div>

		<div class="flex flex-wrap items-end justify-between gap-2">
			<div class={cn('text-[34px] leading-none font-extrabold md:text-[44px]', mainTextClass)}>
				{#if averageScore !== undefined}
					{averageScore.toFixed(2)}
					<span class="text-[20px] font-semibold text-foreground/45 md:text-[24px]">
						/ {maxAverageScore.toFixed(2)}
					</span>
				{:else}
					{score}
					<span class="text-[20px] font-semibold text-foreground/45 md:text-[24px]"> / {maxScore} </span>
				{/if}
			</div>
			<div class={cn('text-[18px] font-extrabold md:text-[20px]', mainTextClass)}>
				{interpretation.severity}
			</div>
		</div>
	</section>

	<!-- Субшкалы -->
	{#if subscales && subscales.length > 0}
		<section>
			<h3 class="mb-5 text-[20px] font-extrabold tracking-[-0.3px] text-navy md:text-[24px]">
				Что значат эти цифры?
			</h3>

			<div class="space-y-4 md:space-y-5">
				{#each subscales as subscale}
					{@const subText = getText(subscale.interpretation.color)}
					{@const subPercent =
						subscale.displayMethod === 'sum'
							? Math.min(100, Math.round((subscale.score / subscale.maxScore) * 100))
							: Math.min(100, Math.round((subscale.averageScore / maxAverageScore) * 100))}

					<article class="rounded-2xl bg-card p-5 md:p-6">
						<div class="mb-3 flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
							<h4 class="text-[17px] font-bold text-navy md:text-[19px]">
								{subscale.name}
							</h4>

							<div class="md:pl-4 md:text-right">
								<div class={cn('text-[15px] font-bold md:whitespace-nowrap', subText)}>
									Балл:
									{#if subscale.displayMethod === 'sum'}
										{subscale.score}
										<span class="font-semibold text-foreground/45"> / {subscale.maxScore}</span>
									{:else}
										{subscale.averageScore.toFixed(2)}
										<span class="font-semibold text-foreground/45"> / {maxAverageScore.toFixed(2)}</span>
									{/if}
								</div>
								<div class={cn('mt-0.5 text-[13px] font-semibold', subText)}>
									{subscale.interpretation.severity}
								</div>
							</div>
						</div>

						<div class="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#e4dccb]">
							<div
								class="h-full rounded-full"
								style="width: {subPercent}%; background: {getMeter(subscale.interpretation.color)};"
							></div>
						</div>

						{#if subscale.description}
							<div class="text-[15px] leading-[1.6] whitespace-pre-line text-foreground/75">
								<MarkdownLink text={subscale.description} />
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Рекомендации -->
	<section>
		<h3 class="mb-4 text-[20px] font-extrabold tracking-[-0.3px] text-navy md:text-[24px]">
			Рекомендации
		</h3>
		<div class="text-[16px] leading-[1.7] whitespace-pre-line text-foreground/80">
			<MarkdownLink text={interpretation.recommendation} />
		</div>
	</section>
</div>
