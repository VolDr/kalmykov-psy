<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import { mzqConfig } from '../../../configs/mzqConfig';

	const url = 'https://kalmykov.pro/surveys/mzq';
	const title = 'Опросник ментализации MZQ-15 онлайн | Андрей Калмыков';
	const description =
		'Пройдите MZQ-15 на русском языке: 15 утверждений и результаты по четырём аспектам ментализации. Предварительный перевод без диагностических порогов.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="MZQ-15, Mentalization Questionnaire, ментализация, опросник ментализации, саморефлексия, осознавание эмоций"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<section data-hero class="relative min-h-[30vh] overflow-hidden text-gray-100">
	<HeroBackground />
	<div class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"></div>
	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[1200px] lg:px-0">
		<div class="relative z-10 pt-[100px] pb-12 lg:pt-[180px]">
			<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">{mzqConfig.title}</h1>
			<p class="mt-4 max-w-[720px] text-base lg:text-lg">{mzqConfig.description}</p>
		</div>
	</div>
</section>

<div class="container mx-auto max-w-[720px] lg:max-w-[1200px]">
	<Survey config={mzqConfig} />
</div>
