<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';

	type Props = {
		question: SurveyQuestion;
	};

	let { question }: Props = $props();
</script>

<div class="pt-6 pb-2">
	<h3 class="border-l-2 border-[#F2F0EF] pl-2 text-lg font-semibold text-[#191919] md:text-xl">
		{question.text}
	</h3>
</div>
