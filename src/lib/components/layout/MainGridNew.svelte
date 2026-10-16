<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import { formatRubles, type ServicePrices } from '$lib/pricing';
	let { prices }: { prices: ServicePrices } = $props();
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

	let openFaq = $state<Record<number, boolean>>({});
	let openWhy = $state<Record<number, boolean>>({});
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
				'Работаете на износ и не можете позволить себе замедлиться',
				'Прокрастинируете, несмотря на то что цена промедления вам уже известна',
				'У вас синдром самозванца и ощущение, что вы недостаточно стараетесь',
				'Старая работа перестала зажигать, но непонятно, куда двигаться дальше'
			]
		},
		{
			icon: 'icon-[lucide--orbit]',
			title: 'эмоции и состояние',
			items: [
				'Не можете отдыхать без чувства вины — даже в выходные продолжаете думать о рабочих задачах',
				'Рабочий день закончился, но вы всё ещё на связи — и сами не знаете зачем',
				'Просыпаетесь разбитым/разбитой даже после выходных',
				'Всё кажется бессмысленным — делаете, потому что надо, а не потому что хочется'
			]
		},
		{
			icon: 'icon-[lucide--search]',
			title: 'отношения с собой',
			items: [
				'Говорите «да», когда хотите сказать «нет» — и потом злитесь на себя',
				'Не можете позволить себе паузу — ощущение, что без вас всё немедленно развалится',
				'Понимаете, что нужно что-то менять, но всё равно ничего не меняете'
			]
		},
		{
			icon: 'icon-[lucide--leaf]',
			title: 'жизнь и смыслы',
			items: [
				'Живёте от дедлайна к дедлайну и ждёте, что всё само станет лучше когда-нибудь потом',
				'Время есть только на работу,  всё остальное откладывается — жизнь проходит мимо ',
				'Хочется понять, что происходит, но сил разбираться тоже нет'
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
</script>

<svelte:head>
	<title>Консультации для выгорающих профессионалов | Андрей Калмыков</title>
	<link rel="preload" href="/main.webp" as="image" fetchpriority="high" />
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
		class="relative z-10 mx-auto grid grid-cols-1 items-center gap-10 px-5 pt-24 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.02fr_0.98fr] lg:pt-36 xl:px-0"
	>
		<!-- левая колонка: текст -->
		<div class="flex flex-col">
			<Reveal width="full">
				<h1
					class="mb-5 font-caveat text-[34px] leading-[1.18] font-bold text-navy md:min-w-[530px] lg:text-[40px]"
				>
					Живёте в режиме<br />
					<TextSvg
						textSize="45px"
						variant="3"
						width="450px"
						mobileWidth="350px"
						mobileTextSize="text-[34px]">«дотянуть до пятницы»</TextSvg
					><br />но выходные уже <br />не восстанавливают?
				</h1>
			</Reveal>
			<Reveal width="full">
				<p class="mb-5 text-[16px] leading-relaxed text-foreground/80 lg:text-[18px]">
					Разберитесь, что происходит — и начните это менять. С доказательным подходом, без
					бесконечного копания в детстве и размытых советов.
				</p>
			</Reveal>
			<Reveal width="full">
				<div
					class="relative mb-8 flex items-start gap-3 text-[16px] font-semibold text-foreground lg:text-[18px]"
				>
					<img
						src="/star_1.webp"
						class="mt-1 h-6 w-6 shrink-0 -rotate-[15deg]"
						alt=""
						aria-hidden="true"
					/>
					<!-- <img src="/arrow_3.webp" class=" absolute mt-1 h-10 w-10 right-[0px] top-[40px] -rotate-[40deg] lg:h-12 lg:w-12  shrink-0 lg:-rotate-[20deg] lg:right-[180px] lg:-bottom-[73px]" alt="" aria-hidden="true" /> -->
					<p class="mt-[10px]">Верните себе энергию, не застревая в терапии на годы.</p>
				</div>
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

				<!-- сиреневый бейдж — позиционируется внутри того же контейнера, масштабируется с ним -->
				<div class="absolute right-0 bottom-[3%] w-[85%] origin-bottom-right rotate-[-5.8deg]">
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
							fill="#322d43">помогаю специалистам</text
						>
						<text
							x="280"
							y="112"
							text-anchor="middle"
							font-family="inherit"
							font-size="22"
							font-weight="700"
							letter-spacing="-0.6"
							fill="#322d43">цифровых профессий</text
						>
					</svg>
				</div>
			</div></Reveal
		>
	</div>
</section>

<section class="bg-background pt-20 md:pt-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1600px] xl:px-0">
		<Reveal width="full">
			<div class="mb-12 flex items-center gap-4 md:gap-6">
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">узнаёте себя?</h2>
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
				<img src="/star_2.webp" class="h-[30px] w-[30px] shrink-0" alt="" aria-hidden="true" />
			</div>
		</Reveal>
		<div class="mb-9 max-w-[960px] text-[16px] text-foreground/60 lg:text-[18px]">
			Вы работаете в IT, маркетинге или управлении — и привыкли быть тем, на кого всегда можно
			положиться.
		</div>
		<div
			class="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0 lg:divide-y-0"
		>
			{#each [{ n: '01', photo: '/you_1.webp', photoMobile: '/you_1_m.webp', photoMobile1x: '/you_1_m_1x.webp', title: 'рабочий день не заканчивается', body: 'Открываете рабочий чат в 23:00 просто проверить.<br> Просыпаетесь в воскресенье с тревогой, что что-то упустили.<br> Берёте ноутбук на отдых «на всякий случай».' }, { n: '02', photo: '/you_2.webp', photoMobile: '/you_2_m.webp', photoMobile1x: '/you_2_m_1x.webp', title: 'отпуск не помогает', body: 'Пробовали взять отпуск, но лучше не стало.<br> Пробовали работать меньше и весь отдых провели с чувством вины.<br> Читали про work-life balance. Звучит правильно, но что делать с этим на практике, так и непонятно.' }, { n: '03', photo: '/you_3.webp', photoMobile: '/you_3_m.webp', photoMobile1x: '/you_3_m_1x.webp', title: 'баланс кажется недостижимым', body: 'Сил хватает только на работу и быт.<br> На остальное — нет.' }] as card}
				<Reveal width="full">
					<div
						class="flex flex-col gap-4 py-8 first:pt-0 md:min-h-[360px] md:flex-row md:items-start md:gap-6 md:py-0"
					>
						<picture class="contents">
							<source
								media="(max-width: 767px)"
								srcset="{card.photoMobile1x} 460w, {card.photoMobile} 920w"
								sizes="(max-width: 460px) 100vw, 460px"
							/>
							<img
								alt={card.title}
								src={card.photo}
								class="h-[185px] w-[385px] max-w-full rounded-2xl object-cover md:h-[250px] md:w-[175px] md:shrink-0"
							/>
						</picture>
						<div>
							<div class="mb-1.5 font-caveat text-[34px] leading-none font-bold text-primary">
								{card.n}
							</div>
							<h3 class="mb-3 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
								{card.title}
							</h3>
							<p class="text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								{@html card.body}
							</p>
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
				<h2 class="font-caveat text-[34px] font-bold text-navy lg:text-[40px]">
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
				<img
					src="/heart_2.webp"
					width="629"
					height="572"
					class="hidden h-[28px] w-[30px] shrink-0 object-contain sm:block"
					alt=""
					aria-hidden="true"
				/>
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
						<h3
							class="mb-5 pl-5 text-[18px] leading-snug font-extrabold text-navy sm:pl-0 lg:text-[20px]"
						>
							{cat.title}
						</h3>
						<ul class="flex flex-col gap-4">
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
			<p class="mx-auto mt-6 text-center text-[16px] text-foreground/60 lg:text-[18px]">
				Дело не в силе воли и не в усталости. У этого состояния есть причины, и с ними можно
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
				class="mx-auto mb-14 max-w-[920px] text-center font-caveat text-[28px] leading-[1.15] font-bold text-navy lg:text-[34px]"
			>
				Почему отпуск, тайм-менеджмент<br class="hidden md:block" />
				и<TextSvg
					textSize="34px"
					mobileTextSize="28px"
					variant="3"
					width="380px"
					height="50px"
					mobileWidth="300px"
					mobileHeight="60px">«просто взять себя в руки»</TextSvg
				>не работают
			</h2>
		</Reveal>

		<!-- три «почему» с иконками -->
		<div class="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
			<Reveal width="full">
				<div>
					<img src="/vacation.webp" alt="" class="mb-4 h-10 w-10" aria-hidden="true" />
					<h3 class="mb-4 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
						почему отпуск не помогает
					</h3>
					<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
						Исследования дают однозначный ответ: отпуск умеренно улучшает самочувствие — снижает
						стресс, улучшает настроение, снимает усталость.
					</p>
					{#if openWhy[0]}
						<div transition:slide={{ duration: 250 }}>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Но эффект невелик, и в большинстве продольных исследований он <strong
									class="font-semibold">полностью гаснет в течение одной-двух недель</strong
								> после возвращения на работу.
							</p>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Причём — и это особенно интересно — <strong
									>продолжительность отпуска почти ничего не меняет</strong
								>. Более длинный отпуск не даёт более устойчивого эффекта, чем несколько коротких
								перерывов.
							</p>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Почему? Пока вы в отпуске, стрессовая среда временно исчезает. Но за это время не
								происходит ничего, что изменило бы то, как вы в ней работаете: <strong
									class="font-semibold"
									>не меняются убеждения, не появляются новые способы реагирования, не становятся
									другими поведенческие паттерны</strong
								>. А когда вы возвращаетесь — вас встречают те же требования, та же организационная
								среда, и плюс к этому — накопившийся хвост задач, который стирает послевкусие отдыха
								за несколько дней.
							</p>
						</div>
					{/if}
					<button
						type="button"
						onclick={() => (openWhy[0] = !openWhy[0])}
						aria-expanded={openWhy[0] ? 'true' : 'false'}
						class="mt-1 flex cursor-pointer items-center gap-2 border-b border-primary pb-0.5 text-[15px] text-foreground/60 hover:text-foreground/80"
					>
						{openWhy[0] ? 'скрыть' : 'и что не так?'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-300"
							class:rotate-180={openWhy[0]}
							aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg
						>
					</button>
				</div>
			</Reveal>
			<Reveal width="full">
				<div>
					<img src="/time_management.webp" alt="" class="mb-4 h-10 w-10" aria-hidden="true" />
					<h3 class="mb-4 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
						почему тайм-менеджмент не спасает
					</h3>
					<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
						Логика кажется убедительной: если проблема в перегрузке — нужно научиться лучше
						организовывать время, расставлять приоритеты, работать эффективнее, и станет легче.
					</p>
					{#if openWhy[1]}
						<div transition:slide={{ duration: 250 }}>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Иногда — да, временно помогает. Но у этого подхода есть принципиальное ограничение:
								тайм-менеджмент — это <strong class="font-semibold"
									>инструмент для работы внутри системы, а не для её изменения</strong
								>.
							</p>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Исследования в рамках модели Job Demands–Resources показывают: выгорание снижается,
								когда либо уменьшаются требования, либо увеличиваются ресурсы. Тайм-менеджмент сам
								по себе ни того, ни другого не даёт.
							</p>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Хуже того — если его используют для того, чтобы впихнуть больше задач в тот же день,
								<strong class="font-semibold">он не снижает выгорание, а поддерживает его</strong>.
								Вы работаете эффективнее, но в той же дисфункциональной системе, с теми же
								несоответствиями. Просто быстрее к ней адаптируетесь — на какое-то время. Обзоры по
								выгоранию подчёркивают прямо: программы, которые нацелены только на индивидуальные
								навыки без изменения организационной среды, дают меньший и менее устойчивый эффект.
							</p>
						</div>
					{/if}
					<button
						type="button"
						onclick={() => (openWhy[1] = !openWhy[1])}
						aria-expanded={openWhy[1] ? 'true' : 'false'}
						class="mt-1 flex cursor-pointer items-center gap-2 border-b border-primary pb-0.5 text-[15px] text-foreground/60 hover:text-foreground/80"
					>
						{openWhy[1] ? 'скрыть' : 'в чём подвох?'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-300"
							class:rotate-180={openWhy[1]}
							aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg
						>
					</button>
				</div>
			</Reveal>
			<Reveal width="full">
				<div>
					<img src="/willpower.webp" alt="" class="mb-4 h-10 w-10" aria-hidden="true" />
					<h3 class="mb-4 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
						почему «просто взять себя в руки» ускоряет разрушение
					</h3>
					<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
						Самодисциплина и мотивация — инструменты здоровой системы. Они хорошо работают, когда у
						вас есть ресурс.
					</p>
					{#if openWhy[2]}
						<div transition:slide={{ duration: 250 }}>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								Когда ресурса нет — они перестают быть инструментами роста и <strong
									>превращаются в механизм давления</strong
								>.
							</p>
							<p class="mb-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
								При выгорании ваш организм уже работает на пределе. Восстановительные механизмы
								ослаблены. В этой точке требование «собраться и работать» означает одно: <strong
									class="font-semibold">усилить давление на систему, которая уже истощена</strong
								>. Это не путь к восстановлению — это
								<strong class="font-semibold">путь к более глубокому выгоранию</strong>. Мотивация и
								способность к самоорганизации возвращаются сами, когда система снова становится
								устойчивой.
							</p>
						</div>
					{/if}
					<button
						type="button"
						onclick={() => (openWhy[2] = !openWhy[2])}
						aria-expanded={openWhy[2] ? 'true' : 'false'}
						class="mt-1 flex cursor-pointer items-center gap-2 border-b border-primary pb-0.5 text-[15px] text-foreground/60 hover:text-foreground/80"
					>
						{openWhy[2] ? 'скрыть' : 'почему не помогает?'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-300"
							class:rotate-180={openWhy[2]}
							aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg
						>
					</button>
				</div>
			</Reveal>
		</div>

		<!-- большая рукописная цитата с засечными кавычками и дудлами -->
		<Reveal width="full">
			<div class="relative mx-auto my-20 max-w-[880px] text-center md:my-24">
				<span
					class="pointer-events-none absolute top-18 -left-15 font-serif text-[90px] leading-none text-primary select-none"
					aria-hidden="true">“</span
				>
				<p class="mb-7 font-caveat text-[28px] leading-[1.4] font-bold text-primary lg:text-[34px]">
					Отпуск убирает стресс временно. Тайм-менеджмент помогает работать быстрее в той же
					сломанной системе. «Взять себя в руки» при истощении — это давление на иссякший ресурс.
				</p>
				<p class="font-caveat text-[28px] leading-snug font-bold text-navy lg:text-[34px]">
					Психотерапия меняет то, как вы себя ведёте и что чувствуете в тех обстоятельствах, которые
					сложились вокруг.
				</p>
				<span
					class="pointer-events-none absolute top-18 -right-15 font-serif text-[90px] leading-none text-primary select-none"
					aria-hidden="true">”</span
				>
				<!-- дудлы -->
				<img
					src="/star_3.webp"
					class="pointer-events-none absolute top-[58%] right-1 h-6 w-6 object-contain sm:-right-10"
					alt=""
					aria-hidden="true"
				/>
				<img
					src="/star_1.webp"
					class="pointer-events-none absolute top-[40px] -left-[10px] h-5 w-5 rotate-12 sm:top-38"
					alt=""
					aria-hidden="true"
				/>
				<img
					src="/arrow_3.webp"
					class="pointer-events-none absolute top-[100%] right-[12%] z-10 h-15 w-15 rotate-320 sm:h-16 sm:w-14 lg:top-[103%] lg:right-[14%]"
					alt=""
					aria-hidden="true"
				/>
			</div>
		</Reveal>

		<!-- карточка «что мы делаем иначе» -->
		<Reveal width="full">
			<div class="mx-auto max-w-[1200px] rounded-[28px] bg-card px-6 py-7">
				<h2 class="mb-7 text-center font-caveat text-[28px] font-bold text-navy lg:text-[34px]">
					Что мы делаем в терапии принципиально иначе
				</h2>
				<div class="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">01</div>
						<p class="text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
							Разбираемся, что именно держит вас в истощении — перфекционизм, невозможность
							отключиться, страх ошибки. <strong class="font-semibold text-foreground"
								>Не просто называем это, а меняем.</strong
							> Параллельно учимся конкретным инструментам: как принимать решения, когда уже перегружен,
							и как выстраивать поведение, а не просто убеждать себя думать иначе.
						</p>
					</div>
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">02</div>
						<p class="text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
							Смещаем фокус с контроля симптомов на другое: учимся быть в контакте с тем, что
							происходит прямо сейчас, не воевать с трудными эмоциями — и <strong
								class="font-semibold text-foreground"
								>двигаться в сторону того, что для вас важно</strong
							>, даже когда тяжело. Это работает лучше, чем попытки взять себя в руки.
						</p>
					</div>
					<div>
						<div class="mb-3.5 font-caveat text-[30px] leading-none font-bold text-primary">03</div>
						<p class="text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
							Практикуем новые способы реагирования <strong class="font-semibold text-foreground"
								>на реальных ситуациях</strong
							> — тех, что уже происходят в вашей работе. Навык формируется там, где возникает проблема,
							а не во время сессий.
						</p>
					</div>
				</div>
				<p
					class="mt-10 border-t border-border pt-7 text-[16px] leading-relaxed text-foreground/70 lg:text-[18px]"
				>
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
			{#each [{ icon: '/consistency.webp', title: 'последовательность, не хаос', desc: 'Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план работы и двигаемся к изменениям.' }, { icon: '/transparency.webp', title: 'прозрачность на каждом шаге', desc: 'Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших действий на каждом этапе работы.' }, { icon: '/evidence_based.webp', title: 'доказательные методы', desc: 'Применяю методы с доказанной эффективностью, которые фокусируются на реальных действиях, а не только на симптомах.' }, { icon: '/progress.webp', title: 'измеримый прогресс', desc: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было корректировать курс.' }, { icon: '/it.webp', title: 'опыт в IT изнутри', desc: 'Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.' }, { icon: '/no-lock-in.webp', title: 'без удержания в терапии', desc: 'Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько, сколько нужно для реальных изменений.' }] as item}
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

<section class="bg-background py-10 md:py-0 md:pt-24" id="about">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px] xl:px-0">
		<Reveal>
			<h2 class="mb-10 font-caveat text-[34px] font-bold text-navy lg:text-[40px]">обо мне</h2>
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
				<div class="space-y-4 text-[16px] leading-relaxed text-foreground/80 lg:text-[18px]">
					<p>Меня зовут Андрей Калмыков, я психолог для выгорающих профессионалов.</p>
					<p>
						Я сам долго жил в режиме, который описывают мои клиенты: аспирантура плюс две работы
						одновременно, ощущение, что остановиться нельзя, и всегда нужно двигаться к цели и быть
						эффективным.
					</p>
					<p>
						Это не делает меня лучше других психологов, но это значит, что я понимаю вас без
						предисловий, ведь и сам был в похожих условиях.
					</p>
					<p>
						В психологию пришёл осознанно — это моя вторая профессия. До этого работал в IT,
						веб-разработчиком.
					</p>
					<ul class="flex flex-col gap-3 pt-1">
						<li
							class="relative pl-5.5 text-[16px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-[''] lg:text-[18px]"
						>
							Регулярно посещаю профессиональные конференции и слежу за актуальными исследованиями —
							потому что это интересно.
						</li>
						<li
							class="relative pl-5.5 text-[16px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-[''] lg:text-[18px]"
						>
							<MarkdownLink
								text="[Состою](https://akpn.org/members/kalmykov-andrei-viktorovich-2314)"
							/> в Ассоциации специалистов в сфере контекстуально-поведенческой науки
						</li>
						<li
							class="relative pl-5.5 text-[16px] leading-relaxed text-foreground/75 before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-[''] lg:text-[18px]"
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
					srcSmall1x="/2_small_1x.webp"
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
	<div class="mx-auto mt-16 px-5 md:mt-24 md:max-w-[760px] lg:max-w-[760px] xl:px-0">
		<Reveal width="full">
			<div class="grid grid-cols-1 items-center gap-8 rounded-[28px] bg-lilac px-7 py-7 md:gap-10">
				<div>
					<h3 class="mb-3 font-caveat text-[28px] font-bold text-navy lg:mb-7 lg:text-[34px]">
						Почему здесь нет отзывов?
					</h3>
					<p class="mb-3.5 text-[16px] leading-relaxed text-[#4a3f6b] lg:text-[18px]">
						Отзывов здесь нет — и это не случайно. Просить их у людей, которые пришли в уязвимом
						состоянии, <strong class="font-semibold text-navy">я считаю неправильным </strong> — даже
						если они согласны.
					</p>
					<p class="text-[16px] leading-relaxed text-[#4a3f6b] lg:text-[18px]">
						То, что вы рассказываете на сессии, остаётся там же. <strong
							class="font-semibold text-navy">Не становится</strong
						>
						кейсом, историей успеха или
						<strong class="font-semibold text-navy">маркетинговым аргументом на сайте </strong>.
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>

<div data-scroll-goal="main_scroll_75"></div>

<div id="price"></div>
<section class="bg-background py-10 md:py-0 md:pt-24" id="pricing">
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
					<div class="mt-2 text-[18px] font-extrabold text-navy lg:text-[20px]">
						{formatRubles(prices.single)}
					</div>
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

					<div class="mt-2 flex items-baseline justify-between gap-3">
						<div class="flex items-baseline gap-2">
							<span class="text-[18px] font-extrabold lg:text-[20px]">
								{formatRubles(prices.package)}
							</span>
							<span class="text-[16px] font-medium text-white/55 lg:text-[18px]"> / 4 сессии </span>
						</div>

						<span class="text-[13px] font-medium whitespace-nowrap text-white/45 lg:text-[14px]">
							{Math.round(prices.package / 4).toLocaleString('ru-RU')} ₽ / сессия
						</span>
					</div>

					<p class="mt-5 text-[16px] leading-relaxed text-white/75 lg:text-[18px]">
						Для достижения устойчивых изменений в повседневной жизни
					</p>

					<ul class="mt-6 flex flex-col gap-2.5 text-[16px]">
						text-white/90 lg:text-[18px]">
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

<!-- <section class="bg-background py-10 md:py-0 md:pt-24">
	<div class="mx-auto px-5 xl:px-0 md:max-w-[760px] lg:max-w-[960px]">
		<Reveal width="full">
			<div
				class="flex flex-col items-center gap-8 rounded-lg border border-primary bg-white p-8 shadow-sm md:flex-row"
			>
				<div class="icon-[lucide--gift] text-6xl text-primary"></div>
				<div class="w-full">
					<h3 class="mb-3 font-caveat text-2xl font-semibold text-foreground">
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
	<img
		src="/star_2.webp"
		class="pointer-events-none absolute top-[10%] left-[3%] h-7 w-7 -rotate-12 md:left-[9%] lg:top-[20%]"
		alt=""
		aria-hidden="true"
	/>
	<img
		src="/star_1.webp"
		class="pointer-events-none absolute top-[10%] right-[3%] h-6 w-6 rotate-12 md:right-[11%] lg:top-[18%]"
		alt=""
		aria-hidden="true"
	/>
	<img
		src="/heart_1.webp"
		width="48"
		height="47"
		class="pointer-events-none absolute top-[66%] right-[3%] h-8 w-9 -rotate-6 object-contain lg:top-[46%] lg:right-[11%]"
		alt=""
		aria-hidden="true"
	/>

	<div class="mx-auto flex max-w-[820px] flex-col items-center px-5">
		<Reveal>
			<h2 class="font-caveat text-[34px] leading-[1.12] font-bold lg:text-[40px]">
				Вы уже достаточно долго говорите себе «ещё немного — и станет легче»
			</h2>
		</Reveal>
		<Reveal>
			<p
				class="mx-auto mt-6 mb-6 max-w-[620px] text-[16px] leading-relaxed text-white/70 lg:text-[18px]"
			>
				Выгорание не проходит само — оно накапливается. Но оно решаемо, если работать с правильной
				точкой приложения усилий.
			</p>
		</Reveal>
		<Reveal>
			<ButtonSvg
				href="#pricing"
				mobileHeight="60px"
				mobileWidth="250px"
				width="250px"
				height="70px"
				onclick={() => reachGoal('mid_cta_click')}>Записаться</ButtonSvg
			>
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
								class="flex-1 text-[16px] font-bold text-navy transition-colors group-hover:text-primary lg:text-[16px] lg:text-[18px]"
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
								class="pb-6 pl-[42px] text-[16px] leading-relaxed text-foreground/75 lg:text-[16px] lg:text-[18px]"
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
				onclick={() => handleModalClose('button')}
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
