<script lang="ts">
	import type { PageBlock } from '$lib/types/page-blocks';

	// Universal blocks
	import PageHero from './PageHero.svelte';
	import ImageTextBlock from './ImageTextBlock.svelte';
	import SectionContainer from './SectionContainer.svelte';
	import CardGrid from './CardGrid.svelte';
	import TextBlockSection from './TextBlockSection.svelte';
	import ListCard from './ListCard.svelte';
	import IconCard from './IconCard.svelte';
	import ContactCard from './ContactCard.svelte';
	import AboutIntroDual from './AboutIntroDual.svelte';

	// Unique blocks
	import Hero from '$lib/components/sections/Hero.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import Faq from '$lib/components/sections/Faq.svelte';
	import ConsultationInfo from '$lib/components/sections/ConsultationInfo.svelte';
	import AboutSection from '$lib/components/sections/AboutSection.svelte';
	import IssuesList from '$lib/components/sections/IssuesList.svelte';

	interface Props {
		block: PageBlock;
	}

	let { block }: Props = $props();
</script>

{#if !block.isActive}
	<!-- Skip inactive blocks -->
{:else if block.type === 'page-hero'}
	<div class={block.config.customClass}>
		<PageHero
			title={block.config.title}
			subtitle={block.config.subtitle}
			subtitleSecondary={block.config.subtitleSecondary}
			maxWidth={block.config.maxWidth}
			titleLineHeight={block.config.titleLineHeight}
			subtitleRowStart={block.config.subtitleRowStart}
		/>
	</div>
{:else if block.type === 'image-text'}
	<div class={block.config.customClass}>
		<ImageTextBlock
			image={block.config.image}
			layout={block.config.layout}
			paragraphs={block.config.paragraphs}
			withReveal={block.config.withReveal}
		/>
	</div>
{:else if block.type === 'section-container'}
	<div class={block.config.customClass}>
		<SectionContainer
			title={block.config.title}
			subtitle={block.config.subtitle}
			maxWidth={block.config.maxWidth}
			gap={block.config.gap}
			titleAlign={block.config.titleAlign}
			class={block.config.className}
		>
			{#each block.config.children as childBlock (childBlock.id)}
				<svelte:self block={childBlock} />
			{/each}
		</SectionContainer>
	</div>
{:else if block.type === 'card-grid'}
	<div class={block.config.customClass}>
		<CardGrid
			cols={block.config.cols}
			gap={block.config.gap}
			responsive={block.config.responsive}
			class={block.config.className}
		>
			{#each block.config.cards as card}
				{#if card.type === 'list-card'}
					<ListCard
						title={card.title}
						points={card.points}
						gridClass={card.gridClass}
						minHeight={card.minHeight}
						withReveal={card.withReveal}
						justify={card.justify}
					/>
				{:else if card.type === 'icon-card'}
					<IconCard
						icon={card.icon}
						highlight={card.highlight}
						text={card.text}
						gridClass={card.gridClass}
						minHeight={card.minHeight}
						withReveal={card.withReveal}
						showIcon={card.showIcon}
					/>
				{:else if card.type === 'contact-card'}
					<ContactCard
						title={card.title}
						phone={card.phone}
						link={card.link}
						minHeight={card.minHeight}
					/>
				{/if}
			{/each}
		</CardGrid>
	</div>
{:else if block.type === 'text-block-section'}
	<div class={block.config.customClass}>
		<TextBlockSection blocks={block.config.blocks} />
	</div>
{:else if block.type === 'home-hero'}
	<div class={block.config.customClass}>
		<Hero />
	</div>
{:else if block.type === 'education'}
	<div class={block.config.customClass}>
		<Education
			isOpen={block.config.isOpen}
			reveal={block.config.withReveal ?? false}
			groups={block.config.groups}
		/>
	</div>
{:else if block.type === 'faq'}
	<div class={block.config.customClass}>
		<Faq items={block.config.items} />
	</div>
{:else if block.type === 'consultation-info'}
	<div class={block.config.customClass}>
		<ConsultationInfo
			price={block.config.price}
			format={block.config.format}
			duration={block.config.duration}
		/>
	</div>
{:else if block.type === 'about-section'}
	<div class={block.config.customClass}>
		<AboutSection items={block.config.items} withReveal={block.config.withReveal ?? false} />
	</div>
{:else if block.type === 'issues-list'}
	<div class={block.config.customClass}>
		<IssuesList items={block.config.items} withReveal={block.config.withReveal ?? false} />
	</div>
{:else if block.type === 'about-intro-dual'}
	<div class={block.config.customClass}>
		<AboutIntroDual
			leftImage={block.config.leftImage}
			leftTexts={block.config.leftTexts}
			rightTexts={block.config.rightTexts}
			rightImage={block.config.rightImage}
			withReveal={block.config.withReveal}
		/>
	</div>
{:else}
	<div class="rounded border border-red-300 bg-red-50 p-4 text-red-600">
		Неизвестный тип блока: {block.type}
	</div>
{/if}
