<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Questionnaire from '$lib/components/questionnaire/QuestionnaireStep.svelte';
	import { bat23Config } from '../../../configs/bat23ConfigSoft';
	import { sendEvent } from '$lib/client/leadMagnetTracking';
	import { landOnHashTarget } from '$lib/hashLanding';

	export const ssr = false;

	let { data } = $props();

	// sbClientId приходит с сервера (из HttpOnly cookie, установленного /go/q/[clientId])
	const sbClientId = data.sbClientId;
	const toAcquaintance = data.toAcquaintance;

	let landed = false;

	/**
	 * Блок «Что делать дальше» существует только на экране результатов, поэтому
	 * приземляемся либо сразу (результаты восстановились из localStorage), либо
	 * когда человек только что прошёл опросник.
	 */
	async function landOnAcquaintance() {
		if (!toAcquaintance || landed) return;
		await tick();
		const el = document.getElementById('acquaintance');
		if (!el) return;
		landed = true;
		landOnHashTarget(el);
	}

	onMount(() => {
		if (sbClientId) sendEvent('quiz', 'opened', 0);
		landOnAcquaintance();
	});

	function handleComplete() {
		if (sbClientId) sendEvent('quiz', 'completed', 100);
		landOnAcquaintance();
	}
</script>

<div class="min-h-screen bg-background">
	<Questionnaire
		config={bat23Config}
		showEmailStep={false}
		title="Опросник на уровень выгорания"
		oncomplete={handleComplete}
		autoScrollToResults={!toAcquaintance}
	/>
</div>
