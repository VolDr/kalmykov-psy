<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import EducationNew from '$lib/components/sections/EducationNew.svelte';
	import Media from '$lib/components/sections/Media.svelte';
	import { fade, slide } from 'svelte/transition';

	import { onMount } from 'svelte';
	import { reachGoal } from '$lib/metrika';
	import { initScrollGoals } from '$lib/useScrollGoals';
	import ButtonSvg from '../ui/ButtonSvg.svelte';
	import TextSvg from '../ui/TextSvg.svelte';

	let openFaq = $state<Record<number, boolean>>({ 0: true, 2: true });
	let isIntroModalOpen = $state(false);

	onMount(() => initScrollGoals());
	let modalOpenedAt = $state<number | null>(null);

	$effect(() => {
		if (isIntroModalOpen) modalOpenedAt = Date.now();
	});

	function handleModalClose(source: 'backdrop' | 'button' | 'esc') {
		const timeSpent = modalOpenedAt ? Math.round((Date.now() - modalOpenedAt) / 1000) : 0;
		reachGoal('modal_closed_without_action', { source, time_spent: timeSpent });
		isIntroModalOpen = false;
	}
	const problems = [
		{
			icon: 'icon-[lucide--zap]',
			title: 'работа и самореализация',
			items: [
				'**Работаете на износ** и не можете позволить себе замедлиться',
				'Прокрастинируете, хотя дедлайны горят — не лень, а **внутреннее опустошение**',
				'Синдром самозванца и ощущение, что «недостаточно стараетесь»',
				'Старая работа перестала зажигать, но **непонятно, куда двигаться**'
			]
		},
		{
			icon: 'icon-[lucide--orbit]',
			title: 'эмоции и состояние',
			items: [
				'**Не можете отдыхать без чувства вины** — даже в выходные мозг продолжает «жевать» задачи',
				'Тревога в нерабочее время: маниакально проверяете чаты и не можете выключить режим «спасателя»',
				'Просыпаетесь разбитым/разбитой **даже после выходных**',
				'Всё кажется бессмысленным — работа, которую когда-то любили, **стала просто функцией**'
			]
		},
		{
			icon: 'icon-[lucide--search]',
			title: 'отношения с собой',
			items: [
				'Говорите «да», когда хотите сказать «нет» — и потом злитесь на себя',
				'**Боитесь остановиться**: кажется, стоит сбавить темп — и всё рухнет',
				'Понимаете, что нужно что-то менять, но каждый раз откладываете'
			]
		},
		{
			icon: 'icon-[lucide--leaf]',
			title: 'жизнь и смыслы',
			items: [
				'Живёте от дедлайна к дедлайну и ждёте, что **«само пройдёт»**',
				'Ощущение, что **жизнь проходит мимо** — на себя времени нет совсем',
				'Сложно понять: это выгорание, депрессия или просто усталость?'
			]
		}
	];

	const approaches = [
		{
			title: 'последовательность, не хаос',
			desc: 'Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план работы и двигаемся к изменениям.'
		},
		{
			title: 'прозрачность на каждом шаге',
			desc: 'Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших действий на каждом этапе работы. Никаких туманных процессов без ориентиров.'
		},
		{
			title: 'КПТ и ACT — не «философия», а протоколы',
			desc: 'Работаю в подходах когнитивно-поведенческой терапии (КПТ) и ACT. Это не советы «дышите глубже» — это структурированные методы с измеримыми результатами и доказательной базой.'
		},
		{
			title: 'измеримый прогресс',
			desc: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было вовремя корректировать курс.'
		},
		{
			title: 'опыт в IT изнутри',
			desc: 'Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.'
		},
		{
			title: 'без удержания в терапии',
			desc: 'Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько, сколько нужно для реальных изменений.'
		}
	];

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
			desc: 'Работаем с убеждениями, которые поддерживают проблему. Вводим поведенческие изменения — небольшими шагами, которые реально вписать в вашу жизнь. При необходимости — осваиваем конкретные навыки..'
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
</script>

<svelte:head>
	<title>Консультации для выгорающих профессионалов | Андрей Калмыков</title>
