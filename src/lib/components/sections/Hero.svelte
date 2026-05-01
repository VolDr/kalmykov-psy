<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import BookButton from '$lib/components/BookButton.svelte';
</script>

<section data-hero class="relative xl:min-h-[max(50vh,972px)] overflow-hidden text-gray-100">
	<HeroBackground />

	<div
		class="absolute z-0 h-full w-full bg-linear-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<div
		class="relative z-10 mx-auto min-h-60 max-w-[720px] px-5 pt-[calc(63px+10vh)] pb-4
			xl:grid xl:aspect-[1.51] xl:max-w-[1400px] xl:grid-cols-12 xl:grid-rows-12
			xl:gap-4 xl:px-0 xl:pt-14 xl:pb-0"
	>
		<div class="mb-4 xl:col-start-2 xl:col-end-8 xl:row-start-5 xl:row-end-12 xl:mb-0">
			<h1
				class="font-circe text-3xl
					xl:text-5xl xl:leading-tight"
			>
				Психолог <br />Андрей Калмыков
			</h1>
		</div>

		<div
			class="xl:text-md flex flex-col
				gap-2 xl:col-start-2 xl:col-end-7 xl:row-start-8 xl:row-end-12 xl:gap-4"
		>
			<p class="text-left leading-relaxed">
				Превращаю тревогу в инструмент самопознания, а выгорание — в повод к пересмотру приоритетов.
			</p>
			<p class="text-left leading-relaxed">
				Подбираю методы помощи индивидуально, учитывая ваши особенности.
			</p>

			<div class="mt-4 xl:mt-0">
				<BookButton margin="mx-0" />
			</div>
		</div>
	</div>
</section>