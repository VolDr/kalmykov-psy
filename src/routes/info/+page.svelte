<!--
  ════════════════════════════════════════════════════════════════
  НОВАЯ СТРАНИЦА:  src/routes/info/+page.svelte
  ────────────────────────────────────────────────────────────────
  Короткая «визитка» на основе главной (MainGridNew). Собрана из уже
  существующих кусков, без новой прозы:
    1. Кто я        — сжатый герой из #about + бейдж/дудлы из героя.
    2. С чем работаю — компактные карточки тем (выгорание/тревога/…).
    3. Дипломы      — переиспользуем готовый <EducationNew /> («Где я
                       учился»): тот же educationGroups + DiplomaModal.
    4. Стоимость    — те же две карточки тарифов, что и в #pricing.

  Токены: font-caveat · text-navy · bg-card · bg-lilac · text-lilac-foreground
  (app.css.additions.css). Иконки — icon-[lucide--…]. Фото — заглушка-бубль,
  подставьте <ImageWithShadow src="/2.webp" …> как в #about.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import EducationNew from '$lib/components/sections/EducationNew.svelte';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import TextSvg from '$lib/components/ui/TextSvg.svelte';
	import { reachGoal } from '$lib/metrika';
	import { fade, slide } from 'svelte/transition';

	const siteUrl = import.meta.env.VITE_URL || 'https://kalmykov-psy.ru';
	const pageUrl = `${siteUrl}/info`;
	const personJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		name: 'Андрей Калмыков — психолог',
		url: pageUrl,
		mainEntity: {
			'@type': 'Person',
			'@id': `${pageUrl}#person`,
			name: 'Андрей Калмыков',
			url: pageUrl,
			image: `${siteUrl}/main.webp`,
			jobTitle: 'Психолог',
			knowsAbout: [
				'Профессиональное выгорание',
				'Прокрастинация',
				'Тревога',
				'Депрессия',
				'Когнитивно-поведенческая терапия',
				'Терапия принятия и ответственности'
			],
			sameAs: ['https://www.b17.ru/kalmykov_andrei/', 'https://t.me/kalmykov_psy']
		}
	}).replace(/</g, '\\u003c');

	let openFaq = $state<Record<number, boolean>>({});
	let isIntroModalOpen = $state(false);

	let modalOpenedAt = $state<number | null>(null);

	$effect(() => {
		if (isIntroModalOpen) modalOpenedAt = Date.now();
	});

	function handleModalClose(source: 'backdrop' | 'button' | 'esc') {
		const timeSpent = modalOpenedAt ? Math.round((Date.now() - modalOpenedAt) / 1000) : 0;
		reachGoal('modal_closed_without_action', { source, time_spent: timeSpent });
		isIntroModalOpen = false;
	}
	const steps = [
		{
			n: '01',
			title: 'Знакомство и запрос',
			time: '~50 мин',
			desc: 'Вы рассказываете, что происходит — я внимательно слушаю, уточняю детали, иногда переспрашиваю. Сначала разбираемся с тем, что конкретно не так и как долго это длится. Потом — что этому способствует и почему само не проходит. И в конце — чего вы хотите от встреч и как поймёте, что стало лучше.'
		},
		{
			n: '02',
			title: 'Разбор ситуации на детали',
			time: '1–2 сессии',
			desc: 'Разбираем контекст подробнее: что влияет на ситуацию, как она устроена изнутри. После этого формулируем цель на терапию — конкретную и измеримую.'
		},
		{
			n: '03',
			title: 'Работа с мышлением и поведением',
			time: 'основной блок',
			desc: 'Работаем с убеждениями, которые поддерживают проблему. Вводим поведенческие изменения — небольшими шагами, которые реально вписать в вашу жизнь. При необходимости — осваиваем конкретные навыки.'
		},
		{
			n: '04',
			title: 'Трекинг прогресса',
			time: 'на протяжении всей работы',
			desc: 'Прозрачная система отслеживания изменений. Вы всегда видите, что меняется — и мы вовремя корректируем курс. Не застреваем в терапии без ориентиров.'
		},
		{
			n: '05',
			title: 'Финал: вы сами себе психолог',
			time: '',
			desc: 'Конечная цель — вы больше не нуждаетесь в терапии. Вы понимаете, что с вами происходит, знаете что делать и не возвращаетесь в ту же яму снова.'
		}
	];
	const problems = [
		{
			icon: 'icon-[lucide--zap]',
			title: 'работа и самореализация',
			items: [
				'Выгорание и хроническая усталость',
				'Прокрастинация',
				'Перфекционизм и синдром самозванца',
				'Потеря мотивации',
				'Карьерные кризисы',
				'Сложности с балансом между работой и жизнью'
			]
		},
		{
			icon: 'icon-[lucide--orbit]',
			title: 'тревога, депрессия и эмоциональное состояние',
			items: [
				'Постоянная тревога и беспокойство',
				'Панические атаки',
				'Навязчивые мысли и руминации',
				'Эмоциональное истощение',
				'Депрессия и сниженное настроение',
				'Потеря интереса к жизни',
				'Нарушения сна'
			]
		},
		{
			icon: 'icon-[lucide--search]',
			title: 'отношения и общение',
			items: [
				'Расставания и разводы',
				'Сложности в отношениях с партнёром',
				'Конфликты в семье и на работе',
				'Трудности с личными границами',
				'Страх отвержения',
				'Одиночество и сложности в общении'
			]
		},
		{
			icon: 'icon-[lucide--leaf]',
			title: 'отношения с собой и жизненные кризисы',
			items: [
				'Жёсткая самокритика',
				'Неуверенность в себе',
				'Сложные жизненные решения',
				'Кризис смысла',
				'Ощущение, что жизнь проходит мимо',
				'Адаптация к серьёзным изменениям',
				'Желание лучше понять себя'
			]
		}
	];
