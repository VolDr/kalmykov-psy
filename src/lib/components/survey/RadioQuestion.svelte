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
		if (points === 1) return 'балл';
		if (points > 1 && points < 5) return 'балла';
		return 'баллов';
	}
</script>

<div class="space-y-4">
	<div>
		<label class="text-base md:text-lg font-semibold text-[#191919] leading-relaxed">
			{question.text}
			{#if question.required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
			{#if question.optional}
				<span class="text-sm md:text-base font-normal text-[#191919] opacity-60 ml-2">
					(Опционально)
				</span>
			{/if}
		</label>
		{#if question.tipText}
			<div
				class="mt-2 flex items-start gap-3 text-sm md:text-base text-gray-700 bg-[#F2F0EF]/60 p-4 rounded-lg"
			>
				<span class="icon-[lucide--info] w-5 h-5 mt-0.5 flex-shrink-0 text-[#B8A98A]"></span>
				<span>{question.tipText}</span>
			</div>
		{/if}
	</div>

	<div class="space-y-3" role="radiogroup">
		{#each question.options ?? [] as option, index}
			{@const itemId = `${question.id}-${index}`}
			{@const isSelected = value === option.value}
			{@const anotherSelected = value && value!== option.value }
			<label
				for={itemId}
				class={cn(
					'flex items-center space-x-4 p-4 bg-white rounded-lg  outline-0  transition-all duration-200',
					isSelected
						? 'outline-black outline-1'
						: '',
					!disabled && ' hover:text-white hover:outline-black hover:outline-1 cursor-pointer hover: brightness-100',
					anotherSelected? 'brightness-96 border-hone hover:brightness-100' : ''
				)}
			>
				<input
					type="radio"
					id={itemId}
					name={question.id}
					{disabled}
					checked={isSelected}
					onchange={() => !disabled && onChange(option.value)}
					class="hidden"
				/>
				<span
					class={cn(
						'flex-1 text-sm md:text-base font-normal text-[#191919] select-none pl-5',
						disabled ? 'cursor-default' : 'cursor-pointer'
					)}
				>
					{option.label}
				</span>
				{#if question.showPoints && option.points !== undefined}
					<span
						class="text-xs md:text-sm font-medium text-black opacity-70 bg-[#F2F0EF] px-2 md:px-3 py-1 pointer-events-none"
					>
						{option.points}
						{option.points === 1 ? 'балл' : 'балла'}
					</span>
				{/if}
			</label>
		{/each}
	</div>
</div>
