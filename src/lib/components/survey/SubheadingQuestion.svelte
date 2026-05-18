<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';

	type Props = {
		question: SurveyQuestion;
	};

	let { question }: Props = $props();
</script>

{#if question.text}
	<div class="pt-6 pb-2">
		<h3 class="border-l-2 border-[#f7f5f0] pl-2 text-md font-semibold text-[#191919] md:text-xl">
			{question.text}
		</h3>
	</div>
{/if}
