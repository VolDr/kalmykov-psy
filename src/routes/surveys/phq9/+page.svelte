<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import { phq9Config } from '../../../configs/phq9Config';

	const url = 'https://kalmykov.pro/surveys/phq9';
	const title = 'Тест на депрессию PHQ-9 онлайн | Опросник депрессивного состояния';
	const description =
		'Пройдите тест на депрессию PHQ-9 онлайн бесплатно. Валидированный опросник для оценки депрессивного состояния. Мгновенные результаты и рекомендации психолога.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="тест на депрессию, PHQ-9, опросник депрессии, депрессивное состояние, симптомы депрессии, оценка депрессии"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />
</svelte:head>

<PageHero title={phq9Config.title} description={phq9Config.description} />

<div class="container mx-auto max-w-[720px] lg:max-w-[760px]">
	<Survey config={phq9Config} />
</div>
