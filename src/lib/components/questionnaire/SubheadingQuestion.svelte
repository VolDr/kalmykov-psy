<!--
  Заменяет: src/lib/components/questionnaire/SubheadingQuestion.svelte
  Дизайн: заголовок группы вопросов — крупный, насыщенный, navy (как в макете).
-->
<script lang="ts">
	import type { QuestionnaireQuestion } from '$lib/data/questionnaires/types';

	type Props = {
		question: QuestionnaireQuestion;
	};

	let { question }: Props = $props();
</script>

{#if question.text}
	<div class="pt-4 pb-1">
		<h3
			class="max-w-[720px] text-[24px] leading-[1.25] font-extrabold tracking-[-0.4px] text-navy md:text-[31px]"
		>
			{question.text}
		</h3>
	</div>
{/if}
