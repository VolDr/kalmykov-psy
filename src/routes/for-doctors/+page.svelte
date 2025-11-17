<script lang="ts">
	import type { PageData } from './$types';
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import PageRenderer from '$lib/components/blocks/PageRenderer.svelte';
	import type { PageConfiguration } from '$lib/types/page-blocks';

	let { data }: { data: PageData } = $props();
	const { content, blocks, layout, hasBlocks } = data;

	// Create page configuration for PageRenderer
	const pageConfig: PageConfiguration = $derived({
		slug: 'for-doctors',
		name: 'Для врачей',
		seo: content.seo,
		layout: layout,
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
	<section data-hero class="relative min-h-[30vh] overflow-hidden bg-cover bg-center text-gray-100">
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
			</div>
		</div>

		<!-- Desktop layout -->
		<div
			class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[1200px]"
		>
			<div class="col-start-1 col-end-12 row-start-5 row-end-12">
				<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">
					{content.hero.title}
				</h1>
			</div>

			<div
				class="lg:text-md col-start-1 col-end-12 row-start-9 row-end-11 flex flex-col gap-4 text-base"
			>
				<p class="mx-auto text-center lg:mx-0 lg:text-left">
					{content.hero.subtitle}
				</p>
			</div>
		</div>
	</section>

	<div class="relative mt-8 flex w-full flex-col gap-8.5 overflow-x-hidden md:gap-10.5 lg:mt-0">
		<!-- Hero: мотивация сотрудничества -->
		<div
			class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
		>
			<!-- Image 1 -->
			<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
				<ImageWithShadow
					src="/1.webp"
					srcSmall="/1_small.webp"
					alt="Андрей"
					shadowPosition="bottom-left"
					imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
				/>
			</div>

			<!-- Text 1: мотивация -->
			<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
				<div
					class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8"
				>
					<div
						class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
					>
						{#each content.aboutText as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div
			class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
		>
			<h3 class="px-6 text-center subtitle md:px-0 md:text-left">
				{content.problemsSection.title}
			</h3>

			<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24">
				{#each content.problemsSection.items as item}
					<div class={item.gridClass}>
						<div
							class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6"
						>
							<div>
								<h4 class="text-lg font-semibold text-[#191919]">{item.highlight}</h4>
							</div>
							<p class="leading-relaxed text-[#191919]">{item.text}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="m-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
		>
			<h3 class="px-6 text-center subtitle md:px-0 md:text-left">
				{content.requestsSection.title}
			</h3>
			<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
				{#each content.requestsSection.items as group}
					<div class="{group.gridClass} min-h-[220px]">
						<div
							class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6"
						>
							<!-- Заголовок карточки -->
							<div class="mb-4 flex items-center gap-3">
								<h4 class="text-lg font-semibold text-[#191919]">{group.theme}</h4>
							</div>

							<!-- Список пунктов -->
							<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
								{#each group.points as point}
									<li class="flex items-center gap-3">
										<span class="flex-shrink-0">—</span>
										<div>
											<div class="reveal-root w-fit">
												<p>{point}</p>
											</div>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- С чем я не работаю -->
		<div
			class="mx-auto mt-6 flex max-w-[720px] flex-col items-center gap-6 md:max-w-[960px] lg:max-w-[1200px]"
		>
			<h3 class="subtitle">с чем я не работаю</h3>

			<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-1 md:px-0">
				<div
					class="w-full max-w-[720px] rounded-lg bg-[#F2F0EF] px-5 py-6 md:max-w-[960px] md:px-8 md:py-8 lg:max-w-[600px]"
				>
					<ul class="flex flex-col gap-2.5">
						{#each content.exclusions as exclusion}
							<li>— {exclusion}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<!-- Образование (как в примере) -->
		<div
			class="col-span-1 mx-auto mt-8 flex w-full max-w-[720px] flex-col items-stretch gap-2.5 px-5 md:col-span-1 md:max-w-[960px] md:gap-3.5 lg:max-w-[1200px]"
		>
			<div class="w-full">
				<Education reveal={false} />
			</div>

			<!-- Контакты для связи -->
			<div class="mt-6 mb-10 flex w-full flex-col items-center gap-2.5 md:gap-3.5">
				<h3 class="subtitle">как со мной связаться</h3>

				<div
					class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-lg bg-[#F2F0EF] px-6 py-6 md:px-8 md:py-8"
				>
					<div class="flex flex-col gap-3">
						{content.contact.text}
						<p>{content.contact.subtext}</p>
					</div>

					<ul class="flex flex-col gap-3">
						<li class="flex items-center gap-3">
							<span class="icon-[lucide--phone] h-5 w-5 text-[#B8A98A]"></span>
							<span>
								<MarkdownLink text={`[${content.contact.phone}](${content.contact.phoneLink})`} />
							</span>
						</li>
						<li class="flex items-center gap-3">
							<span class="icon-[lucide--message-circle] h-5 w-5 text-[#B8A98A]"></span>
							<span>
								<MarkdownLink
									text={`[${content.contact.telegram}](${content.contact.telegramLink})`}
								/>
							</span>
						</li>
						<MarkdownLink
							text={`[Условия работы для клиентов](${content.contact.conditionsLink})`}
						/>
					</ul>
				</div>
			</div>
		</div>
	</div>
{/if}
