<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
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
	title="Статьи"
	description="Делюсь тут статьями о психологии и человеческих переживаниях. Рассказываю о выгорании, тревоге и поиске себя простым языком."
	maxWidth="md"
/>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[760px] xl:px-0">
	<div class="grid w-full grid-cols-1 gap-4 xl:px-0">
		<div class="mt-[40px] space-y-12 sm:mt-[60px] xl:px-0">
			{#if data.articles.length === 0}
				<div class="py-12 text-center">
					<p class="text-lg text-gray-600">Статьи пока отсутствуют</p>
				</div>
			{:else}
				<div class="space-y-6">
					<div class="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
						{#each data.articles as article (article.id)}
							<Card
								todo="Читать"
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
