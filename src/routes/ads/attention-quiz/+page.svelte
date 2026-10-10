<script lang="ts">
	import AttentionAdPitch from '$lib/components/leadmagnet/AttentionAdPitch.svelte';
</script>

<!--
	Вариант B A/B-теста лид-магнита focus. Питч и кнопка те же, что на
	/ads/attention: различается только сценарий в боте, который по ключу
	focus_quiz_ad должен слать короткую ссылку /go/fq/{contact_id} —
	лонгрид с опросником вместо лонгрида с записью на встречу.
-->
<svelte:head>
	<title>Вы отдохнули, а легче не стало | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AttentionAdPitch scenarioKey="focus_quiz_ad" adName="attention-quiz" />
