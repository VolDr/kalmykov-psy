<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteUrl = import.meta.env.VITE_URL || 'https://kalmykov-psy.ru';
	const url = `${siteUrl}/articles`;
	const ogImage = `${siteUrl}/header.webp`;
	const title = 'Статьи о выгорании и психологии | Андрей Калмыков';
	const description =
		'Практические статьи психолога Андрея Калмыкова о выгорании, прокрастинации, сне, эмоциях, отношениях и психотерапии.';
	const clusterDefinitions = [
		{ title: 'Выгорание и восстановление', slug: 'burnout' },
		{ title: 'Прокрастинация, внимание и сон', slug: 'focus' },
		{ title: 'Саморегуляция и жизненные ориентиры', slug: 'life-decisions' },
		{ title: 'О психотерапии', slug: 'therapy' }
	];
	const articleClusters = $derived(
		clusterDefinitions
			.map((cluster) => ({
				...cluster,
				articles: data.articles.filter((article) => article.cluster === cluster.title)
			}))
			.filter((cluster) => cluster.articles.length > 0)
	);
	const articleCountLabel = (count: number) => {
		const lastTwoDigits = count % 100;
		const lastDigit = count % 10;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'статей';
		if (lastDigit === 1) return 'статья';
		if (lastDigit >= 2 && lastDigit <= 4) return 'статьи';
		return 'статей';
	};
	const collectionJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: title,
			description,
			url,
			mainEntity: {
				'@type': 'ItemList',
				itemListElement: data.articles.map((article, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					url: `${siteUrl}/articles/${article.uri}`,
					name: article.title
				}))
			}
		}).replace(/</g, '\\u003c')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow, max-image-preview:large" />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков, психолог" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	{@html `<script type="application/ld+json">${collectionJsonLd}</script>`}
</svelte:head>

<section class="bg-background pt-16 lg:pt-24">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8 px-5 pt-[43px] md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.1fr_0.9fr] xl:px-0"
	>
		<Reveal width="full">
			<div class="flex flex-col">
				<span
					class="relative mb-4 inline-block w-fit -rotate-[4deg] font-caveat text-[25px] font-bold text-primary"
				>
					разобраться без магии
				</span>

				<h1
					class="max-w-[720px] font-caveat text-[50px] leading-[1.08] font-bold tracking-[0.5px] text-navy sm:text-[58px] lg:text-[72px]"
				>
					Статьи о выгорании и психологии
				</h1>

				<p class="mt-7 max-w-[570px] text-[18px] leading-[1.7] text-foreground/75 lg:text-[19px]">
					Разбираю состояния и привычки через исследования, практику и ситуации из жизни. Без
					диагнозов по одному симптому и обещаний быстрых перемен.
				</p>
				<p class="mt-4 max-w-[570px] text-[17px] leading-[1.7] text-foreground/70 lg:text-[18px]">
					Эти статьи собраны по материалам моего
					<a
						href="https://t.me/kalmykov_psy"
						target="_blank"
						rel="noopener noreferrer"
						class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-4 hover:text-primary"
					>
						Telegram-канала</a
					>. Там больше разборов о психологии, выгорании, прокрастинации, эмоциях и отношениях.
				</p>
			</div>
		</Reveal>

		<Reveal width="full">
			<div class="hidden min-h-[270px] items-center justify-center lg:flex lg:min-h-[330px]">
				<img src="/vaza.webp" alt="" class="h-auto w-full max-w-[380px]" aria-hidden="true" />
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-background pt-8 pb-8 lg:pb-12">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		{#each articleClusters as cluster}
			<section class="pt-10 lg:pt-14" aria-labelledby="cluster-{cluster.slug}">
				<div class="flex items-baseline justify-between gap-5 border-b border-[#d8cfbc] pb-4">
					<h2
						id="cluster-{cluster.slug}"
						class="font-caveat text-[30px] leading-tight font-bold text-navy sm:text-[34px]"
					>
						{cluster.title}
					</h2>
					<span class="shrink-0 text-[14px] text-foreground/50">
						{cluster.articles.length}
						{articleCountLabel(cluster.articles.length)}
					</span>
				</div>

				{#each cluster.articles as article, index}
					<Reveal width="full">
						<a
							href="/articles/{article.uri}"
							class="group grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-[#e4dccb] py-8 text-left no-underline sm:grid-cols-[62px_minmax(0,1fr)_130px_44px] sm:items-center lg:grid-cols-[76px_minmax(0,1fr)_180px_48px] lg:gap-x-7 lg:py-10"
							aria-label="Читать: {article.title}"
						>
							<span
								class="col-start-1 row-start-1 font-caveat text-[38px] leading-none font-bold text-primary lg:text-[48px]"
							>
								{String(index + 1).padStart(2, '0')}
							</span>

							<div class="col-start-2 row-start-1 min-w-0">
								<h3
									class="block max-w-[720px] font-caveat text-[29px] leading-[1.12] font-bold text-navy transition-colors group-hover:text-primary sm:text-[32px] lg:text-[36px]"
								>
									{article.title}
								</h3>
								<p
									class="mt-3 block max-w-[720px] text-[15px] leading-[1.62] text-foreground/70 lg:text-[16px]"
								>
									{article.description}
								</p>
							</div>

							<span
								class="col-start-2 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] font-medium text-foreground/50 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-start sm:gap-1"
							>
								<span class="text-primary">{article.category}</span>
								<span class="inline-flex items-center gap-1.5 whitespace-nowrap">
									<span class="icon-[lucide--clock-3] h-4 w-4" aria-hidden="true"></span>
									{article.readingMinutes} мин
								</span>
							</span>

							<span
								class="hidden h-11 w-11 items-center justify-center self-center rounded-full border border-transparent text-navy transition-all duration-200 group-hover:translate-x-1 group-hover:border-primary group-hover:text-primary sm:col-start-4 sm:row-start-1 sm:flex lg:h-12 lg:w-12"
								aria-hidden="true"
							>
								<span class="icon-[lucide--arrow-right] h-[22px] w-[22px]"></span>
							</span>
						</a>
					</Reveal>
				{/each}
			</section>
		{/each}

		<Reveal width="full">
			<div
				class="mt-8 grid grid-cols-1 items-center gap-6 rounded-[24px] bg-card px-7 py-8 sm:grid-cols-[auto_1fr_auto] sm:px-10 lg:gap-9"
			>
				<img src="/star_2.webp" class="h-11 w-11 shrink-0" alt="" aria-hidden="true" />
				<div>
					<h2 class="font-caveat text-[30px] leading-tight font-bold text-navy lg:text-[34px]">
						Текст помог узнать себя, но вопрос остался?
					</h2>
					<p class="mt-2 max-w-[650px] text-[16px] leading-relaxed text-foreground/70">
						На консультации можно разобрать именно вашу ситуацию и найти следующий посильный шаг.
					</p>
				</div>
				<a
					href="/#price"
					class="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-primary px-6 py-3 text-[15px] font-bold text-navy no-underline transition-colors duration-200 hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					Записаться
				</a>
			</div>
		</Reveal>
	</div>
</section>
