<script lang="ts">
	import BookButton from '$lib/components/BookButton.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	// Пропсы остаются теми же
	const { format, duration, price }: { format: string; duration: string; price: string } = $props();
</script>

<div class="col-span-1 mx-5 flex flex-col items-center gap-8 md:col-span-12 lg:mx-0">
	<Reveal>
		<span class="subtitle">приходите за поддержкой</span>
	</Reveal>

	<Reveal class="flex w-full max-w-[600px] flex-col items-center">
		<h2 class="subtitle">стоимость и формат консультаций</h2>

		<div class=" flex flex-col items-center p-8 text-center">
			<ul class="mb-8 flex flex-col gap-3">
				<li class="flex items-center gap-3 text-gray-700">
					<span class="icon-[lucide--piggy-bank] h-5 w-5 text-[#B8A98A]"></span>
					<span>{price}</span>
				</li>
				<li class="flex items-center gap-3 text-gray-700">
					<span class="icon-[lucide--video] h-5 w-5 text-[#B8A98A]"></span>
					<span>{format}</span>
				</li>
				<li class="flex items-center gap-3 text-gray-700">
					<span class="icon-[lucide--clock] h-5 w-5 text-[#B8A98A]"></span>
					<span>{duration}</span>
				</li>
			</ul>

			<!-- 3. Кнопка CTA -->
			<BookButton />
		</div>
	</Reveal>
</div>
