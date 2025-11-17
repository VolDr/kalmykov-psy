<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import type { PageData } from './$types';
	import { surveyCategories } from '$lib/data/content';

	let { data }: { data: PageData } = $props();
	const { content } = data;

	const url = `${import.meta.env.VITE_URL}/surveys`;
</script>

<svelte:head>
	<title>{content.seo.title}</title>
	<meta name="description" content={content.seo.description} />
	<meta
		name="keywords"
		content="психологические тесты онлайн, тест на депрессию, тест на тревожность, тест на перфекционизм, тест на прокрастинацию, тест на выгорание, PHQ-9, GAD-7, CPQ, PSI, IPS, BAT, опросники, самодиагностика, психологическая помощь"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={content.seo.title} />
	<meta property="og:description" content={content.seo.description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content={content.seo.ogImage || '/header.webp'} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={content.seo.title} />
	<meta name="twitter:description" content={content.seo.description} />
	<meta name="twitter:image" content={content.seo.ogImage || '/header.webp'} />
</svelte:head>



<section
	data-hero
	class="relative min-h-[30vh] overflow-hidden text-gray-100"
>
	<HeroBackground />
	<div
		class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
		<div
			class="relative z-10 mx-auto mt-[10vh] mb-4 min-h-[100px] max-w-[960px] pt-[63px] lg:hidden"
		>
			<h1 class="self-end font-circe text-3xl">{content.hero.title}</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				{content.hero.subtitle}
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[1200px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">{content.hero.title}</h1>
		</div>

		<div
			class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
				{content.hero.subtitle}
			</p>
		</div>
	</div>
</section>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[1200px] lg:px-0">
	<div class="grid w-full grid-cols-1 gap-4  md:px-0">
		<div class="mt-[40px] space-y-12 sm:mt-[60px] lg:px-0">
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
