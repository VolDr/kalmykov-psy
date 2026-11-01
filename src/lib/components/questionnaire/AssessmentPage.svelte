<script lang="ts">
	import { page } from '$app/state';
	import AssessmentMethodology from './AssessmentMethodology.svelte';
	import QuestionnaireAuthor from './QuestionnaireAuthor.svelte';
	import {
		questionnaireMethodology,
		type MethodologyPage,
		type QuestionnaireMethodologyKey
	} from '#lib/data/questionnaireMethodology.js';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description: string;
		time: string;
		questions: string;
		methodologyKey?: QuestionnaireMethodologyKey;
		children: Snippet;
	};

	let { title, description, time, questions, methodologyKey, children }: Props = $props();

	// Дата последней правки текстов опросников — для разметки schema.org.
	const updatedIso = '2026-10-22';

	const siteUrl = (import.meta.env.VITE_URL || 'https://kalmykov-psy.ru').replace(/\/+$/, '');
	const details = $derived<MethodologyPage | undefined>(
		methodologyKey ? questionnaireMethodology[methodologyKey] : undefined
	);

	const jsonLd = $derived.by(() => {
		if (!details) return '';
		const url = page.data.canonicalUrl ?? `${siteUrl}${page.url.pathname}`;
		const author = {
			'@type': 'Person',
			'@id': `${siteUrl}/info#person`,
			name: 'Андрей Калмыков',
			jobTitle: 'Психолог-консультант',
			url: `${siteUrl}/info`
		};
		return JSON.stringify([
			{
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				'@id': url,
				url,
				name: title,
				headline: details.title,
				description: details.intro,
				inLanguage: 'ru-RU',
				dateModified: updatedIso,
				author,
				isPartOf: { '@type': 'WebSite', name: 'Андрей Калмыков, психолог', url: `${siteUrl}/` },
				citation: details.sources.map((source) => ({
					'@type': 'CreativeWork',
					name: source.label,
					...(source.href ? { url: source.href } : {})
				}))
			},
			{
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Главная', item: `${siteUrl}/` },
					{
						'@type': 'ListItem',
						position: 2,
						name: 'Опросники',
						item: `${siteUrl}/questionnaires`
					},
					{ '@type': 'ListItem', position: 3, name: title, item: url }
				]
			}
		]).replace(/</g, '\\u003c');
	});
</script>

<svelte:head>
	{#if jsonLd}
		{@html `<script type="application/ld+json">${jsonLd}</script>`}
	{/if}
</svelte:head>

<section class="min-h-[100svh] bg-background px-4 pt-[82px] pb-8 md:px-5 md:pt-[120px] md:pb-12">
	<div class="mx-auto w-full max-w-[760px]">
		<header class="mb-3 md:mb-5">
			<h1
				class="font-caveat text-[34px] leading-[0.95] font-bold tracking-[0.3px] text-navy md:text-[44px]"
			>
				{title}
			</h1>
			<p
				class="mt-2 max-w-[680px] text-[14px] leading-[1.45] font-medium text-foreground/75 md:text-[16px]"
			>
				{description}
			</p>
			<div
				class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-foreground/55 md:text-[13px]"
			>
				<span>{time}</span>
				<span class="h-1 w-1 rounded-full bg-[#b7b19f]"></span>
				<span>{questions}</span>
			</div>
		</header>

		{@render children()}

		{#if details && methodologyKey}
			<AssessmentMethodology {details} />
			<QuestionnaireAuthor questionnaire={methodologyKey} />
		{/if}
	</div>
</section>
