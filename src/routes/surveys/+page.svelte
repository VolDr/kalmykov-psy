<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import PageHero from '$lib/components/PageHero.svelte';

	import { surveyCategories } from '$lib/data/content';

	const url = `${import.meta.env.VITE_URL}/surveys`;
	const title =
		'Психологические опросники онлайн | Тесты на депрессию, тревогу, перфекционизм, прокрастинацию и выгорание';
	const description =
		'Бесплатные психологические опросники онлайн: PHQ-9 на депрессию, GAD-7 на тревожность, CPQ на перфекционизм, ПШ/ИПШ на прокрастинацию, BAT на профессиональное выгорание. Валидированные тесты для самодиагностики с мгновенными результатами и рекомендациями психолога.';

	type Survey = { title: string; link: string; description: string };
	type Category = { category: string; surveys: Survey[] };
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="психологические тесты онлайн, тест на депрессию, тест на тревожность, тест на перфекционизм, тест на прокрастинацию, тест на выгорание, PHQ-9, GAD-7, CPQ, PSI, IPS, BAT, опросники, самодиагностика, психологическая помощь"
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

<PageHero
	title="Опросники"
	description="Психологические тесты и опросники для самодиагностики. Оцените своё состояние с помощью валидизированных инструментов."
/>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] xl:px-0">
	<div class="grid w-full grid-cols-1 gap-4 xl:px-0">
		<div class="mt-[40px] space-y-12 sm:mt-[60px] xl:px-0">
			{#each surveyCategories as category}
				<div class="space-y-6">
					<h2 class="text-2xl font-semibold text-[#191919]">{category.category}</h2>
					<div class="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
						{#each category.surveys as survey}
							<Card title={survey.title} link={survey.link} description={survey.description} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