</script>

<svelte:head>
	<title>Коротко обо мне | Андрей Калмыков</title>
	<meta
		name="description"
		content="Кто я, с чем работаю, образование и стоимость консультаций. Психолог для выгорающих специалистов цифровых профессий."
	/>
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta property="og:title" content="Коротко обо мне | Андрей Калмыков" />
	<meta
		property="og:description"
		content="Кто я, с чем работаю, образование и стоимость консультаций."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{import.meta.env.VITE_URL}/info" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${personJsonLd}</script>`}
</svelte:head>

<!-- ═══════════════════ 1. КТО Я ═══════════════════ -->
<section data-hero class="relative overflow-hidden bg-background">
	<!-- clip-path для фото-бубля -->
	<svg width="0" height="0" class="absolute" aria-hidden="true">
		<defs>
			<clipPath id="heroBlob" clipPathUnits="objectBoundingBox">
				<path
					d="M0.50,0.04 C0.66,0.00 0.80,0.04 0.88,0.16 C0.95,0.26 1.00,0.40 0.97,0.54 C0.95,0.66 0.99,0.78 0.90,0.88 C0.80,0.98 0.64,0.955 0.50,0.99 C0.36,1.02 0.20,1.00 0.11,0.89 C0.01,0.77 0.04,0.60 0.02,0.46 C0.00,0.32 0.06,0.16 0.20,0.08 C0.30,0.02 0.40,0.065 0.50,0.04 Z"
				/>
			</clipPath>
		</defs>
	</svg>

	<div
		class="relative z-10 mx-auto grid grid-cols-1 items-center gap-10 px-5 pt-24 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.02fr_0.98fr] lg:pt-36 xl:px-0"
	>
		<!-- левая колонка: текст -->
		<div class="flex flex-col">
			<Reveal width="full">
				<h1
					class="mb-5 font-caveat text-[34px] leading-[1.18] font-bold text-navy md:min-w-[530px] lg:text-[40px]"
				>
					Андрей Калмыков<br />
					Психолог
				</h1>
			</Reveal>
			<Reveal width="full">
				<p class="mb-5 text-[16px] leading-relaxed text-foreground/80 lg:text-[18px]">
					Помогаю людям проходить через сложные периоды жизни и двигаться к тому, что для них важно.
				</p>
				<p class="mb-5 text-[16px] leading-relaxed text-foreground/80 lg:text-[18px]">
					Работаю в подходах с доказанной эффективностью.
				</p>
			</Reveal>

			<Reveal width="full">
				<div class="flex max-w-[420px] flex-col gap-3">
					<div class="flex items-center gap-4">
						<ButtonSvg
							href="#pricing"
							variant="1"
							mobileHeight="60px"
							height="70px"
							onclick={() => reachGoal('hero_cta_click')}>Записаться на консультацию</ButtonSvg
						>
					</div>
				</div></Reveal
			>
		</div>

		<!-- правая колонка: фото-бубль + дудлы + бейдж -->
		<Reveal width="full">
			<div class="relative mx-auto w-full max-w-[380px] sm:max-w-[460px] lg:max-w-[560px]">
				<!-- дудлы -->
				<img
					src="/star_2.webp"
					class="pointer-events-none absolute top-[4%] left-[4%] z-10 h-5 w-5 rotate-12 sm:h-6 sm:w-6"
					alt=""
					aria-hidden="true"
				/>
				<span
					class="pointer-events-none absolute -top-[4%] right-[0%] z-10 -rotate-[8deg] font-caveat text-[22px] font-bold text-primary sm:text-[30px] lg:top-[3%] lg:right-[0%]"
					>привет!</span
				>
				<img
					src="/arrow_1.webp"
					width="112"
					height="117"
					class="pointer-events-none absolute top-[0%] right-[16%] z-10 h-12 w-10 rotate-28 object-contain sm:h-16 sm:w-14 lg:top-[6%] lg:right-[14%]"
					alt=""
					aria-hidden="true"
				/>
				<img
					src="/heart_1.webp"
					class="pointer-events-none absolute top-[86%] right-[12%] z-10 h-5 w-5 rotate-28 lg:top-[86%] lg:right-[12%]"
					alt=""
					aria-hidden="true"
				/>
				<!-- фото-бубль -->
				<svg class="w-full" viewBox="0 0 560 720">
					<defs>
						<clipPath id="blobClip" clipPathUnits="userSpaceOnUse">
							<path
								d="M 156.8 76.7 C 184.3 57.1, 227.9 32.6, 266.1 32.6 C 304.3 32.6, 359.1 50.8, 386 76.7 C 412.8 102.6, 405.1 153.6, 427.2 187.9 C 449.2 222.3, 503.4 249.6, 518.3 282.9 C 533.2 316.1, 525.6 344.6, 516.4 387.4 C 507.2 430.3, 489.2 500.7, 463 540 C 436.8 579.3, 396.5 605, 359 623 C 321.5 641, 279.3 651, 238 648 C 196.7 645, 139.6 628.9, 111 605 C 82.4 581.1, 68.8 546.9, 66.6 504.4 C 64.5 461.9, 92.5 393.6, 98.3 350 C 104 306.4, 100.7 275.8, 101.2 242.6 C 101.6 209.4, 91.9 178.2, 101.2 150.6 C 110.4 122.9, 129.3 96.4, 156.8 76.7 Z"
							/>
						</clipPath>
					</defs>

					<image
						href="/main.webp"
						width="560"
						height="750"
						preserveAspectRatio="xMidYMid meet"
						clip-path="url(#blobClip)"
					/>
				</svg>
			</div></Reveal
		>
	</div>
