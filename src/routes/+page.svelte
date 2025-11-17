<script lang="ts">
	import type { PageData } from './$types';
	import MainGrid from '$lib/components/layout/MainGrid.svelte';
	import PageRenderer from '$lib/components/blocks/PageRenderer.svelte';
	import type { PageConfiguration } from '$lib/types/page-blocks';

	let { data }: { data: PageData } = $props();
	const { content, blocks, hasBlocks } = data;

	// Create page configuration for PageRenderer
	const pageConfig: PageConfiguration = $derived({
		slug: 'home',
		name: 'Главная страница',
		seo: content.seo,
		blocks: blocks
	});
</script>

<!--
  When hasBlocks=true, PageRenderer will override these with its own svelte:head.
  When hasBlocks=false, these values are used for legacy content.
-->
<svelte:head>
	<title>{content.seo.title}</title>
	<meta name="description" content={content.seo.description} />
	<meta property="og:title" content={content.seo.title} />
	<meta property="og:description" content={content.seo.description} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={content.seo.ogImage || '/header.webp'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={content.seo.title} />
	<meta name="twitter:description" content={content.seo.description} />
	<meta name="twitter:image" content={content.seo.ogImage || '/header.webp'} />
</svelte:head>

{#if hasBlocks}
	<PageRenderer page={pageConfig} />
{:else}
	<MainGrid />
{/if}