</svelte:head>

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
		class="relative z-10 mx-auto grid grid-cols-1 items-center gap-10 px-5 pt-24 pb-10 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.02fr_0.98fr] lg:pt-26 lg:pb-12 xl:px-0"
	>
		<!-- левая колонка: текст -->
		<div class="flex flex-col">
			<Reveal width="full">
				<h1
					class="mb-5 md:min-w-[530px] font-caveat text-[36px] leading-[1.18] font-bold text-navy lg:text-[51px]"
				>
					Живёте в режиме<br />
					<TextSvg textSize="36px" variant="3" width="370px" mobileWidth="230px" mobileTextSize="text-[36px]">«дотянуть до пятницы»</TextSvg>,<br
					/>но выходные уже <br />не восстанавливают?
				</h1>
			</Reveal>
			<Reveal width="full">
				<p class="mb-5 text-[16px] lg:text-[19px] leading-relaxed text-foreground/80">
					Разберитесь, что происходит — и начните это менять. С доказательным подходом, без
					бесконечного копания в детстве и размытых советов.
				</p>
			</Reveal>
			<Reveal width="full">
				<p class="mb-8 flex items-start gap-3 text-[16px] lg:text-[19px] font-semibold text-foreground">
					<svg
						class="mt-1 shrink-0 -rotate-[15deg]"
						width="26"
						height="24"
						viewBox="0 0 26 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M13 21 C3.5 14.2 1.6 8.8 4.6 5.3 C7 2.2 11.2 3.1 13 6.6 C15.1 2.9 19.4 2.5 21.6 5.7 C24.2 9.2 21.8 14.4 13 21 Z"
							fill="none"
							stroke="var(--color-primary)"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Верните себе энергию, не застревая в терапии на годы.
				</p>
			</Reveal>
			<Reveal width="full">
				<div class="flex max-w-[420px] flex-col gap-3">
					<div class="flex items-center gap-4">
						<ButtonSvg href="#pricing" variant="1">Записаться на консультацию</ButtonSvg>
					</div>
				</div></Reveal
			>
		</div>

		<!-- правая колонка: фото-бубль + дудлы + бейдж -->
		<Reveal width="full">
			<div class="relative mx-auto w-full max-w-[380px] sm:max-w-[460px] lg:max-w-[560px]">
				<!-- дудлы -->
				<svg
					class="pointer-events-none absolute top-[4%] left-[4%] z-10 h-5 w-5 rotate-12 sm:h-6 sm:w-6"
					viewBox="0 0 40 40"
					fill="none"
					aria-hidden="true"
					><path
						d="M20 4 C21.4 13 27 18.6 36 20 C27 21.6 21.2 27 20 36 C18.7 27 13 21.4 4 20 C13 18.6 18.8 13 20 4 Z"
						fill="none"
						stroke="var(--color-lilac-foreground)"
						stroke-width="2.6"
						stroke-linejoin="round"
					/></svg
				>
				<span
					class="pointer-events-none absolute  -top-[4%] lg:top-[3%]   right-[0%]  lg:right-[0%] z-10 -rotate-[8deg] font-caveat text-[22px] font-bold text-primary sm:text-[30px]"
					>привет!</span
				>
				<svg
					class="pointer-events-none absolute top-[0%] lg:top-[6%]   right-[16%] lg:right-[14%] z-10 h-12 w-10 sm:h-16 sm:w-14"
					viewBox="0 0 60 66"
					fill="none"
					aria-hidden="true"
					><path
						d="M54 8 C30 6 12 22 13 52"
						stroke="var(--color-navy)"
						stroke-width="2.4"
						stroke-linecap="round"
					/><path
						d="M4 42 L13.5 55 L24 45"
						stroke="var(--color-navy)"
						stroke-width="2.4"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>

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

				<!-- сиреневый бейдж — позиционируется внутри того же контейнера, масштабируется с ним -->
				<div
					class="absolute right-0 bottom-[3%] w-[85%] origin-bottom-right rotate-[-5.8deg]"
				>
					<svg viewBox="0 0 560 180" aria-hidden="true" class="w-full">
						<path
							d="M 158 48.5 L 163.8 48.5 L 169.6 48.4 L 175.4 48.4 L 181.2 48.4 L 187 48.4 L 192.9 48.4 L 198.7 48.4 L 204.5 48.4 L 210.3 48.5 L 216.1 48.5 L 221.9 48.6 L 227.7 48.7 L 233.5 48.7 L 239.3 48.8 L 245.1 48.9 L 251 48.9 L 256.8 49 L 262.6 49 L 268.4 49 L 274.2 49 L 280 49 L 285.8 48.9 L 291.6 48.9 L 297.4 48.8 L 303.2 48.8 L 309 48.7 L 314.9 48.6 L 320.7 48.5 L 326.5 48.5 L 332.3 48.4 L 338.1 48.3 L 343.9 48.3 L 349.7 48.3 L 355.5 48.3 L 361.3 48.3 L 367.1 48.3 L 373 48.3 L 378.8 48.4 L 384.6 48.4 L 390.4 48.4 L 396.2 48.5 L 402 48.5 Q 433 48.5 433 79.5 L 433 100.5 Q 433 131.5 402 131.5 L 396.2 131.5 L 390.4 131.6 L 384.6 131.6 L 378.8 131.6 L 373 131.7 L 367.1 131.7 L 361.3 131.7 L 355.5 131.7 L 349.7 131.7 L 343.9 131.7 L 338.1 131.7 L 332.3 131.6 L 326.5 131.5 L 320.7 131.5 L 314.9 131.4 L 309 131.3 L 303.2 131.2 L 297.4 131.2 L 291.6 131.1 L 285.8 131.1 L 280 131 L 274.2 131 L 268.4 131 L 262.6 131 L 256.8 131 L 251 131.1 L 245.1 131.1 L 239.3 131.2 L 233.5 131.3 L 227.7 131.3 L 221.9 131.4 L 216.1 131.5 L 210.3 131.5 L 204.5 131.6 L 198.7 131.6 L 192.9 131.6 L 187 131.6 L 181.2 131.6 L 175.4 131.6 L 169.6 131.6 L 163.8 131.5 L 158 131.5 Q 127 131.5 127 100.5 L 127 79.5 Q 127 48.5 158 48.5 Z"
							fill="#ded5f4"
						/>
						<text
							x="280"
							y="82"
							text-anchor="middle"
							font-family="inherit"
							font-size="22"
							font-weight="700"
							letter-spacing="-0.6"
							fill="#322d43"
						>помогаю специалстам</text>
						<text
							x="280"
							y="112"
							text-anchor="middle"
							font-family="inherit"
							font-size="22"
							font-weight="700"
							letter-spacing="-0.6"
							fill="#322d43"
						>цифровых профессий</text>
					</svg>
				</div>
			</div></Reveal
		>
	</div>
