<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
</script>

<section data-hero class="relative min-h-[50vh] overflow-hidden text-gray-100">
	<HeroBackground />

	<!-- Gradient overlay -->
	<div
		class="absolute z-0 h-full w-full bg-linear-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Unified layout -->
	<div
		class="relative z-10 mx-auto min-h-60 max-w-[720px] px-5 pt-[calc(63px+10vh)] pb-4
			lg:grid lg:aspect-[1.51] lg:max-w-[1400px] lg:grid-cols-12 lg:grid-rows-12
			lg:gap-4 lg:px-0 lg:pt-14 lg:pb-0"
	>
		<!-- Title -->
		<div class="mb-4 lg:col-start-2 lg:col-end-8 lg:row-start-5 lg:row-end-12 lg:mb-0">
			<h1
				class="font-circe text-3xl
					lg:text-5xl lg:leading-tight"
			>
				Психолог <br />Андрей Калмыков
			</h1>
		</div>

		<!-- Description -->
		<div
			class="lg:text-md flex flex-col
				gap-2 lg:col-start-2 lg:col-end-7 lg:row-start-8 lg:row-end-11 lg:gap-4"
		>
			<p class="text-left leading-relaxed">
				Превращаю тревогу в инструмент самопознания, а выгорание — в повод к пересмотру приоритетов.
			</p>
			<p class="text-left leading-relaxed">
				Подбираю методы помощи индивидуально, учитывая ваши особенности.
			</p>
		</div>
	</div>
</section>
