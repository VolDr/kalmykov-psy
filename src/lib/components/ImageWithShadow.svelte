<script lang="ts">
	let {
		src,
		srcSmall,
		alt,
		shadowPosition = 'bottom-left',
		imgClass = ''
	}: {
		src: string;
		srcSmall?: string;
		alt: string;
		shadowPosition?: 'bottom-left' | 'bottom-right';
		imgClass?: string;
	} = $props();

	const shadowClasses =
		shadowPosition === 'bottom-left'
			? 'h-[80%] -bottom-3 left-3'
			: 'h-[73%] -bottom-3 right-3';

	const imgPositionClasses =
		shadowPosition === 'bottom-left' ? '-top-3 -left-4' : '-top-5 -right-3';
</script>

<div class="flex items-center justify-center mx-5 h-[360px] lg:h-auto lg:mx-0">
	<picture class="relative">
		<div class="w-full absolute bg-[#F2F0EF] z-0 rounded-xl {shadowClasses}"></div>
		<img
			loading="lazy"
			{src}
			srcset={srcSmall ? `${srcSmall} 640w, ${src} 1200w` : undefined}
			sizes={srcSmall ? '(max-width: 768px) 100vw, 50vw' : undefined}
			{alt}
			class="select-none pointer-events-none rounded-xl my-0 relative z-10 object-cover {imgPositionClasses} {imgClass}"
		/>
	</picture>
</div>
