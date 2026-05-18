<script lang="ts">
	import Survey from '$lib/components/survey/SurveyStep.svelte';
	import { bat23Config } from '../../configs/bat23ConfigSoft';
export const ssr = false;
</script>

<div class="min-h-screen bg-[#f7f5f0]">
	<Survey config={bat23Config} />
</div>