<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';

	type Props = {
		question: SurveyQuestion;
	};

	let { question }: Props = $props();
</script>

{#if question.text}
	<div class="pt-6 pb-2">
		<h3 class="text-md font-semibold text-foreground md:text-xl">
			{question.text}
		</h3>
	</div>
{/if}