</section>

<!-- ═══════════════════ 2. С ЧЕМ РАБОТАЮ ═══════════════════ -->
<section class="mx-auto max-w-[1600px] bg-background px-5 py-14 md:pb-20 xl:px-0">
	<Reveal width="full">
		<div class="mx-auto mb-10 flex items-center gap-4 md:max-w-[760px] md:gap-6 lg:max-w-[1210px]">
			<h2 class="font-caveatfont-bold text-[34px] whitespace-nowrap text-navy lg:text-[40px]">
				с чем работаю
			</h2>
			<span class="h-0.5 flex-1">
				<svg
					viewBox="0 0 600 22"
					preserveAspectRatio="none"
					class="block h-[22px] w-full"
					aria-hidden="true"
					><path
						d="M2 12 C200 6 400 16 598 10"
						stroke="var(--color-muted-foreground)"
						stroke-width="1.5"
						fill="none"
						stroke-linecap="round"
					/></svg
				>
			</span>
		</div>
	</Reveal>

	<!-- 4 колонки с левой navy-линией; на мобиле — в один столбец -->
	<div class=" relative grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
		<div class="pointer-events-none absolute inset-0 hidden lg:block">
			<!-- 1 -->
			<div class="absolute top-0 left-[25%] h-full -translate-x-1/2">
				<svg
					viewBox="0 0 22 647"
					preserveAspectRatio="none"
					class="h-full w-[22px] rotate-[-0.4deg]"
				>
					<path
						d="M11 2 C8 220 14 430 11 645"
						stroke="var(--color-navy)"
						stroke-width="1.5"
						fill="none"
						stroke-linecap="round"
					/>
				</svg>
			</div>

			<!-- 2 -->
			<div class="absolute top-0 left-[50%] h-full -translate-x-1/2">
				<svg
					viewBox="0 0 22 647"
					preserveAspectRatio="none"
					class="h-full w-[22px] rotate-[0.4deg]"
				>
					<path
						d="M11 2 C8 220 14 430 11 645"
						stroke="var(--color-navy)"
						stroke-width="1.5"
						fill="none"
						stroke-linecap="round"
					/>
				</svg>
			</div>

			<!-- 3 -->
			<div class="absolute top-0 left-[75%] h-full -translate-x-1/2">
				<svg
					viewBox="0 0 22 647"
					preserveAspectRatio="none"
					class="h-full w-[22px] rotate-[-0.7deg]"
				>
					<path
						d="M11 2 C8 220 14 430 11 645"
						stroke="var(--color-navy)"
						stroke-width="1.5"
						fill="none"
						stroke-linecap="round"
					/>
				</svg>
			</div>
		</div>
		{#each problems as cat, i}
			<Reveal width="full">
				<div class="h-full px-0 sm:px-6 lg:px-7">
					<!-- рукописный номер + жёлтая чёрточка -->
					<div class="mb-5 flex items-center gap-3 pl-5 sm:pl-0">
						<span class="font-caveat text-[30px] leading-none font-bold text-primary">0{i + 1}</span
						>
						<span class="h-0.5 w-8 rounded-full bg-primary"></span>
					</div>
					<h3
						class="mb-5 pl-5 text-[18px] leading-snug font-extrabold text-navy sm:pl-0 lg:text-[20px]"
					>
						{cat.title}
					</h3>
					<ul class="flex flex-col gap-2">
						{#each cat.items as item, j}
							<li
								class="relative pl-6 text-[16px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-[''] lg:text-[18px]"
							>
								<MarkdownLink text={item} />
							</li>
						{/each}
					</ul>
				</div>
			</Reveal>
		{/each}
	</div>
</section>
<section class="bg-background py-10 md:py-0" id="approach">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<!-- рукописный заголовок + жёлтый «свуш» снизу -->
		<Reveal>
			<div class="relative mb-12 inline-block md:mb-16">
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">как я работаю</h2>
				<svg
					class="absolute right-[-6px] -bottom-3 left-0 w-full"
					height="14"
					viewBox="0 0 240 16"
					fill="none"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<path
						d="M3 11 C60 4 120 4 178 8 C200 9 222 11 237 7"
						stroke="var(--color-primary)"
						stroke-width="4"
						stroke-linecap="round"
					/>
				</svg>
			</div>
		</Reveal>

		<div class="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2 md:gap-y-14 lg:grid-cols-3">
			{#each [{ icon: '/consistency.webp', title: 'последовательность, не хаос', desc: 'Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план работы и двигаемся к изменениям.' }, { icon: '/transparency.webp', title: 'прозрачность на каждом шаге', desc: 'Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших действий на каждом этапе работы.' }, { icon: '/evidence_based.webp', title: 'доказательные методы', desc: 'Применяю методы с доказанной эффективностью, которые фокусируются на реальных действиях, а не только на симптомах.' }, { icon: '/progress.webp', title: 'измеримый прогресс', desc: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было корректировать курс.' }, { icon: '/it.webp', title: 'опыт в IT изнутри', desc: 'Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм.' }, { icon: '/no-lock-in.webp', title: 'без удержания в терапии', desc: 'Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько, сколько нужно для реальных изменений.' }] as item}
				<Reveal>
					<div class="flex flex-col">
						<img src={item.icon} alt="" class="mb-4 h-10 w-10" aria-hidden="true" />
						<h3 class="mb-3.5 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
							{item.title}
						</h3>
						<p class="text-[16px] leading-relaxed text-foreground/70 lg:text-[18px]">{item.desc}</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
<!-- ═══════════════════ 3. ДИПЛОМЫ (готовый компонент) ═══════════════════ -->
<section class="bg-background pb-6">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px] xl:px-0">
		<EducationNew titleClass="text-[34px] lg:text-[40px]" />
	</div>
</section>
<section class="bg-background py-8 md:py-12">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<Reveal width="full">
			<div class="mb-12 flex items-center gap-4 md:mb-14 md:gap-6">
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">
					как мы придём к результату
				</h2>
				<img
					src="/star_3.webp"
					class="h-7 w-7 shrink-0 -rotate-6 object-contain"
					alt=""
					aria-hidden="true"
				/>

				<span class="hidden h-0.5 flex-1 sm:block">
					<svg
						viewBox="0 0 600 22"
						preserveAspectRatio="none"
						class="block h-[22px] w-full"
						aria-hidden="true"
						><path
							d="M2 12 C200 6 400 16 598 10"
							stroke="var(--color-muted-foreground)"
							stroke-width="1.5"
							fill="none"
							stroke-linecap="round"
						/></svg
					>
				</span>
			</div>
		</Reveal>

		<div class="flex flex-col">
			{#each steps as step, i}
				<Reveal width="full">
					<div
						class="grid grid-cols-[44px_1fr] gap-x-6 gap-y-2 pt-0 md:grid-cols-[52px_300px_1fr] md:gap-x-7 md:pt-0"
					>
						<div class="relative row-span-2 flex justify-center md:row-span-1">
							<div
								class="z-[1] flex max-h-8 min-h-8 max-w-8 min-w-8 items-center justify-center rounded-full bg-lilac font-caveat text-[18px] font-extrabold text-lilac-foreground"
							>
								{step.n}
							</div>

							{#if i < steps.length - 1}
								<span
									class="absolute top-[44px] bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-navy/25"
								></span>
							{/if}
						</div>

						<div class="self-start pt-1.5">
							<h3 class=" text-[18px] leading-snug lg:text-[20px]">{step.title}</h3>
							{#if step.time}
								<div class="text-[16px] leading-relaxed text-foreground/50 lg:text-[18px]">
									{step.time}
								</div>
							{/if}
						</div>

						<p
							class="col-start-2 self-start pt-0 pb-5 text-[16px] leading-relaxed text-foreground/75 md:col-start-3 md:pt-1.5 lg:pb-10 lg:text-[18px]"
						>
							{step.desc}
						</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
<!-- ═══════════════════ 4. СТОИМОСТЬ ═══════════════════ -->
<section class="bg-background py-10 md:py-0" id="pricing">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[960px] xl:px-0">
		<Reveal width="full">
			<div class="mb-5 flex items-center gap-4 md:gap-6">
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">
					формат<br class="md:hidden" /> и стоимость
				</h2>
				<span class="h-0.5 flex-1">
					<svg
						viewBox="0 0 600 22"
						preserveAspectRatio="none"
						class="block h-[22px] w-full"
						aria-hidden="true"
						><path
							d="M2 12 C200 6 400 16 598 10"
							stroke="var(--color-muted-foreground)"
							stroke-width="1.5"
							fill="none"
							stroke-linecap="round"
						/></svg
					>
				</span>
			</div>
		</Reveal>
		<Reveal>
			<p class="mb-9 text-[16px] text-foreground/60 lg:text-[18px]">
				Индивидуальные психологические консультации. Одна встреча — 50 минут, онлайн, в удобное для
				вас время.
			</p>
		</Reveal>

		<!-- 1fr / 1.08fr как в макете, карточки тянутся на равную высоту -->
		<div class="grid grid-cols-1 items-stretch gap-7 md:grid-cols-[1fr_1.08fr]">
			<!-- LIGHT -->
			<Reveal width="full">
				<div
					class="flex h-full flex-col rounded-[22px] border border-navy/12 bg-[#fdfaf3] p-6 lg:px-8"
				>
					<h2 class="font-caveat text-[34px] font-bold text-navy md:pt-[35px] lg:text-[40px]">
						Разовая сессия
					</h2>
					<div class="mt-2 text-[18px] font-extrabold text-navy lg:text-[20px]">4 000 ₽</div>
					<p class="mt-5 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
						Если хотите разобраться в конкретной ситуации, познакомиться с подходом или понять,
						нужна ли вам терапия вообще.
					</p>
					<ul class="mt-6 flex flex-col gap-2.5 text-[14px] text-foreground/80 lg:text-[16px]">
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>50 минут
						</li>
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Онлайн
						</li>
					</ul>
					<!-- футер прижат вниз -->
					<div class="mt-auto pt-8">
						<div class="flex justify-center">
							<ButtonSvg
								variant="1"
								href="/booking"
								mobileHeight="60px"
								mobileWidth="250px"
								width="250px"
								height="70px"
								onclick={() => reachGoal('pricing_single_click')}>Записаться</ButtonSvg
							>
						</div>
						<button
							type="button"
							onclick={() => {
								isIntroModalOpen = true;
								reachGoal('pricing_intro_click');
							}}
							class="mt-4 block w-full cursor-pointer text-center text-[14px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy lg:text-[16px]"
						>
							Хочу познакомиться
						</button>
					</div>
				</div>
			</Reveal>

			<!-- DARK / рекомендуемый -->
			<Reveal width="full">
				<div class="relative flex h-full flex-col rounded-[22px] bg-navy p-6 text-white lg:px-8">
					<img
						src="/heart_2.webp"
						width="629"
						height="572"
						class="pointer-events-none absolute top-5 right-6 h-10 w-10 rotate-6 object-contain opacity-70"
						alt=""
						aria-hidden="true"
					/>
					<span
						class="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold tracking-[0.07em] text-navy uppercase"
						>Рекомендуемый формат</span
					>
					<h2 class="font-caveat text-[34px] font-bold text-white lg:text-[40px]">
						Регулярные встречи
					</h2>
					<div class="mt-2 flex items-baseline gap-2">
						<span class="text-[18px] font-extrabold lg:text-[20px]">14 000 ₽</span>
						<span class="text-[16px] font-medium text-white/55 lg:text-[18px]">/ 4 сессии</span>
					</div>
					<p class="mt-5 text-[16px] leading-relaxed text-white/75 lg:text-[18px]">
						Для устойчивых изменений, а не временного облегчения.
					</p>
					<ul class="mt-6 flex flex-col gap-2.5 text-[16px] text-white/90 lg:text-[18px]">
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Система трекинга прогресса
						</li>
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Обратная связь по сессиям
						</li>
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Онлайн, гибкое расписание
						</li>
					</ul>
					<div class="mt-auto pt-8">
						<div class="flex justify-center">
							<ButtonSvg
								variant="4"
								href="/booking?type=package"
								mobileHeight="60px"
								mobileWidth="250px"
								width="250px"
								height="70px"
								onclick={() => reachGoal('pricing_package_click')}
							>
								Записаться
							</ButtonSvg>
						</div>
						<button
							type="button"
							onclick={() => {
								isIntroModalOpen = true;
								reachGoal('pricing_intro_click');
							}}
							class="mt-4 block w-full cursor-pointer text-center text-[16px] font-semibold text-white/60 underline underline-offset-[3px] transition-colors hover:text-white lg:text-[18px]"
						>
							Хочу познакомиться
						</button>
					</div>
				</div>
			</Reveal>
		</div>
	</div>
</section>
<section class="bg-background py-10 md:py-0 md:pt-24" id="faq">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[960px] xl:px-0">
		<Reveal>
			<div class="relative mb-12 inline-block md:mb-14">
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">вопросы и ответы</h2>
				<svg
					class="absolute -bottom-3 left-0 w-full"
					height="14"
					viewBox="0 0 200 16"
					fill="none"
					preserveAspectRatio="none"
					aria-hidden="true"
					><path
						d="M3 11 C50 4 110 4 158 8 C176 9 188 11 197 7"
						stroke="var(--color-primary)"
						stroke-width="4"
						stroke-linecap="round"
					/></svg
				>
			</div>
		</Reveal>

		<div class="flex flex-col border-t border-navy/12">
			{#each [{ q: 'сколько нужно сессий?', a: 'Предсказать заранее — почти невозможно. У каждого своя динамика. Кто-то уходит через три месяца, кто-то работает год. Психика не укладывается в расписание. Могу сказать точно, что я работаю <strong class="font-semibold text-foreground">не на количество сессий, а на то, чтобы вы перестали в них нуждаться.</strong>' }, { q: 'как часто нужно встречаться?', a: 'Наиболее эффективно — раз в неделю: это поддерживает терапевтический процесс в нужном ритме. Как только появятся устойчивые изменения, частоту можно постепенно снижать.' }, { q: 'будут задания между сессиями?', a: 'Да — изменения происходят не на сессиях, а в жизни между ними. Но это не школа: задания мы подбираем <strong class="font-semibold text-foreground">под ваш темп и контекст</strong>, и только, если они необходимы. Мы всегда будем адаптировать их под вас.' }, { q: 'не могу сформулировать запрос — это обязательно?', a: 'Нет. Достаточно общего ощущения, что что-то идёт не так. Конкретный запрос мы сформулируем вместе в процессе — именно для этого и нужна первая встреча.' }, { q: 'боюсь осуждения', a: 'На сессиях нет места осуждению — ни морализаторства, ни «правильных» эмоций. Пространство терапии — это безопасная среда. Делитесь только тем, к чему готовы, в своём темпе.' }, { q: 'буду нервничать на первой встрече — это нормально?', a: 'Абсолютно нормально. Волноваться перед первым разговором — естественно. Моя задача — сделать так, чтобы уже через несколько минут вам стало спокойнее.' }] as item, i}
				<Reveal width="full">
					<div class="border-b border-navy/12">
						<button
							type="button"
							onclick={() => (openFaq[i] = !openFaq[i])}
							aria-expanded={openFaq[i] ? 'true' : 'false'}
							class="group flex w-full cursor-pointer items-center gap-4 py-5 text-left"
						>
							<span class="font-caveat text-[26px] leading-none font-bold text-primary"
								>0{i + 1}</span
							>
							<span
								class="flex-1 text-[16px] font-bold text-navy transition-colors group-hover:text-primary lg:text-[18px]"
								>{item.q}</span
							>
							<span
								class="shrink-0 text-navy transition-transform duration-300"
								class:rotate-180={openFaq[i]}
							>
								<span class="icon-[lucide--chevron-down] h-5 w-5 text-navy"></span>
							</span>
						</button>
						{#if openFaq[i]}
							<div
								transition:slide={{ duration: 300 }}
								class="pb-6 pl-[42px] text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]"
							>
								{@html item.a}
							</div>
						{/if}
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
{#if isIntroModalOpen}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/67 p-4"
		onclick={() => handleModalClose('backdrop')}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				handleModalClose('esc');
			}
		}}
		role="button"
		tabindex="-1"
		aria-label="Закрыть"
	>
		<div
			class=" relative mx-5 flex max-w-[670px] flex-col gap-6 rounded-2xl bg-card px-5 py-5 shadow-2xl lg:mx-0 lg:px-8"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					handleModalClose('button');
				}}
				class="absolute top-2 right-2 z-10 rotate-2 cursor-pointer p-2 text-foreground/70 transition-colors hover:rotate-4"
				aria-label="Закрыть"
			>
				<svg class="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<div class="lg: space-y-2 pt-6 pt-8">
				<h3 class=" text-[18px] leading-relaxed text-foreground lg:text-[20px]">
					Встреча-знакомство: проверим, подходим ли мы друг другу
				</h3>
				<ul
					class="mt-3 list-none space-y-1 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]"
				>
					<li class="relative pl-6 before:absolute before:left-0 before:content-['—']">
						вы расскажете, что вас беспокоит
					</li>
					<li class="relative pl-6 before:absolute before:left-0 before:content-['—']">
						я расскажу, что мы можем с этим сделать
					</li>
					<li class="relative pl-6 before:absolute before:left-0 before:content-['—']">
						встреча длится 20–25 минут
					</li>
					<li class="relative pl-6 before:absolute before:left-0 before:content-['—']">
						бесплатно, ни к чему не обязывает
					</li>
				</ul>
			</div>

			<div class="mx-auto mt-2 flex">
				<ButtonSvg
					href="/booking?acquaintance"
					onclick={() => reachGoal('modal_intro_click')}
					variant="1"
					mobileWidth="250px"
					mobileHeight="60px"
					width="250px"
					class="mb-3 self-start sm:self-auto"
				>
					Записаться
				</ButtonSvg>
			</div>
		</div>
	</div>
{/if}
