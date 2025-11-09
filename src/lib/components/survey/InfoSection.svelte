<script lang="ts">
	import { browser } from '$app/environment';
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import type { InfoSection } from '$lib/data/surveys/types';
	import { cn } from '$lib/utils';

	type Props = {
		section: InfoSection;
		sectionKey: string;
	};

	let { section, sectionKey }: Props = $props();

	const iconMap = {
		clock: 'icon-[lucide--clock]',
		lightbulb: 'icon-[lucide--lightbulb]',
		alert: 'icon-[lucide--alert-circle]',
		info: 'icon-[lucide--info]'
	};

	const typeStyles = {
		warning: 'bg-[#F2F0EF]',
		info: 'bg-[#F2F0EF]',
		alert: 'bg-[#F2F0EF]'
	};

	let isExpanded = $state(
		browser
			? localStorage.getItem(`survey-section-${sectionKey}`) === 'true'
			: section.expanded ?? false
	);

	$effect(() => {
		if (browser) {
			localStorage.setItem(`survey-section-${sectionKey}`, String(isExpanded));
		}
	});

	const iconClass = section.icon ? iconMap[section.icon as keyof typeof iconMap] : null;
	const styleClass = section.type ? typeStyles[section.type] : 'border-[#F2F0EF] bg-white';
</script>

<AccordionItem isOpen={isExpanded} class={cn(styleClass)}>
	{#snippet header()}
		<div class="flex items-center gap-3">
			{#if iconClass}
				<span class={cn(iconClass, 'w-5 h-5 text-[#191919] opacity-70 flex-shrink-0')}></span>
			{/if}
			<span class="text-base md:text-lg  text-[#191919]">{section.title}</span>
		</div>
	{/snippet}

	{#snippet children()}
		{#if typeof section.content === 'string'}
		<div class="space-y-4">
			<div class="text-sm md:text-base text-black opacity-80 leading-relaxed space-y-4">
				{#each section.content.split('\n\n') as paragraph}
					<p><MarkdownLink text={paragraph} /></p>
				{/each}
			</div>
		</div>
	{:else}
		<div class="space-y-3">
			{#if section.content.purpose}
				<p class="text-sm md:text-base font-medium text-[#191919]">
					{section.content.purpose}
				</p>
			{/if}
			{#if section.content.bullets}
				<ul class="space-y-2 text-sm md:text-base text-[#191919] opacity-80">
					{#each section.content.bullets as bullet}
						<li class="flex items-start gap-2">
							<span class="flex-shrink-0">—</span>
							<span>{bullet}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{/if}
	{/snippet}
</AccordionItem>
