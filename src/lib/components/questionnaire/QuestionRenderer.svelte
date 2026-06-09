<!--
  Заменяет: src/lib/components/questionnaire/QuestionRenderer.svelte
  Изменение: прокидывает `number` в RadioQuestion (для рукописной нумерации вопросов).
-->
<script lang="ts">
	import type { QuestionnaireQuestion } from '$lib/data/questionnaires/types';
	import RadioQuestion from './RadioQuestion.svelte';
	import SubheadingQuestion from './SubheadingQuestion.svelte';

	type Props = {
		question: QuestionnaireQuestion;
		value: number | undefined;
		onChange: (value: number) => void;
		shouldDisplay?: boolean;
		disabled?: boolean;
		answers?: Record<string, number>;
		number?: number;
	};

	let {
		question,
		value,
		onChange,
		shouldDisplay = true,
		disabled = false,
		answers = {},
		number
	}: Props = $props();

	// Determine which text to use based on condition
	let questionText = $derived(
		question.alternativeText && question.textCondition?.(answers)
			? question.alternativeText
			: question.text
	);

	let adaptedQuestion = $derived({
		...question,
		text: questionText
	});
</script>

{#if shouldDisplay}
	{#if question.type === 'subheading'}
		<SubheadingQuestion question={adaptedQuestion} />
	{:else if question.type === 'radio'}
		<RadioQuestion question={adaptedQuestion} {value} {onChange} {disabled} {number} />
	{:else if question.type === 'checkbox'}
		<div>Checkbox questions not implemented yet</div>
	{:else if question.type === 'textarea'}
		<div>Textarea questions not implemented yet</div>
	{/if}
{/if}
