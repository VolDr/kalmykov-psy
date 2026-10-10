<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import { marked, type Tokens } from 'marked';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const article = $derived(data.article);
	const renderer = new marked.Renderer();
	const originalLinkRenderer = renderer.link.bind(renderer);

	renderer.link = (link: Tokens.Link) => {
		const html = originalLinkRenderer(link);
		const hrefString = link.href;

		if (!hrefString.startsWith('http://') && !hrefString.startsWith('https://')) return html;

		return html
			.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
			.replace(
				'</a>',
				'<span class="icon-[lucide--external-link] ml-1 inline-block h-3.5 w-3.5"></span></a>'
			);
	};

	const htmlContent = $derived(marked(article.content.markdown, { renderer }));
	const siteUrl = import.meta.env.VITE_URL || 'https://kalmykov-psy.ru';
	const url = $derived(`${siteUrl}/articles/${article.uri}`);
	const image = `${siteUrl}/header.webp`;
	const title = $derived(article.seoTitle);
	const description = $derived(article.descriptionMeta || article.description);
	const publishedDate = $derived(
		new Intl.DateTimeFormat('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(article.createdAt))
	);

	const articleJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: article.title,
			description,
			datePublished: article.createdAt,
			dateModified: article.updatedAt,
			inLanguage: 'ru-RU',
			timeRequired: `PT${article.readingMinutes}M`,
			about: article.category,
			author: {
				'@type': 'Person',
				'@id': `${siteUrl}/info#person`,
				name: 'Андрей Калмыков',
				jobTitle: 'Психолог-консультант',
				url: `${siteUrl}/info`
			},
			publisher: {
				'@type': 'Person',
				'@id': `${siteUrl}/info#person`,
				name: 'Андрей Калмыков',
				url: `${siteUrl}/info`
			},
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': url
			}
		}).replace(/</g, '\\u003c')
	);

	const breadcrumbJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Главная',
					item: siteUrl
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Статьи',
					item: `${siteUrl}/articles`
				},
				{
					'@type': 'ListItem',
					position: 3,
					name: article.cluster,
					item: `${siteUrl}/articles#cluster-${article.clusterSlug}`
				},
				{
					'@type': 'ListItem',
					position: 4,
					name: article.title,
					item: url
				}
			]
		}).replace(/</g, '\\u003c')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="Андрей Калмыков" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

	<meta property="og:type" content="article" />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков, психолог" />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Андрей Калмыков, психолог" />
	<meta property="article:author" content="Андрей Калмыков" />
	<meta property="article:published_time" content={article.createdAt} />
	<meta property="article:modified_time" content={article.updatedAt} />
	<meta property="article:section" content={article.category} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={article.title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	{@html `<script type="application/ld+json">${articleJsonLd}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbJsonLd}</script>`}
</svelte:head>

<section class="bg-background pt-20 lg:pt-28">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8 px-5 pt-8 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] xl:px-0"
	>
		<Reveal width="full">
			<div>
				<nav
					aria-label="Хлебные крошки"
					class="mb-8 flex flex-wrap items-center gap-2 text-[14px] text-foreground/55"
				>
					<a
						href="/"
						class="min-h-11 content-center font-semibold text-navy no-underline hover:text-primary"
					>
						Главная
					</a>
					<span class="icon-[lucide--chevron-right] h-4 w-4 text-foreground/35" aria-hidden="true"
					></span>
					<a
						href="/articles"
						class="min-h-11 content-center font-semibold text-navy no-underline hover:text-primary"
					>
						Статьи
					</a>
					<span class="icon-[lucide--chevron-right] h-4 w-4 text-foreground/35" aria-hidden="true"
					></span>
					<a
						href="/articles#cluster-{article.clusterSlug}"
						class="min-h-11 content-center font-semibold text-navy no-underline hover:text-primary"
					>
						{article.cluster}
					</a>
				</nav>

				<div
					class="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium text-foreground/55"
				>
					<span class="font-semibold text-primary">{article.category}</span>
					<a href="/info" class="font-semibold text-navy no-underline hover:text-primary">
						Андрей Калмыков, психолог
					</a>
					<span class="inline-flex items-center gap-1.5">
						<span class="icon-[lucide--clock-3] h-4 w-4" aria-hidden="true"></span>
						{article.readingMinutes} мин чтения
					</span>
					<time datetime={article.createdAt}>{publishedDate}</time>
				</div>

				<h1
					class="max-w-[860px] font-caveat text-[38px] leading-[1.12] font-bold tracking-[0.2px] text-navy sm:text-[44px] lg:text-[52px]"
				>
					{article.title}
				</h1>

				<p class="mt-6 max-w-[760px] text-[17px] leading-[1.68] text-foreground/75 lg:text-[18px]">
					{article.description}
				</p>
			</div>
		</Reveal>

		<Reveal width="full">
			<div class="hidden min-h-[280px] items-center justify-center lg:flex">
				<img src="/vaza.webp" alt="" class="h-auto w-full max-w-[320px]" aria-hidden="true" />
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-background pt-10 pb-10 lg:pt-14 lg:pb-16">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		<article class="mx-auto max-w-[920px] pt-10 lg:pt-12">
			<div class="article-content">
				{@html htmlContent}
			</div>

			{#if data.relatedArticles.length > 0}
				<aside class="mt-12 border-y border-[#e4dccb] py-8" aria-labelledby="related-heading">
					<h2 id="related-heading" class="text-[22px] leading-tight font-extrabold text-navy">
						Читайте также
					</h2>
					<div class="mt-5 divide-y divide-[#e4dccb]">
						{#each data.relatedArticles as relatedArticle}
							<a
								href="/articles/{relatedArticle.uri}"
								class="group grid grid-cols-[1fr_auto] items-center gap-5 py-4 no-underline"
							>
								<span>
									<span
										class="block text-[17px] leading-snug font-bold text-navy group-hover:text-primary"
									>
										{relatedArticle.title}
									</span>
									<span class="mt-1 block text-[14px] text-foreground/55">
										{relatedArticle.category} · {relatedArticle.readingMinutes} мин
									</span>
								</span>
								<span
									class="icon-[lucide--arrow-right] h-5 w-5 text-primary transition-transform group-hover:translate-x-1"
									aria-hidden="true"
								></span>
							</a>
						{/each}
					</div>
				</aside>
			{/if}

			<Reveal width="full">
				<div class="mt-14 rounded-[24px] bg-card px-7 py-8 sm:px-10 sm:py-10">
					<div>
						<div class="flex items-center gap-4">
							<img src="/star_2.webp" class="h-9 w-9 shrink-0" alt="" aria-hidden="true" />
							<h2 class="font-caveat text-[29px] leading-tight font-bold text-navy lg:text-[32px]">
								Можно разобраться вместе
							</h2>
						</div>
						<p class="mt-4 max-w-[700px] text-[16px] leading-relaxed text-foreground/70">
							Если в тексте вы узнали свою ситуацию и хотите понять, что делать дальше, это можно
							обсудить на консультации.
						</p>
						<ButtonSvg
							href="/#price"
							variant="1"
							width="250px"
							height="70px"
							mobileWidth="250px"
							mobileHeight="60px"
							class="mt-6"
						>
							Подробнее
						</ButtonSvg>
					</div>
				</div>
			</Reveal>

			<a
				href="/articles"
				class="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-navy no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				<span class="icon-[lucide--arrow-left] h-4 w-4" aria-hidden="true"></span>
				Все статьи
			</a>
		</article>
	</div>
</section>

<style>
	:global(.article-content) {
		color: color-mix(in oklab, var(--color-foreground) 82%, transparent);
		font-size: 16px;
		line-height: 1.72;
		overflow-wrap: break-word;
	}

	:global(.article-content > p:first-child) {
		color: var(--color-navy);
		font-size: 18px;
		font-weight: 600;
		line-height: 1.65;
	}

	:global(.article-content h2) {
		margin-top: clamp(2.5rem, 5vw, 3.5rem);
		margin-bottom: 1rem;
		color: var(--color-navy);
		font-family: var(--font-caveat);
		font-size: 30px;
		font-weight: 700;
		line-height: 1.18;
	}

	:global(.article-content h3) {
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		color: var(--color-navy);
		font-size: 20px;
		font-weight: 700;
		line-height: 1.35;
	}

	:global(.article-content p) {
		margin: 1rem 0;
	}

	:global(.article-content ul),
	:global(.article-content ol) {
		margin: 1.35rem 0;
		padding-left: 1.5rem;
	}

	:global(.article-content ul) {
		list-style: disc;
	}

	:global(.article-content ol) {
		list-style: decimal;
	}

	:global(.article-content li) {
		margin: 0.65rem 0;
		padding-left: 0.25rem;
	}

	:global(.article-content a) {
		color: var(--color-navy);
		font-weight: 600;
		text-decoration-color: color-mix(in oklab, var(--color-primary) 75%, transparent);
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
		transition: color 180ms ease-out;
	}

	:global(.article-content a:hover) {
		color: var(--color-primary);
	}

	:global(.article-content a:focus-visible) {
		border-radius: 4px;
		outline: 2px solid var(--color-primary);
		outline-offset: 3px;
	}

	:global(.article-content strong) {
		color: var(--color-navy);
		font-weight: 750;
	}

	:global(.article-content blockquote) {
		margin: 2rem 0;
		border-radius: 18px;
		background: var(--color-card);
		padding: 1.35rem 1.5rem;
		color: var(--color-navy);
	}

	:global(.article-content blockquote p:first-child) {
		margin-top: 0;
	}

	:global(.article-content blockquote p:last-child) {
		margin-bottom: 0;
	}

	:global(.article-content code) {
		border-radius: 6px;
		background: color-mix(in oklab, var(--color-card) 86%, var(--color-primary));
		padding: 0.12rem 0.38rem;
		font-size: 0.9em;
	}

	:global(.article-content pre) {
		overflow-x: auto;
		border-radius: 14px;
		background: var(--color-navy);
		padding: 1.25rem;
		color: var(--color-background);
	}

	:global(.article-content pre code) {
		background: transparent;
		padding: 0;
	}

	:global(.article-content table) {
		display: block;
		width: 100%;
		overflow-x: auto;
		border-collapse: collapse;
		margin: 2rem 0;
		font-size: 0.92em;
	}

	:global(.article-content th),
	:global(.article-content td) {
		min-width: 10rem;
		border: 1px solid #e4dccb;
		padding: 0.8rem 0.9rem;
		text-align: left;
		vertical-align: top;
	}

	:global(.article-content th) {
		background: var(--color-card);
		color: var(--color-navy);
		font-weight: 750;
	}

	:global(.article-content td:first-child) {
		background: color-mix(in oklab, var(--color-card) 88%, var(--color-primary));
		color: var(--color-navy);
		font-weight: 650;
	}

	:global(.article-content hr) {
		margin: 3rem 0;
		border: 0;
		border-top: 1px solid #d8cfbc;
	}

	@media (max-width: 640px) {
		:global(.article-content ul),
		:global(.article-content ol) {
			padding-left: 1.25rem;
		}

		:global(.article-content blockquote) {
			padding: 1.2rem;
		}
	}

	@media (min-width: 768px) {
		:global(.article-content) {
			font-size: 17px;
		}

		:global(.article-content h2) {
			font-size: 32px;
		}

		:global(.article-content h3) {
			font-size: 21px;
		}
	}
</style>
