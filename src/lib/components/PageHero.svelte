<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description?: string | Snippet;
		maxWidth?: 'md' | 'lg' | 'xl';
	};

	let { title, description, maxWidth = 'lg' }: Props = $props();

	const maxWidthClasses = {
		md: 'lg:max-w-[760px]',
		lg: 'lg:max-w-[960px]',
		xl: 'lg:max-w-[1400px]'
	};
</script>

<section data-hero class="relative min-h-[30vh] overflow-hidden text-gray-100">
	<HeroBackground />

	<!-- Gradient overlay -->
	<div
		class="absolute z-0 h-full w-full bg-linear-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Unified layout -->
	<div
		class="relative z-10 mx-auto min-h-[100px] max-w-[720px] px-5 pt-[calc(63px+10vh)] pb-4
			{maxWidthClasses[maxWidth]} lg:grid lg:aspect-[1.51] lg:grid-cols-12 lg:grid-rows-12
			lg:gap-4 xl:px-0 lg:pt-14 lg:pb-0"
	>
		<!-- Title -->
		<div class="mb-4 lg:col-start-1 lg:col-end-12 lg:row-start-5 lg:row-end-12 lg:mb-0">
			<h1 class="flex flex-col gap-2 text-left">
				<span class="font-caveat  text-3xl lg:text-5xl lg:leading-tight">
					{title}
				</span>

				{#if typeof description === 'string'}
					<span class="text-base leading-relaxed font-normal opacity-80 md:text-lg">
						{description}
					</span>
				{/if}
			</h1>
		</div>
	</div>
</section>
