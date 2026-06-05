<!--
  Заменяет: src/lib/components/survey/RadioQuestion.svelte
  Дизайн перенесён из макета BAT-4: крупный вопрос, рукописный номер (Caveat),
  варианты-карточки с золотым акцентом при выборе.
  Логика/пропсы не изменены, добавлен опциональный `number` (порядковый номер вопроса).
-->
<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';
	import { cn } from '$lib/utils';

	type Props = {
		question: SurveyQuestion;
		value: number | undefined;
		onChange: (value: number) => void;
		disabled?: boolean;
		number?: number;
	};

	let { question, value, onChange, disabled = false, number }: Props = $props();

	const pad = (n: number) => String(n).padStart(2, '0');

	function getPointsLabel(points: number) {
		const lastDigit = points % 10;
		const lastTwoDigits = points % 100;
		if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'баллов';
		if (lastDigit === 1) return 'балл';
		if (lastDigit >= 2 && lastDigit <= 4) return 'балла';
		return 'баллов';
	}
</script>

<div class="space-y-5">
	<div class="flex items-baseline gap-4 md:gap-5">
		{#if number}
			<span class="font-caveat shrink-0 text-[34px] leading-none font-bold text-primary md:text-[40px]">
				{pad(number)}
			</span>
		{/if}
		<div class="flex-1">
			<h3 class="text-[18px] leading-snug font-medium text-foreground md:text-[22px]">
				{question.text}
				{#if question.optional}
					<span class="ml-1 text-xs font-normal opacity-50">(опционально)</span>
				{/if}
			</h3>

			{#if question.tipText}
				<div
					class="mt-3 flex items-start gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground md:text-sm"
				>
					<span class="icon-[lucide--info] mt-0.5 h-4 w-4 flex-shrink-0 text-primary"></span>
					<span>{question.tipText}</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex flex-col gap-3 md:ml-[58px]" role="radiogroup">
		{#each question.options ?? [] as option, index}
			{@const itemId = `${question.id}-${index}`}
			{@const isSelected = value === option.value}

			<label
				for={itemId}
				class={cn(
					'flex items-center gap-4 rounded-2xl border-[1.5px] px-5 py-4 transition-all duration-200 md:px-6 md:py-[18px]',
					isSelected
						? 'border-primary bg-primary/10'
						: 'border-[#d8cfbc] bg-background hover:border-primary',
					disabled ? 'cursor-default opacity-60' : 'cursor-pointer'
				)}
			>
				<input
					type="radio"
					id={itemId}
					name={question.id}
					{disabled}
					checked={isSelected}
					onchange={() => !disabled && onChange(option.value)}
					class="sr-only"
				/>

				<span
					class={cn(
						'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
						isSelected ? 'border-primary' : 'border-foreground/25'
					)}
				>
					{#if isSelected}
						<span class="h-3 w-3 rounded-full bg-primary"></span>
					{/if}
				</span>

				<span
					class={cn(
						'flex-1 text-[16px] font-semibold select-none md:text-[18px]',
						isSelected ? 'text-navy' : 'text-foreground'
					)}
				>
					{option.label}
				</span>

				{#if question.showPoints && option.points !== undefined}
					<span class="text-[10px] font-medium tracking-wider text-primary uppercase md:text-xs">
						{option.points} {getPointsLabel(option.points)}
					</span>
				{/if}
			</label>
		{/each}
	</div>
</div>
