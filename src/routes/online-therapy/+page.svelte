<script lang="ts">
	import { onMount } from 'svelte';
	import { onlineTherapyBlocks } from '$lib/data/online-therapy';
	import type { PageData } from './$types';
	import { formatRubles } from '$lib/pricing';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	let { data }: { data: PageData } = $props();

	// Все формулировки берутся из действующей страницы. Меняется только представление.
	const blocks = $derived(
		onlineTherapyBlocks.map((block) =>
			block.title === 'Оплата и стоимость'
				? { ...block, data: [formatRubles(data.prices.single) + ' за сессию.', ...block.data] }
				: block
		)
	);
	const byTitle = $derived(Object.fromEntries(blocks.map((block) => [block.title, block.data])));

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

	// На мобильных устройствах разделы переключаются вкладками, без горизонтального скролла.
	let activeTab = $state(0);
	let activeSection = $state(0);

	function handleTabKeydown(event: KeyboardEvent, index: number) {
		const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (direction === 0 && event.key !== 'Home' && event.key !== 'End') return;
		event.preventDefault();
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? groups.length - 1
					: (index + direction + groups.length) % groups.length;
		activeTab = next;
		document.getElementById('consent-tab-' + next)?.focus();
	}

	onMount(() => {
		// Подсветка раздела в боковом содержании при прокрутке на широком экране.
		const updateActiveSection = () => {
			let current = 0;
			for (let index = 0; index < groups.length; index++) {
				const section = document.getElementById('consent-section-' + index);
				if (section && section.getBoundingClientRect().top <= 190) current = index;
			}
			activeSection = current;
		};
		updateActiveSection();
		window.addEventListener('scroll', updateActiveSection, { passive: true });
		window.addEventListener('resize', updateActiveSection);
		return () => {
			window.removeEventListener('scroll', updateActiveSection);
			window.removeEventListener('resize', updateActiveSection);
		};
	});
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

