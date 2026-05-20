<script lang="ts">
	import { contacts } from '$lib/data/content';
	import PageHero from '$lib/components/PageHero.svelte';
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
	<meta property="og:url" content="{import.meta.env.VITE_URL}/sos" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Процесс консультирования | Андрей Калмыков" />
	<meta
		name="twitter:description"
		content="Условия и принципы работы с психологом. Правила сотрудничества для комфортного взаимодействия."
	/>
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />
</svelte:head>

<PageHero
	title="Экстренная помощь"
	description="Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или попали в угрожающую жизни ситуацию — срочно обратитесь за помощью в эти организации."
/>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] xl:px-0">
	<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:px-0 lg:grid-cols-3">
		{#each contacts as group}
			<div class=" min-h-[220px]">
				<div class="flex h-full min-h-[180px] flex-col justify-end rounded-lg bg-background p-6">
					<!-- Заголовок карточки -->
					<div class="mb-4 flex items-center gap-3">
						<h2 class="text-foreground">{group.title}</h2>
					</div>
					<div class="mb-4 flex items-center gap-3 font-semibold">
						<a href={group.link}>{group.phone}</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
