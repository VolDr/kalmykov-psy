<script lang="ts">
	import { marked } from 'marked';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
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
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={article.title} />
	<meta name="twitter:description" content={description} />
	{#if article.imageUrl}
		<meta name="twitter:image" content={article.imageUrl} />
	{/if}
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
			<h1 class="self-end font-circe text-3xl">{article.title}</h1>
		</div>
		{#if article.description}
			<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
				<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
					{article.description}
				</p>
			</div>
		{/if}
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[960px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-tight lg:text-5xl">{article.title}</h1>
		</div>

		{#if article.description}
			<div
				class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base leading-relaxed"
			>
				<p class="mx-auto text-center lg:mx-0 lg:text-left">
					{article.description}
				</p>
			</div>
		{/if}
	</div>
</section>

<article class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
	{#if article.imageUrl}
		<img
			src={article.imageUrl}
			alt={article.title}
			class="mb-8 w-full rounded-lg shadow-lg"
			loading="lazy"
		/>
	{/if}

	<div class="article-content text-lg leading-relaxed text-gray-800">
		{@html htmlContent}
	</div>

	<div class="mt-12 border-t pt-8">
		<a
			href="/articles"
			class="inline-flex items-center gap-2 text-[#B8A98A] transition-colors hover:text-[#998970]"
		>
			<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
			<span>Все статьи</span>
		</a>
	</div>
</article>

<style>
	:global(.article-content h1) {
		font-family: 'Circe', sans-serif;
		font-size: 2.25rem;
		font-weight: 700;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.2;
		color: #191919;
	}

	:global(.article-content h2) {
		font-family: 'Circe', sans-serif;
		font-size: 1.875rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.3;
		color: #191919;
	}

	:global(.article-content h3) {
		font-family: 'Circe', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		line-height: 1.4;
		color: #191919;
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
		color: #443d3d;
		font-weight: 600;
		display: inline-flex;
		align-items: flex-start;
		transition: color 0.2s;
	}

	:global(.article-content a:hover) {
		color: rgba(25, 25, 25, 0.6);
	}

	:global(.article-content strong) {
		font-weight: 600;
		color: #191919;
	}

	:global(.article-content em) {
		font-style: italic;
	}

	:global(.article-content blockquote) {
		border-left: 4px solid #b8a98a;
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #4a5568;
	}

	:global(.article-content code) {
		background-color: #f7fafc;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		font-family: monospace;
	}

	:global(.article-content pre) {
		background-color: #f7fafc;
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
		border-top: 1px solid #e2e8f0;
		margin: 2rem 0;
	}
</style>
