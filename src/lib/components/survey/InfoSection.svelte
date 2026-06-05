<!--
  Заменяет: src/lib/components/survey/InfoSection.svelte
  Дизайн: для type === 'warning' — статичная плашка с пунктирной золотой рамкой,
  звездой/сердечком и золотым заголовком (как в макете BAT-4).
  Остальные типы остаются раскрывающимися (AccordionItem) как раньше.
-->
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
		warning: 'bg-background',
		info: 'bg-background',
		alert: 'bg-background'
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
	const styleClass = section.type ? typeStyles[section.type] : 'border-background bg-white';

	const paragraphs = $derived(
		typeof section.content === 'string' ? section.content.split('\n\n') : []
	);
</script>

{#if section.type === 'warning'}
	<!-- Плашка «Важно» — пунктирная рамка -->
	<div
		class="grid grid-cols-1 items-start gap-6 rounded-[26px] border-2 border-dashed border-primary px-6 py-7 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] lg:gap-9 lg:px-9 lg:py-8"
		role="note"
	>
		<svg
			class="mt-1 hidden shrink-0 text-primary sm:block"
			width="44"
			height="44"
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M24 4 C25.5 17 31 22.5 44 24 C31 25.5 25.5 31 24 44 C22.5 31 17 25.5 4 24 C17 22.5 22.5 17 24 4 Z"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linejoin="round"
			/>
		</svg>

		<div class="space-y-2">
			<p class="text-[18px] font-bold text-primary">{section.title}</p>
			{#if typeof section.content === 'string'}
				<div class="space-y-2.5 text-[16px] leading-[1.65] text-foreground">
					{#each paragraphs as paragraph}
						<p><MarkdownLink text={paragraph} /></p>
					{/each}
				</div>
			{/if}
		</div>

		<svg
			class="mt-1 hidden shrink-0 text-primary lg:block"
			width="44"
			height="40"
			viewBox="0 0 48 44"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M24 39 C7 27 3.5 16.5 9 9.5 C13.5 3.8 21.5 5.2 24 12 C26.7 5 34.5 4.2 39 10.3 C44 17.2 39.5 27.6 24 39 Z"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
{:else}
	<AccordionItem isOpen={isExpanded} class={cn(styleClass)}>
		{#snippet header()}
			<div class="flex items-center gap-3">
				{#if iconClass}
					<span class={cn(iconClass, 'h-5 w-5 flex-shrink-0 text-foreground opacity-70')}></span>
				{/if}
				<h4 class="text-base text-foreground md:text-lg">{section.title}</h4>
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
						<p class="text-sm font-medium text-foreground md:text-base">
							{section.content.purpose}
						</p>
					{/if}
					{#if section.content.bullets}
						<ul class="space-y-2 text-sm text-foreground opacity-80 md:text-base">
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
{/if}
