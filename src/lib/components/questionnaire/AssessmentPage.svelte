<script lang="ts">
	import AssessmentMethodology from './AssessmentMethodology.svelte';
	import { questionnaireMethodology, type QuestionnaireMethodologyKey } from '$lib/data/questionnaireMethodology';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description: string;
		time: string;
		questions: string;
		methodologyKey?: QuestionnaireMethodologyKey;
		children: Snippet;
	};

	let {
		title,
		description,
		time,
		questions,
		methodologyKey,
		children
	}: Props = $props();
</script>

<section class="min-h-[100svh] bg-background px-4 pt-[82px] pb-8 md:px-5 md:pt-[120px] md:pb-12">
	<div class="mx-auto w-full max-w-[760px]">
		<header class="mb-8 md:mb-10">
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

		{#if methodologyKey}
			<AssessmentMethodology details={questionnaireMethodology[methodologyKey]} />
		{/if}
	</div>
</section>
