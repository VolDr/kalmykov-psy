<script lang="ts">
	import Questionnaire from '$lib/components/questionnaire/QuestionnaireStep.svelte';
	import { bat23Config } from '../../../configs/bat23ConfigSoft';
	
export const ssr = false;
</script>

<div class="min-h-screen bg-background">
	<Questionnaire config={bat23Config} showEmailStep={false} title="Опросник на уровень выгорания" />
</div>