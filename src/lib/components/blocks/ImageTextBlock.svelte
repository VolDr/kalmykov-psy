<script lang="ts">
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import type { Snippet } from 'svelte';

	interface ImageProps {
		src: string;
		srcSmall?: string;
		alt: string;
		imgClass?: string;
	}

	interface Props {
		image: ImageProps;
		layout?: 'image-left' | 'image-right';
		paragraphs?: string[];
		textContent?: Snippet;
		withReveal?: boolean;
	}

	let {
		image,
		layout = 'image-left',
		paragraphs = [],
		textContent,
		withReveal = false
	}: Props = $props();

	const shadowPosition = layout === 'image-left' ? 'bottom-left' : 'bottom-right';
</script>

<div
	class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
>
	{#if layout === 'image-left'}
		<!-- Image Left -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src={image.src}
				srcSmall={image.srcSmall}
				alt={image.alt}
				{shadowPosition}
				imgClass={image.imgClass || 'h-[320px] w-[285px] lg:h-[720px] lg:w-[505px]'}
			/>
		</div>

		<!-- Text Right -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8">
				{#if textContent}
					{@render textContent()}
				{:else if paragraphs.length > 0}
					{#if withReveal}
						<Reveal>
							<div
								class="container mx-auto flex flex-col flex-nowrap items-start justify-start gap-2 lg:gap-4"
							>
								{#each paragraphs as paragraph}
									<p>{paragraph}</p>
								{/each}
							</div>
						</Reveal>
					{:else}
						<div
							class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
						>
							{#each paragraphs as paragraph}
								<p>{paragraph}</p>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{:else}
		<!-- Text Left -->
		<div
			class="col-span-1 mx-5 flex flex-col gap-2.5 md:col-span-6 md:gap-3.5 lg:col-span-6 lg:mx-0"
		>
			{#if textContent}
				{@render textContent()}
			{:else if paragraphs.length > 0}
				<div
					class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
				>
					{#if withReveal}
						{#each paragraphs as paragraph}
							<Reveal>
								<p>{paragraph}</p>
							</Reveal>
						{/each}
					{:else}
						{#each paragraphs as paragraph}
							<p>{paragraph}</p>
						{/each}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Image Right -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src={image.src}
				srcSmall={image.srcSmall}
				alt={image.alt}
				{shadowPosition}
				imgClass={image.imgClass || 'h-[320px] w-[285px] lg:h-[720px] lg:w-[544px]'}
			/>
		</div>
	{/if}
</div>
