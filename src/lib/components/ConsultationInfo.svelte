<script lang="ts">
	import BookButton from './BookButton.svelte';
	import Reveal from './Reveal.svelte';

	let { format, duration, price }: { format: string; duration: string; price: string } = $props();
</script>

<div class="col-span-1 mx-5 lg:mx-0 md:col-span-12">
	<div class="flex flex-col flex-nowrap items-center justify-center gap-2.5 lg:gap-3.5">
		<Reveal>
			<div class="subtitle">приходите за поддержкой</div>
		</Reveal>
		<div
			class="max-w-[1140px] mx-auto my-0 min-h-[50px] pt-0 flex flex-col flex-nowrap items-center justify-center gap-2.5 lg:gap-3.5"
		>
			<Reveal>
				<p>{format}</p>
			</Reveal>
			<Reveal>
				<p>{duration}</p>
			</Reveal>
			<Reveal>
				<p>{price}</p>
			</Reveal>
		</div>
		<BookButton />
	</div>
</div>