</section>

<section class="bg-background py-10 md:py-0 md:pt-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1600px] xl:px-0">
		<Reveal width="full">
			<div class="mb-12 flex items-center gap-4 md:gap-6">
				<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy">
					узнаёте себя?
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
				<svg class="shrink-0" width="30" height="30" viewBox="0 0 40 40" aria-hidden="true"
					><path
						d="M20 4 C21 13 27 19 36 20 C27 21 21 27 20 36 C19 27 13 21 4 20 C13 19 19 13 20 4 Z"
						fill="var(--color-primary)"
					/></svg
				>
			</div>
		</Reveal>
			<div class="mb-9 max-w-[640px] text-[16px] lg:text-[19px] text-foreground/60">
			Вы работаете в IT, маркетинге или управлении. Вы умны, продуктивны, привыкли справляться сами.
		</div>
		<div class="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-y-0 md:gap-x-8 md:gap-y-0">
			{#each [{ n: '01', photo: '/you_1.webp', photoMobile: '/you_1_m.webp', title: 'рабочий день не заканчивается', body: 'Открываете рабочий чат в 23:00 — «просто проверить».<br> Просыпаетесь в воскресенье с тревогой, что что-то упустили.<br> Берёте ноутбук на отдых «на всякий случай».' }, { n: '02', photo: '/you_2.webp', photoMobile: '/you_2_m.webp', title: 'отпуск не помогает', body: 'Пробовали взять отпуск — лучше не стало.<br> Пробовали «просто меньше работать» — чувство вины съедало изнутри.<br> Читали про work-life balance — красиво, но непонятно, что с этим делать.' }, { n: '03', photo: '/you_3.webp', photoMobile: '/you_3_m.webp', title: 'баланс кажется недостижимым', body: 'Сил хватает только на работу и быт.<br> На остальное — нет.' }] as card}
				<Reveal width="full">
					<div class="flex flex-col gap-4 py-8 first:pt-0 md:min-h-[360px] md:flex-row md:items-center md:gap-6 md:py-0">
						<picture class="contents">
							<source media="(max-width: 767px)" srcset={card.photoMobile} />
							<img
								alt={card.title}
								src={card.photo}
								class="h-[185px] w-[385px] max-w-full rounded-2xl object-cover md:h-[250px] md:w-[175px] md:shrink-0"
							/>
						</picture>
						<div>
							<div class="mb-1.5 font-caveat text-[36px] leading-none font-bold text-primary">
								{card.n}
							</div>
							<h3 class="mb-3 text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy">{card.title}</h3>
							<p class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">{@html card.body}</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>

<div data-scroll-goal="main_scroll_25"></div>

<section class="bg-background py-10 md:py-0 md:pt-24" id="requests">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1600px] xl:px-0">
		<!-- заголовок: рукописный + волнистая линия + звёздочка-сердце -->
		<Reveal width="full">
			<div class="mb-12 flex items-center gap-4 md:gap-6">
				<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy">
					вам ко мне, если…
				</h2>
				<span class="h-0.5 flex-1">
					<svg
						viewBox="0 0 600 22"
						preserveAspectRatio="none"
						class="block h-[22px] w-full"
						aria-hidden="true"
					>
						<path
							d="M2 12 C200 6 400 16 598 10"
							stroke="var(--color-muted-foreground)"
							stroke-width="1.5"
							fill="none"
							stroke-linecap="round"
						/>
					</svg>
				</span>
				<svg
					class="hidden shrink-0 sm:block"
					width="30"
					height="28"
					viewBox="0 0 26 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M13 21 C4 14 2 9 4.5 5.5 C6.7 2.4 11 3 13 6.5 C15 3 19.3 2.4 21.5 5.5 C24 9 22 14 13 21 Z"
						fill="none"
						stroke="var(--color-primary)"
						stroke-width="2.2"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
		</Reveal>

		<!-- 4 колонки с левой navy-линией; на мобиле — в один столбец -->
		<div class=" relative grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
			<!-- линии между колонками -->
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
							<span class="font-caveat text-[30px] leading-none font-bold text-primary"
								>0{i + 1}</span
							>
							<span class="h-0.5 w-8 rounded-full bg-primary"></span>
						</div>
						<h3 class="mb-5 pl-5 text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy sm:pl-0">
							{cat.title}
						</h3>
						<ul class="flex flex-col gap-4">
							{#each cat.items as item, j}
								<li
									class="relative pl-6 text-[16px] lg:text-[19px] leading-relaxed text-foreground text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']"
								>
									<MarkdownLink text={item} />
								</li>
							{/each}
						</ul>
					</div>
				</Reveal>
			{/each}
		</div>

		<!-- завершающая волнистая дудл-линия по центру -->
		<div class="mt-12 flex justify-center">
			<svg width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden="true">
				<path
					d="M4 14 C20 2 30 24 46 13 C62 2 72 24 88 13 C104 2 114 24 130 13 C138 7 142 9 146 12"
					stroke="var(--color-primary)"
					stroke-width="2.6"
					stroke-linecap="round"
				/>
			</svg>
		</div>

		<Reveal width="full">
			<p class="mx-auto mt-6 max-w-[640px] text-center text-[16px] lg:text-[19px] text-foreground/60">
				Дело не в силе воли и не в усталости. У этого состояния есть причины — и с ними можно
				работать.
			</p>
		</Reveal>
	</div>
</section>

<section class="bg-background py-10 md:py-0 md:pt-24" id="reasons">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1600px] xl:px-0">
		<!-- центрированный рукописный заголовок с маркером -->
		<Reveal width="full">
			<h2
				class="mx-auto mb-14 max-w-[920px] text-center font-caveat text-[36px] leading-[1.15] font-bold text-navy lg:text-[51px]"
			>
				Почему отпуск, тайм-менеджмент<br class="hidden md:block" />
				и
				<TextSvg textSize="51px" variant="3" width="530px" mobileTextSize='36px' mobileWidth="320px">«просто взять себя в руки»</TextSvg> не работают
			</h2>
		</Reveal>

		<!-- три «почему» с иконками -->
		<div class="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
			<Reveal width="full">
				<div>
					<span class="mb-4 icon-[lucide--umbrella] block h-9 w-9 text-navy"></span>
					<h3 class="mb-4 text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy">
						почему отпуск не помогает
					</h3>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Исследования дают однозначный ответ: отпуск умеренно улучшает самочувствие — снижает
						стресс, улучшает настроение, снимает усталость. Но эффект невелик, и в большинстве
						продольных исследований он <strong class="font-semibold"
							>полностью гаснет в течение одной-двух недель</strong
						> после возвращения на работу.
					</p>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Причём — и это особенно интересно — <strong
							>продолжительность отпуска почти ничего не меняет</strong
						>. Более длинный отпуск не даёт более устойчивого эффекта, чем несколько коротких
						перерывов.
					</p>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Почему? Пока вы в отпуске, стрессовая среда временно исчезает. Но за это время не
						происходит ничего, что изменило бы то, как вы в ней работаете: <strong
							class="font-semibold"
							>не меняются убеждения, не появляются новые способы реагирования, не становятся
							другими поведенческие паттерны</strong
						>. А когда вы возвращаетесь — вас встречают те же требования, та же организационная
						среда, и плюс к этому — накопившийся хвост задач, который стирает послевкусие отдыха за
						несколько дней.
					</p>
				</div>
			</Reveal>
			<Reveal width="full">
				<div>
					<span class="mb-4 icon-[lucide--clock] block h-9 w-9 text-navy"></span>
					<h3 class="mb-4  text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy">
						почему тайм-менеджмент не спасает
					</h3>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Логика кажется убедительной: если проблема в перегрузке — нужно научиться лучше
						организовывать время, расставлять приоритеты, работать эффективнее, и станет легче.
						Иногда — да, временно помогает. Но у этого подхода есть принципиальное ограничение:
						тайм-менеджмент — это <strong class="font-semibold"
							>инструмент для работы внутри системы, а не для её изменения</strong
						>.
					</p>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Исследования в рамках модели Job Demands–Resources показывают: выгорание снижается,
						когда либо уменьшаются требования, либо увеличиваются ресурсы. Тайм-менеджмент сам по себе ни того, ни
						другого не даёт.
					</p>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Хуже того — если его используют для того, чтобы впихнуть больше задач в тот же день, <strong
							class="font-semibold">он не снижает выгорание, а поддерживает его</strong
						>. Вы работаете эффективнее, но в той же дисфункциональной системе, с теми же
						несоответствиями. Просто быстрее к ней адаптируетесь — на какое-то время. Обзоры по
						выгоранию подчёркивают прямо: программы, которые нацелены только на индивидуальные
						навыки без изменения организационной среды, дают меньший и менее устойчивый эффект.
					</p>
				</div>
			</Reveal>
			<Reveal width="full">
				<div>
					<span class="mb-4 icon-[lucide--hand-heart] block h-9 w-9 text-navy"></span>
					<h3 class="mb-4  text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy">
						почему «просто взять себя в руки» ускоряет разрушение
					</h3>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Самодисциплина и мотивация — инструменты здоровой системы. Они хорошо работают, когда у
						вас есть ресурс. Когда ресурса нет — они перестают быть инструментами роста и <strong
							>превращаются в механизм давления</strong
						>.
					</p>
					<p class="mb-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						При выгорании ваш организм уже работает на пределе. Восстановительные механизмы
						ослаблены. В этой точке требование «собраться и работать» означает одно: <strong
							class="font-semibold">усилить давление на систему, которая уже истощена</strong
						>. Это не путь к восстановлению — это
						<strong class="font-semibold">путь к более глубокому выгоранию</strong>. Мотивация и
						способность к самоорганизации возвращаются сами, когда система снова становится
						устойчивой.
					</p>
				</div>
			</Reveal>
		</div>

		<!-- большая рукописная цитата с засечными кавычками и дудлами -->
		<Reveal width="full">
			<div class="relative mx-auto my-20 max-w-[880px] text-center md:my-24">
				<span
					class="pointer-events-none absolute -top-7 -left-3 font-serif text-[90px] leading-none text-primary select-none"
					aria-hidden="true">“</span
				>
				<p class="mb-7 font-caveat text-[28px] leading-[1.4] font-bold text-navy lg:text-[34px]">
					Отпуск убирает стресс временно. Тайм-менеджмент помогает работать быстрее в той же
					сломанной системе. «Взять себя в руки» при истощении — это давление на иссякший ресурс.
				</p>
				<p class="font-caveat text-[28px] leading-snug font-bold text-primary lg:text-[34px]">
					Психотерапия меняет то, как вы функционируете в среде, которая никуда не делась.
				</p>
				<span
					class="pointer-events-none absolute -right-2 -bottom-14 font-serif text-[90px] leading-none text-primary select-none"
					aria-hidden="true">”</span
				>
				<!-- дудлы -->
				<svg
					class="pointer-events-none absolute -top-3 -right-10 h-6 w-6"
					viewBox="0 0 40 40"
					fill="none"
					aria-hidden="true"
					><path
						d="M20 4 C21.4 13 27 18.6 36 20 C27 21.6 21.2 27 20 36 C18.7 27 13 21.4 4 20 C13 18.6 18.8 13 20 4 Z"
						fill="none"
						stroke="var(--color-primary)"
						stroke-width="2.6"
						stroke-linejoin="round"
					/></svg
				>
				<svg
					class="pointer-events-none absolute top-28 -left-14 h-5 w-5 rotate-12"
					viewBox="0 0 40 40"
					aria-hidden="true"
					><path
						d="M20 4 C21 13 27 19 36 20 C27 21 21 27 20 36 C19 27 13 21 4 20 C13 19 19 13 20 4 Z"
						fill="var(--color-marker)"
					/></svg
				>
			</div>
		</Reveal>

		<!-- карточка «что мы делаем иначе» -->
		<Reveal width="full">
			<div class="mx-auto max-w-[1200px] rounded-[28px] bg-card px-6 py-7">
				<h2 class="mb-7 text-center font-caveat text-[28px] lg:text-[34px] font-bold text-navy">
					Что мы делаем в терапии принципиально иначе
				</h2>
				<div class="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">01</div>
						<p class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
							Выявляем убеждения, которые поддерживают истощение: <strong
								class="font-semibold text-foreground">перфекционизм</strong>, «нужно всегда быть
							на связи», катастрофизацию ошибок — и делаем так, чтобы они перестали влиять на ваше
							поведение. Параллельно обучаем конкретным стратегиям: как принимать решения в
							перегрузке и выстраивать поведение, а не только «думать правильно».
						</p>
					</div>
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">02</div>
						<p class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
							Смещаем фокус с попытки контролировать симптомы на развитие <strong
								class="font-semibold text-foreground">психологической гибкости</strong
							>: контакт с настоящим моментом, принятие трудных эмоций без борьбы с ними и действия
							в направлении личных ценностей даже в условиях стресса. Именно это, по научным данным,
							— ключевой механизм снижения выгорания.
						</p>
					</div>
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">03</div>
						<p class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
							Тренируем новые способы реагирования  <strong
								class="font-semibold text-foreground">в реальных или смоделированных рабочих ситуациях</strong>
							— через поведенческие эксперименты, ролевые игры, домашние задания. Это принципиально
							отличает нашу работу от отпуска: навык формируется там, где возникает проблема.
						</p>
					</div>
				</div>
				<p class="mt-10 border-t border-border pt-7 text-[16px] lg:text-[19px] leading-relaxed text-foreground/70">
					<strong class="font-semibold text-foreground">Результат:</strong> исследования показывают,
					что эффект по снижению выгорания и стресса
					<strong class="font-semibold text-foreground"
						>не только сохраняется, но и усиливается на 6–12-месячном горизонте</strong
					>. Человек продолжает применять освоенные способы реагирования
					<strong class="font-semibold text-foreground">уже без терапевта</strong>.
				</p>
			</div>
		</Reveal>
	</div>
