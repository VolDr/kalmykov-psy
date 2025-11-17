<script lang="ts">
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	interface ImageProps {
		src: string;
		srcSmall?: string;
		alt: string;
		width?: number;
		height?: number;
		imgClass?: string;
	}

	interface Props {
		leftImage: ImageProps;
		leftTexts: string[];
		rightTexts: string[];
		rightImage: ImageProps;
		withReveal?: boolean;
	}

	let { leftImage, leftTexts, rightTexts, rightImage, withReveal = false }: Props = $props();
</script>

<div class="relative mt-8 flex w-full flex-col gap-8.5 overflow-x-hidden md:gap-10.5 lg:mt-0">
	<!-- First block: Left image + Text -->
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
	>
		<!-- Image Left -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src={leftImage.src}
				srcSmall={leftImage.srcSmall}
				alt={leftImage.alt}
				shadowPosition="bottom-left"
				imgClass={leftImage.imgClass || 'h-[320px] w-[285px] lg:h-[720px] lg:w-[505px]'}
			/>
		</div>

		<!-- Text Right -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8">
				{#if withReveal}
					<Reveal>
						<div
							class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
						>
							{#each leftTexts as paragraph}
								<p>{paragraph}</p>
							{/each}
						</div>
					</Reveal>
				{:else}
					<div
						class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
					>
						{#each leftTexts as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Second block: Text + Right image -->
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
	>
		<!-- Text Left -->
		<div
			class="col-span-1 mx-5 flex flex-col gap-2.5 md:col-span-6 md:gap-3.5 lg:col-span-6 lg:mx-0"
		>
			<div
				class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
			>
				{#if withReveal}
					{#each rightTexts as paragraph}
						<Reveal>
							<p>{paragraph}</p>
						</Reveal>
					{/each}
				{:else}
					{#each rightTexts as paragraph}
						<p>{paragraph}</p>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Image Right -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src={rightImage.src}
				srcSmall={rightImage.srcSmall}
				alt={rightImage.alt}
				shadowPosition="bottom-right"
				imgClass={rightImage.imgClass || 'h-[320px] w-[285px] lg:h-[720px] lg:w-[544px]'}
			/>
		</div>
	</div>
</div>
