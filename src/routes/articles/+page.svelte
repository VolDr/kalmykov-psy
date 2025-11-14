<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const url = `${import.meta.env.VITE_URL}/articles`;
	const title = 'Статьи по психологии | Андрей Калмыков — Психолог';
	const description =
		'Полезные статьи по психологии: депрессия, тревожность, перфекционизм, прокрастинация, выгорание. Профессиональная помощь и рекомендации психолога.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="психология, статьи по психологии, депрессия, тревожность, перфекционизм, прокрастинация, выгорание, психологическая помощь"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
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
			<h1 class="self-end font-circe text-3xl">Статьи</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				Делюсь тут статьями о психологии и человеческих переживаниях. Рассказываю о выгорании,
				тревоге и поиске себя простым языком.
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[960px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-tight lg:text-5xl">Статьи</h1>
		</div>

		<div
			class="col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base leading-relaxed lg:text-md"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
				Делюсь тут статьями о психологии и человеческих переживаниях. Рассказываю о выгорании,
				тревоге и поиске себя простым языком.
			</p>
		</div>
	</div>
</section>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
	<div class="grid w-full grid-cols-1 gap-4 md:px-0">
		<div class="mt-[40px] space-y-12 sm:mt-[60px] lg:px-0">
			{#if data.articles.length === 0}
				<div class="py-12 text-center">
					<p class="text-lg text-gray-600">Статьи пока отсутствуют</p>
				</div>
			{:else}
				<div class="space-y-6">
					<div class="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
						{#each data.articles as article (article.id)}
							<Card

							todo='Читать'
								title={article.title}
								link="/articles/{article.uri}"
								description={article.description || 'Читать далее'}
							/>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