</section>

<div data-scroll-goal="main_scroll_50"></div>

<section class="bg-background py-10 md:py-0 md:pt-24" id="approach">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<!-- рукописный заголовок + жёлтый «свуш» снизу -->
		<Reveal>
			<div class="relative mb-12 inline-block md:mb-16">
				<h2 class="font-caveat font-bold text-navy text-[36px] lg:text-[51px]">
					как я работаю
				</h2>
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
			{#each [{ icon: 'icon-[lucide--route]', title: 'последовательность, не хаос', desc: 'Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план работы и двигаемся к изменениям.' }, { icon: 'icon-[lucide--signpost]', title: 'прозрачность на каждом шаге', desc: 'Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших действий на каждом этапе работы.' }, { icon: 'icon-[lucide--flask-conical]', title: 'доказательные методы', desc: 'Применяю методы с доказанной эффективностью, которые фокусируются на реальных действиях, а не только на симптомах.' }, { icon: 'icon-[lucide--trending-up]', title: 'измеримый прогресс', desc: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было корректировать курс.' }, { icon: 'icon-[lucide--briefcase]', title: 'опыт в IT изнутри', desc: 'Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.' }, { icon: 'icon-[lucide--door-open]', title: 'без удержания в терапии', desc: 'Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько, сколько нужно для реальных изменений.' }] as item}
				<Reveal>
					<div class="flex flex-col">
						<span class="{item.icon} mb-4 block h-9 w-9 text-navy"></span>
						<h3 class="mb-3.5 text-[20px] lg:text-[24px] leading-snug font-extrabold text-navy">{item.title}</h3>
						<p class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/70">{item.desc}</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>

<section class="bg-background py-10 md:py-0 md:pt-24" id="about">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px] xl:px-0">
		<Reveal>
			<h2 class="mb-10 font-caveat text-[36px] lg:text-[51px] font-bold text-navy">обо мне</h2>
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
		</Reveal>

		<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
			<Reveal width="full" class="order-last lg:order-first">
				<div class="space-y-4 leading-relaxed text-foreground/80 text-[16px] lg:text-[19px]">
					<p>Меня зовут Андрей Калмыков, я психолог для выгорающих профессионалов.</p>
					<p>
						Я сам долго жил в режиме, который описывают мои клиенты: аспирантура плюс две работы
						одновременно, ощущение, что остановиться нельзя, и всегда нужно двигаться к цели и быть
						эффективным.
					</p>
					<p>
						Это не делает меня лучше других психологов. Но это значит, что я <strong
							class="font-semibold text-foreground">понимаю вас без предисловий</strong
						> — не только потому, что читал об этом, а потому что сам через это прошёл.
					</p>
					<p>
						В психологию пришёл осознанно — это моя вторая профессия. До этого работал в IT:
						разработка и управление проектами. Знаю, что такое ревью кода в 23:00 и релиз в пятницу
						вечером — не из книг.
					</p>
					<ul class="flex flex-col gap-3 pt-1">
						<li
							class="relative pl-5.5 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']"
						>
							Регулярно посещаю профессиональные конференции и слежу за актуальными исследованиями —
							потому что это интересно.
						</li>
						<li
							class="relative pl-5.5 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']"
						>
							<MarkdownLink
								text="[Состою](https://akpn.org/members/kalmykov-andrei-viktorovich-2314)"
							/> в Ассоциации специалистов в сфере контекстуально-поведенческой науки
						</li>
						<li
							class="relative pl-5.5 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']"
						>
							Веду <MarkdownLink text="[Telegram-канал](https://t.me/kalmykov_psy)" /> о психологии —
							там можно познакомиться со мной поближе до записи.
						</li>
					</ul>
				</div>
			</Reveal>

			<Reveal width="full" class="order-first lg:order-last">
				<ImageWithShadow
					src="/2.webp"
					srcSmall="/2_small.webp"
					alt="Андрей Калмыков"
					shadowPosition="bottom-left"
					imgClass="h-[420px] w-full max-w-[420px] rounded-[22px] lg:h-[520px]"
					shadowClass="bg-lilac"
					width={420}
					height={520}
				/>
			</Reveal>
		</div>
	</div>

	<!-- образование и медиа — отдельные компоненты (редизайн в части 4) -->
	<div class="mx-auto md:max-w-[960px] lg:max-w-[1200px]"><EducationNew /></div>
	<div class="mx-auto md:max-w-[960px] lg:max-w-[1200px] xl:px-0"><Media /></div>

	<!-- «почему здесь нет отзывов» — сиреневая карточка -->
	<div class="mx-auto mt-16 px-5 md:mt-24 md:max-w-[960px] lg:max-w-[960px] xl:px-0">
		<Reveal width="full">
			<div
				class="grid grid-cols-1 items-center gap-8 rounded-[28px] bg-lilac px-7 py-7  md:gap-10"
			>

				<div>
					<h3
						class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy mb-5 lg:mb-10 "
					>
						Почему здесь нет отзывов?
						
					</h3>
					<p class="mb-3.5 text-[16px] lg:text-[19px] leading-relaxed text-[#4a3f6b]">
						Вы не найдёте здесь отзывов клиентов — и это осознанный выбор. Я строго отношусь к
						конфиденциальности, поэтому <strong class="font-semibold text-navy"
							>не собираю и не публикую отзывы</strong
						> ни в каком виде, даже обезличенном.
					</p>
					<p class="text-[16px] lg:text-[19px] leading-relaxed text-[#4a3f6b]">
						Кроме того, в терапии мы находимся в неравной позиции: просить отзыв у человека, который
						пришёл в уязвимом состоянии, — значит эксплуатировать его доверие. <strong
							class="font-semibold text-navy">Я не использую клиентов в маркетинговых целях.</strong
						>
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>

