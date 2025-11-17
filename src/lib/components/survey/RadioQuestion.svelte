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
		<label class="text-base leading-relaxed font-semibold text-[#191919] md:text-lg">
			{question.text}
			{#if question.required}
				<span class="ml-1 text-red-500">*</span>
			{/if}
			{#if question.optional}
				<span class="ml-2 text-sm font-normal text-[#191919] opacity-60 md:text-base">
					(Опционально)
				</span>
			{/if}
		</label>
		{#if question.tipText}
			<div
				class="mt-2 flex items-start gap-3 rounded-lg bg-[#F2F0EF]/60 p-4 text-sm text-gray-700 md:text-base"
			>
				<span class="mt-0.5 icon-[lucide--info] h-5 w-5 flex-shrink-0 text-[#B8A98A]"></span>
				<span>{question.tipText}</span>
			</div>
		{/if}
	</div>

	<div class="space-y-3" role="radiogroup">
		{#each question.options ?? [] as option, index}
			{@const itemId = `${question.id}-${index}`}
			{@const isSelected = value === option.value}
			{@const anotherSelected = value && value !== option.value}
			<label
				for={itemId}
				class={cn(
					'flex items-center space-x-4 rounded-lg bg-white p-4  outline-0  transition-all duration-200',
					isSelected ? 'outline-1 outline-black' : '',
					!disabled &&
						' hover: cursor-pointer brightness-100 hover:text-white hover:outline-1 hover:outline-black',
					anotherSelected ? 'border-hone brightness-96 hover:brightness-100' : ''
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
						'flex-1 pl-5 text-sm font-normal text-[#191919] select-none md:text-base',
						disabled ? 'cursor-default' : 'cursor-pointer'
					)}
				>
					{option.label}
				</span>
				{#if question.showPoints && option.points !== undefined}
					<span
						class="pointer-events-none bg-[#F2F0EF] px-2 py-1 text-xs font-medium text-black opacity-70 md:px-3 md:text-sm"
					>
						{option.points}
						{option.points === 1 ? 'балл' : 'балла'}
					</span>
				{/if}
			</label>
		{/each}
	</div>
</div>
