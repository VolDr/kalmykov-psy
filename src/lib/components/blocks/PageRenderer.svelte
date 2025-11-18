<script lang="ts">
	import type { PageConfiguration } from '$lib/types/page-blocks';
	import BlockRenderer from './BlockRenderer.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		page: PageConfiguration;
	}

	let { page }: Props = $props();

	// Sort blocks by sortOrder
	const sortedBlocks = $derived(
		[...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder).filter((b) => b.isActive)
	);

	// Blocks that should NOT be wrapped in container
	// (hero blocks and other full-width sections)
	const fullWidthBlockTypes = ['page-hero', 'home-hero'];

	// Split blocks into hero and body sections
	const heroBlocks = $derived(sortedBlocks.filter((b) => fullWidthBlockTypes.includes(b.type)));
	const bodyBlocks = $derived(sortedBlocks.filter((b) => !fullWidthBlockTypes.includes(b.type)));

	// Map maxWidth setting to Tailwind classes
	const maxWidthClasses = {
		sm: 'max-w-[720px]',
		md: 'max-w-[960px]',
		lg: 'max-w-[1200px]',
		xl: 'max-w-[1440px]',
		full: 'max-w-full'
	};

	const containerClass = $derived(() => {
		const layout = page.layout;
		if (!layout?.withContainer) return '';

		const maxWidth = layout.maxWidth || 'lg';
		return cn('container mx-auto px-5 lg:px-0', maxWidthClasses[maxWidth], layout.containerClass);
	});
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
	<!-- Hero blocks (full width, no container) -->
	{#each heroBlocks as block (block.id)}
		<BlockRenderer {block} />
	{/each}

	<!-- Body blocks (wrapped in container if withContainer is enabled) -->
	<div class={containerClass()}>
		{#each bodyBlocks as block (block.id)}
			<BlockRenderer {block} />
		{/each}
	</div>
</div>
