<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
</script>

<section data-hero class="relative min-h-[30vh] overflow-hidden text-gray-100">
	<HeroBackground />

	<!-- Gradient overlay -->
	<div
		class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] px-4 px-5 lg:hidden lg:max-w-[960px] lg:px-0">
		<div
			class="relative z-10 mt-[10vh] mb-4 grid min-h-[100px] grid-cols-5 grid-rows-2 pt-[63px] lg:hidden"
		>
			<h1
				class="col-start-1 col-end-4 row-start-3 self-end font-[family-name:var(--font-circe)] text-3xl"
			>
				Психолог
			</h1>
			<h1 class="col-start-1 col-end-6 row-start-4 font-[family-name:var(--font-circe)] text-3xl">
				Андрей Калмыков
			</h1>
		</div>

		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left leading-relaxed">
				Превращаю тревогу в инструмент самопознания, а выгорание — в повод к пересмотру приоритетов.
			</p>
			<p class="row-end- col-start-1 col-end-6 row-start-6 text-left leading-relaxed">
				Подбираю методы помощи индивидуально, учитывая ваши особенности.
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[1400px] grid-cols-12 grid-rows-12 gap-4 pt-14 lg:grid"
	>
		<!-- Title text -->
		<div class="col-start-2 col-end-8 row-start-5 row-end-12">
			<h1 class="font-[family-name:var(--font-circe)] text-3xl leading-tight lg:text-5xl">
				Психолог<br />Андрей Калмыков
			</h1>
		</div>

		<!-- Description text -->
		<div
			class="lg:text-md col-start-2 col-end-7 row-start-8 row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center leading-relaxed lg:mx-0 lg:text-left">
				Превращаю тревогу в инструмент самопознания, а выгорание — в повод к пересмотру приоритетов.
			</p>
			<p class="mx-auto text-center leading-relaxed lg:mx-0 lg:text-left">
				Подбираю методы помощи индивидуально, учитывая ваши особенности.
			</p>
		</div>
	</div>
</section>
