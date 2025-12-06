<script lang="ts">
	import { cn } from '$lib/utils';
	import { onlineTherapyBlocks, type BlockProps } from '$lib/data/online-therapy';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import { page } from '$app/state';

	// Модификации блоков для разных источников
	const priceOverrides: Record<string, string[]> = {
		avito: ['3000₽ за сессию первые три сессии, далее 5000₽.']
	};

	function getModifiedBlocks(source: string | null): BlockProps[] {
		if (!source || !priceOverrides[source]) {
			return onlineTherapyBlocks;
		}

		return onlineTherapyBlocks.map((block) => {
			if (block.title === 'Оплата и стоимость') {
				const override = priceOverrides[source];
				return {
					...block,
					data: [...override, ...block.data.slice(1)]
				};
			}
			return block;
		});
	}

	// Получаем источник из query параметров (например, ?avito или ?special)
	const source = $derived(page.url.searchParams.keys().next().value ?? null);
	const blocks = $derived(getModifiedBlocks(source));
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
	<meta property="og:url" content="{import.meta.env.VITE_URL}/online-therapy" />
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

<PageHero title="Как мы будем работать" maxWidth="md">
	{#snippet description()}
		<p class="leading-relaxed">
			Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями,
			чувствами и поведением для достижения желаемых изменений.
		</p>
		<p class="leading-relaxed">
			Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.
		</p>
	{/snippet}
</PageHero>

<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
	<div class="grid grid-cols-1 gap-10 leading-relaxed">
		{#each blocks as block}
			<div class="col-span-full">
				<section class="flex flex-col items-start gap-2">
					<h2 class="subtitle">{block.title.toLowerCase()}</h2>
					<div class="flex flex-col items-start gap-1">
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
				'max-w-[250px] text-center text-[#191919]',
				'font-light tracking-wide',
				'px-[30px] py-2.5',
				'bg-opacity-0 mx-auto block rounded-[10px] border border-solid border-black',
				'transition-all duration-200 ease-out',
				'hover:-translate-y-0.5 hover:border-[#cfc1a3] hover:bg-[#cfc1a3] hover:text-white hover:shadow-md',
				'active:scale-95 active:transform'
			)}
			href="https://t.me/m/hSP1SM5sYjcy"
			target="_blank"
			rel="noopener noreferrer"
		>
			ЗАПИСАТЬСЯ
		</a>
	</div>
</div>
