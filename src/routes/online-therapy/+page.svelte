<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/online-therapy/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн страницы «Как строится работа» (макет «Перед началом работы»).
  · Header / Footer берутся из +layout.svelte (онлайн-терапия в layout НЕ скрыта) —
    поэтому здесь только контент страницы. PageHero больше не нужен.
  · Данные те же: onlineTherapyBlocks. 14 блоков сгруппированы в 5 разделов.
  · Клик по теме раскрывает её полный текст в правой колонке (master-detail),
    повторный клик возвращает краткую сводку раздела.
  · Требует токенов из app.css.additions.css (font-caveat, text-navy) —
    они уже добавлены при порте «верха».
  · Иконки — через iconify-плагин (icon-[lucide--…]), как в Header.svelte.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { onlineTherapyBlocks } from '$lib/data/online-therapy';
	import type { PageData } from './$types';
	import { formatRubles } from '$lib/pricing';
	let { data }: { data: PageData } = $props();
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { cubicOut } from 'svelte/easing';

	function panelEnter(node: Element, { duration = 300 }: { duration?: number } = {}) {
		return {
			duration,
			css: (t: number) => {
				const e = cubicOut(t);
				return `opacity:${e};transform:translateY(${(1 - e) * 10}px);filter:blur(${(1 - e) * 3}px)`;
			}
		};
	}

	// Цена берётся из таблицы тарифов; query-параметры её не меняют.
	const blocks = $derived(
		onlineTherapyBlocks.map((block) =>
			block.title === 'Оплата и стоимость'
				? { ...block, data: [`${formatRubles(data.prices.single)} за сессию.`, ...block.data] }
				: block
		)
	);
	// быстрый доступ к тексту блока по его заголовку
	const byTitle = $derived(Object.fromEntries(blocks.map((b) => [b.title, b.data])));

	// ── группировка в 5 разделов (label — что видит пользователь, key — заголовок блока) ──
	type Topic = { label: string; key: string };
	type Group = {
		num: string;
		icon: string;
		title: [string, string];
		summary: string;
		topics: Topic[];
	};

	const groups: Group[] = [
		{
			num: '01',
			icon: '/getting_started.webp',
			title: ['Начало работы', ''],
			summary:
				'Как сделать первый шаг, где и как проходят встречи и чего ожидать на первой сессии.',
			topics: [
				{ label: 'С чего начать', key: 'С чего начать' },
				{ label: 'Как записаться', key: 'Записаться на сессию' },
				{ label: 'Где проходит сессия', key: 'Где проходит сессия' },
				{ label: 'Что происходит на сессии', key: 'Что происходит на сессии' }
			]
		},
		{
			num: '02',
			icon: '/session_setup.webp',
			title: ['Организация встреч', ''],
			summary: 'Длительность и частота встреч, оплата, а также правила переноса и отмены сессий.',
			topics: [
				{ label: 'Длительность и частота встреч', key: 'Продолжительность сессии' },
				{ label: 'Оплата и стоимость', key: 'Оплата и стоимость' },
				{ label: 'Опоздания и переносы', key: 'Опоздания и переносы' },
				{ label: 'Отпуск', key: 'Отпуск' }
			]
		},
		{
			num: '03',
			icon: '/privacy.webp',
			title: ['Конфиденциальность', 'и безопасность'],
			summary:
				'Как я сохраняю конфиденциальность, поддерживаю нейтральность и следую этическим принципам в работе.',
			topics: [
				{ label: 'Конфиденциальность', key: 'Конфиденциальность' },
				{ label: 'Нейтральность и принятие', key: 'Нейтральность и принятие' },
				{ label: 'Этические принципы', key: 'Этические принципы' }
			]
		},
		{
			num: '04',
			icon: '/process.webp',
			title: ['Процесс терапии', ''],
			summary: 'О продолжительности терапиии и обратной связи.',
			topics: [
				{ label: 'Обратная связь', key: 'Обратная связь' },
				{ label: 'Длительность работы', key: 'Длительность работы' },

				{ label: 'Завершение терапии', key: 'Завершение работы' }
			]
		}
	];

	// выбранная тема в каждом разделе (null = показываем сводку)
	let selected = $state<(number | null)[]>(groups.map(() => null));

	function toggle(i: number, j: number) {
		selected[i] = selected[i] === j ? null : j;
	}
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

<!-- ═══════════════════ ГЕРОЙ ═══════════════════ -->
<section class="bg-background pt-24 lg:pt-32">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8 px-5 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.1fr_0.9fr] xl:px-0"
	>
		<Reveal width="full">
			<div class="flex flex-col">
				<span class="relative mb-5 inline-block w-fit">
					<span class="inline-block -rotate-[4deg] font-caveat text-[26px] font-bold text-primary"
						>важно знать</span
					>
				</span>
				<h1
					class="mb-8 font-caveat text-[52px] leading-[1.22] font-bold tracking-[1px] text-navy lg:text-[72px]"
				>
					Перед началом<br />работы
				</h1>
				<p class="max-w-[440px] text-lg leading-relaxed text-foreground/75 md:text-[19px]">
					Ниже описано, как устроена работа и правила, которые помогают нам сотрудничать.
				</p>
			</div>
		</Reveal>

		<!-- иллюстрация: ваза с веточкой -->
		<Reveal width="full">
			<div class="hidden min-h-[260px] items-center justify-center lg:flex lg:min-h-[320px]">
				<img src="/vaza.webp" alt="" class="h-auto w-full max-w-[380px]" aria-hidden="true" />
			</div>
		</Reveal>
	</div>
