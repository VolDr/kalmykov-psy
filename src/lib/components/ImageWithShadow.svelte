<script lang="ts">
	let {
		src,
		srcSmall,
		alt,
		shadowPosition = 'bottom-left',
		imgClass = '',
		width,
		height,
		shadowClass = ""
	}: {
		src: string;
		srcSmall?: string;
		alt: string;
		shadowPosition?: 'bottom-left' | 'bottom-right';
		imgClass?: string;
		shadowClass?: string;
		width?: number;
		height?: number;
	} = $props();

	const shadowClasses =
		shadowPosition === 'bottom-left' ? 'h-[80%] -bottom-3 left-3' : 'h-[73%] -bottom-3 right-3';

	const imgPositionClasses =
		shadowPosition === 'bottom-left' ? '-top-3 -left-4' : '-top-5 -right-3';
</script>

<div class="mx-5 flex h-[360px] items-center justify-center lg:mx-0 lg:h-auto">
	<picture class="relative">
		<div class="absolute z-0 w-full rounded-xl bg-[#F2F0EF] {shadowClasses} {shadowClass}"></div>
		<img
			loading="lazy"
			{src}
			srcset={srcSmall ? `${srcSmall} 640w, ${src} 1200w` : undefined}
			sizes={srcSmall ? '(max-width: 1023px) 285px, 1200px' : undefined}
			{alt}
			{width}
			{height}
			class="pointer-events-none relative z-10 my-0 rounded-xl object-cover select-none {imgPositionClasses} {imgClass}"
		/>
	</picture>
</div>
