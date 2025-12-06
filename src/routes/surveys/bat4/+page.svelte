<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import { bat4Config } from '../../../configs/bat4Config';

	const url = 'https://kalmykov.pro/surveys/bat4';
	const title =
		'Тест на выгорание BAT-4 онлайн | Ультракороткий опросник профессионального выгорания';
	const description =
		'Пройдите тест на профессиональное выгорание BAT-4 онлайн бесплатно. Ультракороткий валидированный опросник для быстрого скрининга выгорания. Мгновенные результаты и рекомендации психолога.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="тест на выгорание, BAT-4, профессиональное выгорание, эмоциональное выгорание, опросник выгорания, burnout assessment, быстрый тест на выгорание"
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

<PageHero title={bat4Config.title} description={bat4Config.description} />

<div class="container mx-auto max-w-[720px] lg:max-w-[1200px]">
	<Survey config={bat4Config} />
</div>
