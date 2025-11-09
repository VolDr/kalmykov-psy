<script lang="ts">
	import { cn } from '$lib/utils';
	import { onlineTherapyBlocks } from '$lib/data/online-therapy';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
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
	class="relative text-gray-100 overflow-hidden bg-cover bg-center bg-[url('/header.webp')] lg:bg-[url('/upscalemedia-transformed.webp')] min-h-[30vh]"
>
	<div
		class="absolute w-full h-full z-0 bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>
	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] lg:max-w-[960px] px-5 lg:px-0">
		<div class="pt-[63px] lg:hidden z-10 relative min-h-[100px] mb-4 mt-[10vh] max-w-[960px] mx-auto">
			<h1 class="text-3xl font-circe self-end">Как мы будем работать</h1>
		</div>
		<div class="lg:hidden z-10 relative -mt-2 mb-5 flex flex-col gap-2">
			<p class="row-start-5 row-end-7 col-start-1 col-end-6 text-left">
				Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями,
				чувствами и поведением для достижения желаемых изменений.
			</p>
			<p class="row-start-5 row-end-7 col-start-1 col-end-6 text-left">
				Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="hidden lg:grid grid-cols-12 grid-rows-12 gap-4 max-w-[720px] lg:max-w-[960px] gap-x-0 mx-auto z-10 pt-14 relative aspect-[1.51]"
	>
		<!-- Title text -->
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="text-3xl lg:text-5xl leading-tight font-circe">Как мы будем работать</h1>
		</div>

		<!-- Description text -->
		<div
			class="col-start-1 col-end-12 text-base lg:text-md row-start-8 row-end-11 flex flex-col gap-4  leading-relaxed"
		>
			<p class="mx-auto lg:mx-0 text-center lg:text-left">
				Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями,
				чувствами и поведением для достижения желаемых изменений.
			</p>
			<p class="mx-auto lg:mx-0 text-center lg:text-left">
				Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.
			</p>
		</div>
	</div>
</section>

<div class="container mx-auto mt-10 max-w-[720px] lg:max-w-[960px] px-5 lg:px-0">
	<div class="grid grid-cols-1 gap-10 leading-relaxed">
		{#each onlineTherapyBlocks as block}
			<div class="col-span-full">
				<section class="flex flex-col gap-2 items-start">
					<div class="subtitle">{block.title.toLowerCase()}</div>
					<div class="flex flex-col gap-1 items-start">
						{#each block.data as item}
							<p>
								<MarkdownLink text={item} />
							</p>
						{/each}
					</div>
				</section>
			</div>
		{/each}

		<a
			class={cn(
				'text-center text-[#191919] max-w-[250px]',
				'font-light tracking-wide',
				'py-[10px] px-[30px]',
				'border border-solid rounded-[10px] border-black bg-opacity-0 block mx-auto',
				'transition-all duration-200 ease-out',
				'hover:bg-[#cfc1a3] hover:border-[#cfc1a3] hover:text-white hover:shadow-md hover:-translate-y-0.5',
				'active:transform active:scale-95'
			)}
			href="https://t.me/m/hSP1SM5sYjcy"
			target="_blank"
			rel="noopener noreferrer"
		>
			ЗАПИСАТЬСЯ
		</a>
	</div>
</div>
