<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import { gad7Config } from '../../../configs/gad7Config';

	const url = 'https://kalmykov.pro/surveys/gad7';
	const title =
		'Тест на тревожность GAD-7 онлайн | Опросник генерализованного тревожного расстройства';
	const description =
		'Пройдите тест на тревожность GAD-7 онлайн бесплатно. Валидированный опросник для оценки генерализованного тревожного расстройства. Мгновенные результаты и рекомендации психолога.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="тест на тревожность, GAD-7, тревожное расстройство, генерализованная тревога, опросник тревоги, оценка тревожности"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<section data-hero class="relative min-h-[30vh] overflow-hidden text-gray-100">
	<HeroBackground />
	<div
		class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
		<div
			class="relative z-10 mx-auto mt-[10vh] mb-4 min-h-[100px] max-w-[960px] pt-[63px] lg:hidden"
		>
			<h1 class="self-end font-circe text-3xl">{gad7Config.title}</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				{gad7Config.description}
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[1200px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">{gad7Config.title}</h1>
		</div>

		<div
			class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
				{gad7Config.description}
			</p>
		</div>
	</div>
</section>

<div class="container mx-auto max-w-[720px] lg:max-w-[1200px]">
	<Survey config={gad7Config} />
</div>
