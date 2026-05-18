<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import { psiConfig } from '../../../configs/psiConfig';

	const url = 'https://kalmykov.pro/surveys/psi';
	const title = 'Тест на прокрастинацию ПШ (PSI) онлайн | Шкала прокрастинации П. Стила';
	const description =
		'Пройдите тест на прокрастинацию ПШ (PSI) онлайн бесплатно. Валидированная шкала прокрастинации П. Стила для оценки склонности откладывать дела. Мгновенные результаты и рекомендации психолога.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="тест на прокрастинацию, ПШ, PSI, шкала прокрастинации, откладывание дел, Пирс Стил, оценка прокрастинации"
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

<PageHero title={psiConfig.title} description={psiConfig.description} />

<div class="container mx-auto max-w-[720px] lg:max-w-[760px]">
	<Survey config={psiConfig} />
</div>
