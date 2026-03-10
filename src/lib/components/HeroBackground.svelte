<script lang="ts">
	interface Props {
		alt?: string;
	}

	let { alt = 'Психолог Андрей Калмыков, фоновое изображение' }: Props = $props();
</script>

<!-- Background image using picture element for better performance -->
<picture class="pointer-events-none absolute inset-0 z-0">
	<source srcset="/upscalemedia-transformed.webp" media="(min-width: 1024px)" />
	<img
		src="/header.webp"
		{alt}
		class="h-full w-full object-cover"
		width="1200"
		height="630"
		loading="eager"
		fetchpriority="high"
		style="position: absolute; top: 0; left: 0;"
	/>
</picture>