<!-- ═══════════════════ РАЗДЕЛЫ И СОДЕРЖАНИЕ ═══════════════════ -->
<section class="bg-background pt-8 pb-6">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		<div class="grid gap-8 pt-8 pb-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14 lg:pt-14 xl:gap-20">
			<!-- Десктоп: фиксированное содержание, текст разделов полностью раскрыт. -->
			<aside class="hidden lg:block" aria-label="Содержание">
				<div class="sticky top-28">
					<p class="mb-5 text-[12px] font-extrabold tracking-[0.13em] text-foreground/50 uppercase">
						Содержание
					</p>
					<nav aria-label="Разделы страницы" class="border-t border-[#e4dccb]">
						{#each groups as group, i}
							<a
								href={'#consent-section-' + i}
								onclick={() => (activeSection = i)}
								aria-current={activeSection === i ? 'location' : undefined}
								class="group flex items-center gap-3 border-b border-[#e4dccb] py-4 text-left text-[15px] leading-snug font-semibold transition-colors hover:text-primary {activeSection === i ? 'text-primary' : 'text-navy'}"
							>
								<span class="w-7 shrink-0 text-[14px] font-extrabold text-primary/75">{group.num}</span>
								<span class="min-w-0 flex-1">
									{group.title[0]}{#if group.title[1]} {group.title[1]}{/if}
								</span>
								<span class="icon-[lucide--chevron-right] h-4 w-4 shrink-0 transition-opacity {activeSection === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}"></span>
							</a>
						{/each}
					</nav>
				</div>
			</aside>

			<div class="min-w-0">
				<!-- Мобильная версия: горизонтальные вкладки, можно свайпать по строке. -->
				<div class="mb-7 lg:hidden">
					<div class="mb-3 text-[12px] font-extrabold tracking-[0.13em] text-foreground/50 uppercase">
						Разделы
					</div>
					<div class="-mx-5 flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-5 pb-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Разделы перед началом работы">
						{#each groups as group, i}
							<button
								type="button"
								id={'consent-tab-' + i}
								role="tab"
								aria-selected={activeTab === i}
								aria-controls={'consent-section-' + i}
								tabindex={activeTab === i ? 0 : -1}
								onclick={() => (activeTab = i)}
								onkeydown={(event) => handleTabKeydown(event, i)}
								class="relative flex shrink-0 snap-start items-center gap-2 whitespace-nowrap px-3 py-3 text-left text-[14px] leading-snug font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary {activeTab === i ? 'text-navy after:absolute after:right-3 after:bottom-0 after:left-3 after:h-[3px] after:rounded-full after:bg-primary' : 'text-foreground/55 hover:text-navy'}"
							>
								<span class="shrink-0 text-[12px] font-extrabold text-primary">{group.num}</span>
								<span class="shrink-0">
									{group.title[0]}{#if group.title[1]} {group.title[1]}{/if}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Десктоп: все разделы подряд. Мобильная версия: только выбранная вкладка. -->
				{#each groups as group, i}
					<section
						id={'consent-section-' + i}
						role="tabpanel"
						aria-labelledby={'consent-tab-' + i}
						class="scroll-mt-28 border-b border-[#e4dccb] pb-9 lg:mb-12 lg:pb-12 {activeTab === i ? 'block' : 'hidden lg:block'}"
					>
						<div class="mb-7 grid grid-cols-[44px_36px_minmax(0,1fr)] items-start gap-x-2.5 lg:mb-9 lg:grid-cols-[58px_44px_minmax(0,1fr)] lg:gap-x-3">
							<span class="font-caveat text-[38px] leading-none font-bold text-primary lg:text-[50px]">
								{group.num}
							</span>
							<img src={group.icon} alt="" class="mt-1 h-8 w-8 object-contain lg:h-9 lg:w-9" aria-hidden="true" />
							<div class="min-w-0">
								<h2 class="m-0 text-[22px] leading-tight font-extrabold text-navy lg:text-[28px]">
									{group.title[0]}{#if group.title[1]}<span class="block">{group.title[1]}</span>{/if}
								</h2>
								<p class="mt-3 max-w-[620px] text-[13px] leading-relaxed text-foreground/60 lg:text-[14px]">
									{group.summary}
								</p>
							</div>
						</div>

						<div class="lg:pl-[114px]">
							{#each group.topics as topic}
								<div class="border-t border-[#e4dccb] py-5 lg:py-6">
									<h3 class="mb-2 text-[17px] leading-snug font-extrabold text-navy lg:text-[19px]">
										{topic.label}
									</h3>
									<div class="flex max-w-[640px] flex-col gap-2.5 text-[15px] leading-[1.85] text-foreground/75 lg:text-[16px]">
										{#each byTitle[topic.key] ?? [] as para}
											<p><MarkdownLink text={para} /></p>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</div>

		<nav aria-label="Опросники для самонаблюдения" class="mt-2 border-t border-[#e4dccb] pt-8">
			<h2 class="text-[20px] font-extrabold text-navy lg:text-[24px]">Опросники для оценки состояния</h2>
			<p class="mt-3 max-w-[800px] text-[15px] leading-relaxed text-foreground/75">
				До консультации или в процессе работы можно использовать опросники для оценки выраженности симптомов.
				Доступны <a href="/questionnaires/bat12" class="font-semibold text-navy underline decoration-primary underline-offset-4 hover:text-primary">BAT-12 для признаков выгорания</a>,
				<a href="/questionnaires/gad7" class="font-semibold text-navy underline decoration-primary underline-offset-4 hover:text-primary">GAD-7 для тревожных симптомов</a> и
				<a href="/questionnaires/phq9" class="font-semibold text-navy underline decoration-primary underline-offset-4 hover:text-primary">PHQ-9 для депрессивных симптомов</a>.
				Это не способ поставить диагноз самостоятельно.
			</p>
		</nav>

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
