<script lang="ts">
	import type { PageConfiguration } from '$lib/types/page-blocks';
	import BlockRenderer from './BlockRenderer.svelte';

	interface Props {
		page: PageConfiguration;
	}

	let { page }: Props = $props();

	// Sort blocks by sortOrder
	const sortedBlocks = $derived(
		[...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder).filter((b) => b.isActive)
	);
</script>

<svelte:head>
	<title>{page.seo.title}</title>
	<meta name="description" content={page.seo.description} />
	<meta property="og:title" content={page.seo.title} />
	<meta property="og:description" content={page.seo.description} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={page.seo.ogImage || '/header.webp'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={page.seo.title} />
	<meta name="twitter:description" content={page.seo.description} />
	<meta name="twitter:image" content={page.seo.ogImage || '/header.webp'} />
</svelte:head>

<div class="page-content">
	{#each sortedBlocks as block (block.id)}
		<BlockRenderer {block} />
	{/each}
</div>
