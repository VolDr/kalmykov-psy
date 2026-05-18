<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';
	import { cn } from '$lib/utils';

	type Props = {
		question: SurveyQuestion;
		value: number | undefined;
		onChange: (value: number) => void;
		disabled?: boolean;
	};

	let { question, value, onChange, disabled = false }: Props = $props();

	function getPointsLabel(points: number) {
		const lastDigit = points % 10;
		const lastTwoDigits = points % 100;
		if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'баллов';
		if (lastDigit === 1) return 'балл';
		if (lastDigit >= 2 && lastDigit <= 4) return 'балла';
		return 'баллов';
	}
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-sm  font-medium leading-relaxed text-[#191919] md:text-base">
			{question.text}
			{#if question.optional}
				<span class="ml-1 text-xs font-normal opacity-50">
					(опционально)
				</span>
			{/if}
		</h3>
		
		{#if question.tipText}
			<div class="mt-2 flex items-start gap-2 rounded-lg bg-[#f7f5f0]/50 p-3 text-xs text-gray-600 md:text-sm">
				<span class="mt-0.5 icon-[lucide--info] h-4 w-4 flex-shrink-0 text-[#B8A98A]"></span>
				<span>{question.tipText}</span>
			</div>
		{/if}
	</div>

	<div class="space-y-2" role="radiogroup">
		{#each question.options ?? [] as option, index}
			{@const itemId = `${question.id}-${index}`}
			{@const isSelected = value === option.value}
			
			<label
				for={itemId}
				class={cn(
					'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 md:px-4',
					isSelected 
						? 'border-[#B8A98A] bg-[#f7f5f0] shadow-sm' 
						: 'border-gray-100 bg-white hover:border-gray-200',
					disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'
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
				
				<div class={cn(
					'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
					isSelected ? 'border-[#B8A98A] bg-white' : 'border-gray-300'
				)}>
					{#if isSelected}
						<div class="h-2.5 w-2.5 rounded-full bg-[#B8A98A]"></div>
					{/if}
				</div>

				<span class="flex-1 text-sm text-[#191919] select-none md:text-base">
					{option.label}
				</span>

				{#if question.showPoints && option.points !== undefined}
					<span class="text-[10px] font-medium uppercase tracking-wider text-[#B8A98A] md:text-xs">
						{option.points} {getPointsLabel(option.points)}
					</span>
				{/if}
			</label>
		{/each}
	</div>
</div>