<div data-scroll-goal="main_scroll_75"></div>

<section class="bg-background py-10 md:py-0 md:pt-24" id="pricing">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[960px] xl:px-0">
		<Reveal width="full">
			<div class="mb-5 flex items-center gap-4 md:gap-6">
				<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy">
					формат и стоимость
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
			<p class="mb-9 max-w-[640px] text-[16px] lg:text-[19px] text-foreground/60">
				Индивидуальные психологические консультации. Одна встреча — 50 минут, онлайн, в удобное для
				вас время.
			</p>
		</Reveal>

		<!-- 1fr / 1.08fr как в макете, карточки тянутся на равную высоту -->
		<div class="grid grid-cols-1 items-stretch gap-7 md:grid-cols-[1fr_1.08fr]">
			<!-- LIGHT -->
			<Reveal width="full">
				<div
					class="flex h-full flex-col rounded-[22px] border border-navy/12 bg-[#fdfaf3] p-9 md:p-10"
				>
					<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy md:pt-[55px]">Разовая сессия</h2>
					<div class="mt-2 text-[20px] lg:text-[24px] font-extrabold text-navy">4 000 ₽</div>
					<p class="mt-5 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
						Если хотите разобраться в конкретной ситуации, познакомиться с подходом или понять,
						нужна ли вам терапия вообще.
					</p>
					<ul class="mt-6 flex flex-col gap-2.5 text-[16px] lg:text-[19px] text-foreground/80">
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>50 минут
						</li>
						<li class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Онлайн
						</li>
					</ul>
					<!-- футер прижат вниз -->
					<div class="mt-auto pt-8">
						<ButtonSvg variant="1" href="/booking">Записаться</ButtonSvg>
						<button
							type="button"
							onclick={() => {
								isIntroModalOpen = true;
								reachGoal('pricing_intro_click');
							}}
							class="mt-4 block w-full cursor-pointer text-center text-[16px] lg:text-[19px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy"
						>
							Хочу познакомиться
						</button>
					</div>
				</div>
			</Reveal>

			<!-- DARK / рекомендуемый -->
			<Reveal width="full">
				<div class="flex h-full flex-col rounded-[22px] bg-navy p-9 text-white md:p-10">
					<span
						class="mb-5 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold tracking-[0.07em] text-navy uppercase"
						>Рекомендуемый формат</span
					>
					<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-white">Регулярные встречи</h2>
					<div class="mt-2 flex items-baseline gap-2">
						<span class="text-[20px] lg:text-[24px] font-extrabold">14 000 ₽</span>
						<span class="text-[16px] lg:text-[19px] font-medium text-white/55">/ 4 сессии</span>
					</div>
					<p class="mt-5 text-[16px] lg:text-[19px] leading-relaxed text-white/75">
						Для устойчивых изменений, а не временного облегчения.
					</p>
					<ul class="mt-6 flex flex-col gap-2.5 text-[16px] lg:text-[19px] text-white/90">
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
						<ButtonSvg variant="4" href="/booking?type=package">Записаться</ButtonSvg>

						<button
							type="button"
							onclick={() => {
								isIntroModalOpen = true;
								reachGoal('pricing_intro_click');
							}}
							class="mt-4 block w-full cursor-pointer text-center text-[16px] lg:text-[19px] font-semibold text-white/60 underline underline-offset-[3px] transition-colors hover:text-white"
						>
							Хочу познакомиться
						</button>
					</div>
				</div>
			</Reveal>
		</div>
	</div>
