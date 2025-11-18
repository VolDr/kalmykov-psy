<script lang="ts">
	import { contacts } from '$lib/data/content';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
</script>

<svelte:head>
	<title>Процесс консультирования | Андрей Калмыков</title>
	<meta
		name="description"
		content="Условия и принципы работы с психологом. Правила сотрудничества для комфортного взаимодействия."
	/>
	<meta property="og:title" content="Процесс консультирования | Андрей Калмыков" />
	<meta
		property="og:description"
		content="Условия и принципы работы с психологом. Правила сотрудничества для комфортного взаимодействия."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/header.webp" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Процесс консультирования | Андрей Калмыков" />
	<meta
		name="twitter:description"
		content="Условия и принципы работы с психологом. Правила сотрудничества для комфортного взаимодействия."
	/>
	<meta name="twitter:image" content="/header.webp" />
</svelte:head>

<section
	data-hero
	class="relative min-h-[30vh] overflow-hidden bg-cover bg-center text-gray-100"
>
	<HeroBackground />
	<div
		class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
		<div
			class="relative z-10 mx-auto mt-[10vh] mb-4 min-h-[100px] max-w-[960px] pt-[63px] lg:hidden"
		>
			<h1 class="self-end font-circe text-3xl">Экстренная помощь</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или
				попали в угрожающую жизни ситуацию — срочно обратитесь за помощью за помощью в эти
				организации.
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[1200px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">Экстренная помощь</h1>
		</div>

		<div
			class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
				Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или
				попали в угрожающую жизни ситуацию — срочно обратитесь за помощью за помощью в эти
				организации.
			</p>
		</div>
	</div>
</section>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[1200px] lg:px-0">
	<div class="grid w-full grid-cols-1 gap-4  sm:grid-cols-2 lg:grid-cols-3 md:px-0">
		{#each contacts as group}
			<div class=" min-h-[220px]">
				<div class="flex h-full min-h-[180px] flex-col justify-end rounded-lg bg-[#F2F0EF] p-6">
					<!-- Заголовок карточки -->
					<div class="mb-4 flex items-center gap-3">
						<h2 class="text-[#191919]">{group.title}</h2>
					</div>
					<div class="mb-4 flex items-center gap-3 font-semibold">
						<a href={group.link}>{group.phone}</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
