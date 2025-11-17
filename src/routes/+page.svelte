<script lang="ts">
	import type { PageData } from './$types';
	import MainGrid from '$lib/components/layout/MainGrid.svelte';

	let { data }: { data: PageData } = $props();
	const { content } = data;
</script>

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

<MainGrid />