</section>

<!-- ═══════════════════ РАЗДЕЛЫ 01–05 ═══════════════════ -->
<section class="bg-background pt-8 pb-6">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		{#each groups as group, i}
			{@const sel = selected[i]}
			<Reveal width="full">
				<div
					class="grid grid-cols-[52px_1fr] gap-x-5 gap-y-5 py-10 lg:grid-cols-[54px_300px_1fr_2fr] lg:border-b lg:border-[#e4dccb] lg:py-11"
				>
					<!-- номер -->
					<div
						class="-mt-[10px] font-caveat text-[42px] leading-none font-bold text-primary lg:text-[54px]"
					>
						{group.num}
					</div>

					<!-- иконка + заголовок -->
					<div class="col-start-2 flex max-h-fit items-center gap-2 lg:col-start-auto">
						<img src={group.icon} alt="" class="h-9 w-9 shrink-0" aria-hidden="true" />
						<h2
							class="m-0 text-[19px] leading-[1.22] font-extrabold [overflow-wrap:break-word] [hyphens:auto] text-navy"
						>
							{group.title[0]}<br />{group.title[1]}
						</h2>
					</div>

					<!-- темы (кликабельные) -->
					<div class="col-span-2 flex flex-col lg:col-span-1">
						{#each group.topics as topic, j}
							<button
								type="button"
								onclick={() => toggle(i, j)}
								class="group flex w-full items-center justify-between gap-3 border-b border-[#e4dccb] px-0.5 py-3 text-left text-[16px] font-semibold transition-all duration-200 lg:text-[19px] {j ===
								0
									? 'border-t border-[#e4dccb]'
									: ''} {sel === j ? 'font-bold text-navy' : 'text-foreground/85 hover:text-navy'}"
							>
								<span>{topic.label}</span>
								<!-- десктоп: шеврон вправо; мобиль: шеврон вниз -->
								<span
									class="icon-[lucide--chevron-down] h-4 w-4 shrink-0 text-primary transition-all
										duration-200 lg:hidden
										{sel === j ? 'rotate-180' : ''}"
								></span>
								<span
									class="icon-[lucide--chevron-right] hidden h-4 w-4 shrink-0 text-primary transition-all duration-200 lg:block {sel ===
									j
										? 'translate-x-0 opacity-100'
										: '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}"
								></span>
							</button>

							<!-- мобиль: inline-контент под каждой темой -->
							{#if sel === j}
								<div
									class="border-b border-[#e4dccb] px-0.5 py-4 lg:hidden"
									in:panelEnter={{ duration: 150 }}
								>
									<div class="flex flex-col gap-2.5 text-[15px] leading-relaxed text-foreground/75">
										{#each byTitle[topic.key] ?? [] as para}
											<p><MarkdownLink text={para} /></p>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					</div>

					<!-- десктоп: правая панель со сводкой / текстом темы -->
					<div class="col-span-1 hidden pt-1 lg:block" style="min-height: 80px;">
						{#key sel}
							<div in:panelEnter={{ duration: 220 }}>
								{#if sel === null}
									<p class="text-[16px] leading-relaxed text-foreground/75">{group.summary}</p>
								{:else}
									<span class="mb-2.5 block text-[16px] font-extrabold text-navy"
										>{group.topics[sel].label}</span
									>
									<div class="flex flex-col gap-2.5 text-[15px] leading-relaxed text-foreground/75">
										{#each byTitle[group.topics[sel].key] ?? [] as para}
											<p><MarkdownLink text={para} /></p>
										{/each}
									</div>
								{/if}
							</div>
						{/key}
					</div>
				</div>
			</Reveal>
		{/each}

		<!-- ═══════════════════ ПЛАШКА ═══════════════════ -->
		<Reveal width="full">
			<div
				class="mt-8 grid grid-cols-1 items-center gap-7 rounded-[24px] bg-card px-8 py-8 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] lg:px-10"
			>
				<img src="/star_2.webp" class="h-10 w-10 shrink-0" alt="" aria-hidden="true" />
				<div class="max-w-[960px]">
					<p class="text-[17px] leading-relaxed font-medium text-foreground">
						Если у вас останутся вопросы после прочтения, я с радостью отвечу на них перед нашей
						первой встречей.
					</p>
					<p class="mt-3 text-[15px] leading-relaxed text-foreground/70">
						<a
							href="https://t.me/m/jyiUHHmIMzYy"
							target="_blank"
							rel="noopener noreferrer"
							class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition-colors hover:text-primary"
						>
							Напишите мне в телеграм
						</a>
						или
						<a
							href="/booking?acquaintance"
							class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition-colors hover:text-primary"
						>
							запишитесь на встречу-знакомство
						</a>.
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>