</section>

<!-- <section class="bg-background py-10 md:py-0 md:pt-24">
	<div class="mx-auto px-5 xl:px-0 md:max-w-[760px] lg:max-w-[960px]">
		<Reveal width="full">
			<div
				class="flex flex-col items-center gap-8 rounded-lg border border-primary bg-white p-8 shadow-sm md:flex-row"
			>
				<div class="icon-[lucide--gift] text-6xl text-primary"></div>
				<div class="w-full">
					<h3 class="mb-3 font-caveat  text-2xl font-semibold text-foreground">
						Гайд «Как отдыхать правильно»
					</h3>
					<p class="mb-6 leading-relaxed text-foreground">
						Большинство людей отдыхают неправильно — и дело не в количестве часов. Дело в том, что
						<strong class="font-semibold">тип отдыха не совпадает с типом усталости</strong>. Гайд
						объясняет: какие бывают виды усталости, почему телефон и сериалы не восстанавливают, и
						что на самом деле помогает — с конкретными примерами на 5, 15, 30 и 60+ минут.
					</p>
					<Button
						href="https://t.me/psy_kalmykov"
						target="_blank"
						rel="noopener noreferrer"
						variant="primary"
					>
						Получить
					</Button>
				</div>
			</div>
		</Reveal>
	</div>
