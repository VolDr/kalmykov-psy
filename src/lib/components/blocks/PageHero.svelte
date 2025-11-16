<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';

	interface Props {
		title: string;
		subtitle: string;
		subtitleSecondary?: string;
		maxWidth?: 'sm' | 'md' | 'lg';
		titleLineHeight?: 'tight' | 'relaxed';
		subtitleRowStart?: '8' | '9';
	}

	let {
		title,
		subtitle,
		subtitleSecondary = '',
		maxWidth = 'lg',
		titleLineHeight = 'relaxed',
		subtitleRowStart = '8'
	}: Props = $props();

	const maxWidthClasses = {
		sm: 'lg:max-w-[960px]',
		md: 'lg:max-w-[1200px]',
		lg: 'lg:max-w-[1200px]'
	};

	const titleLineHeightClass = titleLineHeight === 'tight' ? 'leading-tight' : 'leading-relaxed';

	const subtitleRowClass = subtitleRowStart === '9' ? 'row-start-9' : 'row-start-8';
</script>

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
			<h1 class="self-end font-circe text-3xl">{title}</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				{subtitle}
			</p>
			{#if subtitleSecondary}
				<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
					{subtitleSecondary}
				</p>
			{/if}
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid {maxWidthClasses[
			maxWidth
		]}"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl {titleLineHeightClass} lg:text-5xl">
				{title}
			</h1>
		</div>

		<div
			class="lg:text-md col-start-1 col-end-12 {subtitleRowClass} row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
				{subtitle}
			</p>
			{#if subtitleSecondary}
				<p class="mx-auto text-center lg:mx-0 lg:text-left">
					{subtitleSecondary}
				</p>
			{/if}
		</div>
	</div>
</section>
