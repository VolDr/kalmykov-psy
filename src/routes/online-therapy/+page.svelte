<script lang="ts">
	import type { PageData } from './$types';
	import { cn } from '$lib/utils';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import PageRenderer from '$lib/components/blocks/PageRenderer.svelte';
	import type { PageConfiguration } from '$lib/types/page-blocks';

	let { data }: { data: PageData } = $props();
	const { content, blocks, hasBlocks } = data;

	// Create page configuration for PageRenderer
	const pageConfig: PageConfiguration = $derived({
		slug: 'online-therapy',
		name: 'Онлайн-терапия',
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
	<section
		data-hero
		class="relative min-h-[30vh] overflow-hidden bg-cover bg-center text-gray-100"
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
				<h1 class="self-end font-circe text-3xl">{content.hero.title}</h1>
			</div>
			<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
				<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
					{content.hero.subtitle}
				</p>
				{#if content.hero.subtitleSecondary}
					<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
						{content.hero.subtitleSecondary}
					</p>
				{/if}
			</div>
		</div>

		<!-- Desktop layout -->
		<div
			class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 lg:grid lg:max-w-[960px]"
		>
			<!-- Title text -->
			<div class="col-start-1 col-end-12 row-start-5 row-end-12">
				<h1 class="font-circe text-3xl leading-tight lg:text-5xl">{content.hero.title}</h1>
			</div>

			<!-- Description text -->
			<div
				class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base leading-relaxed"
			>
				<p class="mx-auto text-center lg:mx-0 lg:text-left">
					{content.hero.subtitle}
				</p>
				{#if content.hero.subtitleSecondary}
					<p class="mx-auto text-center lg:mx-0 lg:text-left">
						{content.hero.subtitleSecondary}
					</p>
				{/if}
			</div>
		</div>
	</section>

	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
		<div class="grid grid-cols-1 gap-10 leading-relaxed">
			{#each content.blocks as block}
				<div class="col-span-full">
					<section class="flex flex-col items-start gap-2">
						<div class="subtitle">{block.title.toLowerCase()}</div>
						<div class="flex flex-col items-start gap-1">
							{#each block.data as item}
								<p>
									<MarkdownLink text={item} />
								</p>
							{/each}
						</div>
					</section>
				</div>
			{/each}

			<a
				class={cn(
					'text-center text-[#191919] max-w-[250px]',
					'font-light tracking-wide',
					'py-[10px] px-[30px]',
					'border border-solid rounded-[10px] border-black bg-opacity-0 block mx-auto',
					'transition-all duration-200 ease-out',
					'hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md hover:-translate-y-0.5',
					'active:transform active:scale-95'
				)}
				href={content.bookingLink || 'https://t.me/m/hSP1SM5sYjcy'}
				target="_blank"
				rel="noopener noreferrer"
			>
				ЗАПИСАТЬСЯ
			</a>
		</div>
	</div>
{/if}
