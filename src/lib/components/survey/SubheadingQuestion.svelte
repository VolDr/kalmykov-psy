<script lang="ts">
	import type { SurveyQuestion } from '$lib/data/surveys/types';

	type Props = {
		question: SurveyQuestion;
	};

	let { question }: Props = $props();
</script>

<div class="pt-6 pb-2">
	<h3 class="text-lg md:text-xl font-semibold text-[#191919] border-l-2 border-[#F2F0EF] pl-2">
		{question.text}
	</h3>
</div>
