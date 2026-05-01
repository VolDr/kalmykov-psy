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
		warning: 'bg-[#f7f5f0]',
		info: 'bg-[#f7f5f0]',
		alert: 'bg-[#f7f5f0]'
	};

	let isExpanded = $state(
		browser
			? localStorage.getItem(`survey-section-${sectionKey}`) === 'true'
			: (section.expanded ?? false)
	);

	$effect(() => {
		if (browser) {
			localStorage.setItem(`survey-section-${sectionKey}`, String(isExpanded));
		}
	});

	const iconClass = section.icon ? iconMap[section.icon as keyof typeof iconMap] : null;
	const styleClass = section.type ? typeStyles[section.type] : 'border-[#f7f5f0] bg-white';
</script>

<AccordionItem isOpen={isExpanded} class={cn(styleClass)}>
	{#snippet header()}
		<div class="flex items-center gap-3">
			{#if iconClass}
				<span class={cn(iconClass, 'h-5 w-5 flex-shrink-0 text-[#191919] opacity-70')}></span>
			{/if}
			<h4 class="text-base text-[#191919] md:text-lg">{section.title}</h4>
		</div>
	{/snippet}

	{#snippet children()}
		{#if typeof section.content === 'string'}
			<div class="space-y-4">
				<div class="space-y-4 text-sm leading-relaxed text-black opacity-80 md:text-base">
					{#each section.content.split('\n\n') as paragraph}
						<p><MarkdownLink text={paragraph} /></p>
					{/each}
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				{#if section.content.purpose}
					<p class="text-sm font-medium text-[#191919] md:text-base">
						{section.content.purpose}
					</p>
				{/if}
				{#if section.content.bullets}
					<ul class="space-y-2 text-sm text-[#191919] opacity-80 md:text-base">
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
