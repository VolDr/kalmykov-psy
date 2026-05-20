<script lang="ts">
	import { marked } from 'marked';
	import PageHero from '$lib/components/PageHero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const article = data.article;
	const content =
		typeof article.content === 'object'
			? (article.content as any).markdown || ''
			: article.content || '';

	// Configure marked to add target="_blank" to external links and icon
	const renderer = new marked.Renderer();
	const originalLinkRenderer = renderer.link.bind(renderer);
	renderer.link = (href, title, text) => {
		const html = originalLinkRenderer(href, title, text);
		const hrefStr = typeof href === 'string' ? href : href?.href || '';
		if (hrefStr && (hrefStr.startsWith('http://') || hrefStr.startsWith('https://'))) {
			return html
				.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
				.replace('</a>', '<span class="icon-[lucide--external-link] ml-1 text-xs"></span></a>');
		}
		return html;
	};

	const htmlContent = marked(content, { renderer });

	const url = `${import.meta.env.VITE_URL}/articles/${article.uri}`;
	const title = `${article.title} | Андрей Калмыков — Психолог`;
	const description = article.descriptionMeta || article.description || article.title;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	{#if article.imageUrl}
		<meta property="og:image" content={article.imageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}
	<meta property="article:author" content="Андрей Калмыков" />
	{#if article.createdAt}
		<meta property="article:published_time" content={article.createdAt} />
	{/if}
	{#if article.updatedAt}
		<meta property="article:modified_time" content={article.updatedAt} />
	{/if}
	<meta name="author" content="Андрей Калмыков" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={article.title} />
	<meta name="twitter:description" content={description} />
	{#if article.imageUrl}
		<meta name="twitter:image" content={article.imageUrl} />
	{/if}

	<!-- Schema.org structured data for Article -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Article",
		"headline": "${article.title.replace(/"/g, '\\"')}",
		"description": "${description.replace(/"/g, '\\"')}",
		"image": "${article.imageUrl || import.meta.env.VITE_URL + '/header.webp'}",
		"datePublished": "${article.createdAt}",
		${article.updatedAt ? `"dateModified": "${article.updatedAt}",` : ''}
		"author": {
			"@type": "Person",
			"name": "Андрей Калмыков",
			"jobTitle": "Психолог",
			"url": "${import.meta.env.VITE_URL}"
		},
		"publisher": {
			"@type": "Organization",
			"name": "Андрей Калмыков — Психолог",
			"logo": {
				"@type": "ImageObject",
				"url": "${import.meta.env.VITE_URL}/logo.svg"
			}
		},
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": "${url}"
		}
	}
	</script>`}

	<!-- BreadcrumbList for better navigation in search results -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{
				"@type": "ListItem",
				"position": 1,
				"name": "Главная",
				"item": "${import.meta.env.VITE_URL}/"
			},
			{
				"@type": "ListItem",
				"position": 2,
				"name": "Статьи",
				"item": "${import.meta.env.VITE_URL}/articles"
			},
			{
				"@type": "ListItem",
				"position": 3,
				"name": "${article.title.replace(/"/g, '\\"')}",
				"item": "${url}"
			}
		]
	}
	</script>`}
</svelte:head>

<PageHero title={article.title} description={article.description} maxWidth="md" />

<article class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[760px] xl:px-0">
	{#if article.imageUrl}
		<img
			src={article.imageUrl}
			alt={article.title}
			class="mb-8 w-full rounded-lg shadow-lg"
			width="1200"
			height="630"
			loading="lazy"
		/>
	{/if}

	<div class="article-content text-lg leading-relaxed text-gray-800">
		{@html htmlContent}
	</div>

	<div class="mt-12 border-t pt-8">
		<a
			href="/articles"
			class="inline-flex items-center gap-2 text-primary transition-colors hover:text-primary/70"
		>
			<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
			<span>Все статьи</span>
		</a>
	</div>
</article>

<style>
	:global(.article-content h1) {
		font-family: 'Circe', system-ui;
		font-size: 2.25rem;
		font-weight: 700;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.2;
		color: var(--color-foreground);
	}

	:global(.article-content h2) {
		font-family: 'Circe', system-ui;
		font-size: 1.875rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.3;
		color: var(--color-foreground);
	}

	:global(.article-content h3) {
		font-family: 'Circe', system-ui;
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		line-height: 1.4;
		color: var(--color-foreground);
	}

	:global(.article-content p) {
		margin-bottom: 1.25rem;
		line-height: 1.75;
	}

	:global(.article-content ul),
	:global(.article-content ol) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
	}

	:global(.article-content li) {
		margin-bottom: 0.5rem;
		line-height: 1.75;
	}

	:global(.article-content a) {
		position: relative;
		text-decoration: none;
		color: var(--color-foreground);
		font-weight: 600;
		display: inline-flex;
		align-items: flex-start;
		transition: color 0.2s;
	}

	:global(.article-content a:hover) {
		color: color-mix(in oklch, var(--color-foreground) 60%, transparent);
	}

	:global(.article-content strong) {
		font-weight: 600;
		color: var(--color-foreground);
	}

	:global(.article-content em) {
		font-style: italic;
	}

	:global(.article-content blockquote) {
		border-left: 4px solid var(--color-primary);
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: var(--color-muted-foreground);
	}

	:global(.article-content code) {
		background-color: var(--color-card);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		font-family: monospace;
	}

	:global(.article-content pre) {
		background-color: var(--color-card);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1.25rem;
	}

	:global(.article-content pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.article-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
	}

	:global(.article-content hr) {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 2rem 0;
	}
</style>