</section> -->
<section class="bg-background py-8 md:py-12">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<Reveal width="full">
			<div class="mb-12 flex items-center gap-4 md:mb-14 md:gap-6">
				<h2 class="font-caveat font-bold text-navy text-[36px] lg:text-[51px]">
					как мы придём к результату
				</h2>
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
						class="grid min-h-[150px] grid-cols-[44px_1fr] gap-x-6 gap-y-2 pt-0 md:grid-cols-[52px_300px_1fr] md:gap-x-7 md:pt-0"
					>
						<div class="relative row-span-2 flex justify-center md:row-span-1">
							<div
								class="z-[1] flex h-11 w-11 items-center justify-center rounded-full bg-lilac text-[19px] font-extrabold text-lilac-foreground"
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
							<h3 class=" text-[20px] lg:text-[24px] leading-snug">{step.title}</h3>
							{#if step.time}
								<div class="text-[16px] lg:text-[19px] leading-relaxed text-foreground/50">
									{step.time}
								</div>
							{/if}
						</div>

						<p
							class="col-start-2 self-start pt-0 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75 md:col-start-3 md:pt-1.5"
						>
							{step.desc}
						</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
<section class="relative bg-navy py-24 text-center text-white md:py-32">
	<!-- волна сверху (цвет = bg-background) -->
	<svg
		class="absolute inset-x-0 top-0 h-[56px] w-full"
		viewBox="0 0 1440 56"
		preserveAspectRatio="none"
		aria-hidden="true"
		><path
			fill="var(--color-background)"
			d="M0,0 L1440,0 L1440,22 C1140,52 900,8 660,30 C480,46 240,40 0,28 Z"
		/></svg
	>
	<!-- дудлы -->
	<svg
		class="pointer-events-none absolute top-[20%] left-[9%] h-7 w-7 -rotate-12"
		viewBox="0 0 40 40"
		aria-hidden="true"
		><path
			d="M20 4 C21 13 27 19 36 20 C27 21 21 27 20 36 C19 27 13 21 4 20 C13 19 19 13 20 4 Z"
			fill="none"
			stroke="#cdbf9a"
			stroke-width="2.2"
			stroke-linejoin="round"
		/></svg
	>
	<svg
		class="pointer-events-none absolute top-[18%] right-[11%] h-6 w-6 rotate-12"
		viewBox="0 0 40 40"
		aria-hidden="true"
		><path
			d="M20 4 C21 13 27 19 36 20 C27 21 21 27 20 36 C19 27 13 21 4 20 C13 19 19 13 20 4 Z"
			fill="none"
			stroke="#9b8fd0"
			stroke-width="2.2"
			stroke-linejoin="round"
		/></svg
	>
	<svg
		class="pointer-events-none absolute top-[46%] right-[11%] h-8 w-9 -rotate-6"
		viewBox="0 0 26 24"
		fill="none"
		aria-hidden="true"
		><path
			d="M13 21 C3.5 14.2 1.6 8.8 4.6 5.3 C7 2.2 11.2 3.1 13 6.6 C15.1 2.9 19.4 2.5 21.6 5.7 C24.2 9.2 21.8 14.4 13 21 Z"
			fill="none"
			stroke="var(--color-primary)"
			stroke-width="2.2"
			stroke-linejoin="round"
		/></svg
	>

	<div class="mx-auto flex max-w-[820px] flex-col items-center px-5">
		<Reveal>
			<h2 class="font-caveat text-[36px] lg:text-[51px] leading-[1.12] font-bold">
				Вы уже достаточно долго живёте в режиме «потерплю ещё немного»
			</h2>
		</Reveal>
		<Reveal>
			<p class="mx-auto mt-6 max-w-[620px] text-[16px] lg:text-[19px] leading-relaxed text-white/70 mb-6">
				Выгорание не проходит само — оно накапливается. Но оно решаемо, если работать с правильной
				точкой приложения усилий.
			</p>
		</Reveal>
		<Reveal>
			<ButtonSvg href="#pricing">Записаться</ButtonSvg>
		</Reveal>
	</div>

	<!-- волна снизу -->
	<svg
		class="absolute inset-x-0 bottom-0 h-[56px] w-full"
		viewBox="0 0 1440 56"
		preserveAspectRatio="none"
		aria-hidden="true"
		><path
			fill="var(--color-background)"
			d="M0,56 L1440,56 L1440,30 C1140,2 900,48 660,26 C480,10 240,16 0,32 Z"
		/></svg
	>
</section>

<section class="bg-background py-10 md:py-0 md:pt-24" id="faq">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[900px] xl:px-0">
		<Reveal>
			<div class="relative mb-12 inline-block md:mb-14">
				<h2 class="font-caveat text-[36px] lg:text-[51px] font-bold text-navy">
					вопросы и ответы
				</h2>
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
								class="flex-1 text-[16px] lg:text-[16px] lg:text-[19px] font-bold text-navy transition-colors group-hover:text-primary"
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
								class="pb-6 pl-[42px] text-[16px] lg:text-[16px] lg:text-[19px] leading-relaxed text-foreground/75"
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
	>
		<div
			class=" relative flex w-full max-w-[960px] flex-col gap-6 rounded-2xl bg-card p-8 shadow-2xl md:p-9"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<button
				onclick={() => handleModalClose('button')}
				class="absolute top-4 right-4 z-10 cursor-pointer p-2 text-foreground/50 transition-colors hover:text-foreground"
				aria-label="Закрыть"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<div class="space-y-2 pt-2">
				<h3 class=" text-[20px] lg:text-[24px] leading-relaxed text-foreground">
					Встреча-знакомство: проверим, подходим ли мы друг другу
				</h3>
				<ul class="mt-3 list-none space-y-1 text-[16px] lg:text-[19px] leading-relaxed text-foreground/75">
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

			<div class="mt-2 flex">
				<ButtonSvg
					href="https://t.me/m/_KpBREAfOGMy"
					open="blank"
					onclick={() => reachGoal('modal_intro_click')}
					variant="1"
					fullWidth
					class="self-start sm:self-auto"
				>
					Записаться
				</ButtonSvg>
			</div>
		</div>
	</div>
{/if}
