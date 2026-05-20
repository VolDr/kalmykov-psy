<script lang="ts">
	// 1. Импортируем хранилище page
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';

	const is404 = page.status === 404;
	const is5xx = page.status >= 500;

	const title = is404
		? 'Страница не найдена'
		: is5xx
			? 'Что-то сломалось'
			: `Ошибка ${page.status}`;

	const headline = is404 ? '404' : String(page.status);

	const message = is404
		? 'Такой страницы нет!'
		: is5xx
			? 'На нашей стороне что-то пошло не так. Мы уже чиним.'
			: page.error?.message || 'Непредвиденная ошибка';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-10 px-4 text-center">
	{#if is5xx}
		<span class="icon-[lucide--cloud-off] h-8 w-8 text-primary"></span>
	{/if}
	{#if !is5xx}
		<span class="icon-[lucide--compass] h-8 w-8 text-primary"></span>
	{/if}
	<h1 class="select-none">{title}</h1>

	<p class="max-w-md text-lg leading-relaxed">
		{message}
	</p>

	<div class="flex items-center gap-3">
		<Button href="/" rel="noopener noreferrer" class="max-w-[250px]">На главную</Button>

		{#if is5xx}
			<button
				onclick={() => location.reload()}
				class="bg-opacity-0 inline-block cursor-pointer rounded-[10px] border border-solid border-black px-[30px] py-[10px] text-center font-light tracking-wide text-black transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary-light hover:bg-primary-light hover:text-white hover:shadow-md active:scale-95 active:transform"
			>
				Попробовать ещё раз
			</button>
		{/if}
	</div>
</div>
