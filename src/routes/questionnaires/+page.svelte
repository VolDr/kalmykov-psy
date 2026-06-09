<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/questionnaires/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн страницы «Опросники» под общий дизайн сайта (эталон —
  online-therapy/+page.svelte «Перед началом работы»).
  · Header / Footer берутся из +layout.svelte — здесь только контент.
  · Данные те же: questionnaireCategories из $lib/data/content.
    Группировка по темам (выгорание / тревога / депрессия /
    перфекционизм / прокрастинация / другое) сохранена.
  · Рукописный «sketch»-стиль убран: заголовки тем — в основном
    шрифте (extrabold navy), иконки — Lucide в кружке (как в эталоне),
    Caveat остаётся только в H1 героя. <style>-блок удалён.
  · Иконки — через iconify-плагин (icon-[lucide--…]), как в Header.svelte.
  · Внизу — дисклеймер + пунктирная плашка-приглашение на консультацию.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { questionnaireCategories } from '$lib/data/content';
	import Reveal from '$lib/components/Reveal.svelte';

	const url = `${import.meta.env.VITE_URL}/questionnaires`;
	const ogImage = `${import.meta.env.VITE_URL}/header.webp`;

	const title =
		'Психологические опросники онлайн | Тесты на депрессию, тревогу, перфекционизм, прокрастинацию и выгорание';
	const description =
		'Бесплатные психологические опросники онлайн: PHQ-9 на депрессию, GAD-7 на тревожность, CPQ на перфекционизм, ПШ/ИПШ на прокрастинацию, BAT на профессиональное выгорание. Валидированные тесты для самодиагностики с мгновенными результатами и рекомендациями психолога.';

	type Questionnaire = {
		title: string;
		link: string;
		description: string;
	};

	type Category = {
		category: string;
		questionnaires: Questionnaire[];
	};

	type QuestionnaireWithCategory = Questionnaire & {
		sourceCategory: string;
	};

	type TopicId =
		| 'burnout'
		| 'anxiety'
		| 'depression'
		| 'perfectionism'
		| 'procrastination'
		| 'other';

	type Topic = {
		id: TopicId;
		title: string;
		description: string;
		// полный класс iconify оставлен литералом, чтобы плагин его «увидел»
		icon: string;
	};

	const topics: Topic[] = [
		{
			id: 'burnout',
			title: 'Выгорание',
			description:
				'Ощущение истощения, снижение мотивации и удовольствия от работы, трудности с восстановлением.',
			icon: '/burnout.webp'
		},
		{
			id: 'anxiety',
			title: 'Тревога',
			description:
				'Чувство напряжения, беспокойства, трудности с расслаблением и навязчивые мысли.',
			icon: '/anxiety.webp'
		},
		{
			id: 'depression',
			title: 'Депрессия',
			description: 'Пониженное настроение, потеря интереса и удовольствия, упадок сил.',
			icon: '/depression.webp'
		},
		{
			id: 'perfectionism',
			title: 'Перфекционизм',
			description: 'Высокие требования к себе, страх ошибок и трудности с принятием результата.',
			icon: '/perfectionism.webp'
		},
		{
			id: 'procrastination',
			title: 'Прокрастинация',
			description:
				'Откладывание важных задач, внутреннее сопротивление и сложности с началом действия.',
			icon: '/procrastination.webp'
		},
		{
			id: 'other',
			title: 'Другие темы',
			description: 'Сон, стресс, самооценка, удовлетворённость жизнью и другие аспекты.',
			icon: 'icon-[lucide--more-horizontal]'
		}
	];

	const allquestionnaires: QuestionnaireWithCategory[] = (questionnaireCategories as Category[]).flatMap((category) =>
		category.questionnaires.map((questionnaire) => ({
			...questionnaire,
			sourceCategory: category.category
		}))
	);

	function getTopicId(questionnaire: QuestionnaireWithCategory): TopicId {
		const ownText = `${questionnaire.title} ${questionnaire.description}`.toLowerCase();
		const categoryText = questionnaire.sourceCategory.toLowerCase();

		if (/(bat|выгоран|истощен|истощён|burnout)/i.test(ownText)) return 'burnout';
		if (/(gad|тревож|тревог|anxiety)/i.test(ownText)) return 'anxiety';
		if (/(phq|депресс|подавлен|depression)/i.test(ownText)) return 'depression';
		if (/(cpq|перфекц|perfection)/i.test(ownText)) return 'perfectionism';
		if (/(прокраст|пш|ипш|psi|ips|procrast)/i.test(ownText)) return 'procrastination';

		if (/(выгоран|burnout)/i.test(categoryText)) return 'burnout';
		if (/(тревож|тревог|anxiety)/i.test(categoryText)) return 'anxiety';
		if (/(депресс|depression)/i.test(categoryText)) return 'depression';
		if (/(перфекц|perfection)/i.test(categoryText)) return 'perfectionism';
		if (/(прокраст|procrast)/i.test(categoryText)) return 'procrastination';

		return 'other';
	}

	const groupedquestionnaires = topics
		.map((topic) => ({
			topic,
			questionnaires: allquestionnaires.filter((questionnaire) => getTopicId(questionnaire) === topic.id)
		}))
		.filter((group) => group.questionnaires.length > 0);

	function getQuestionnaireShortTitle(questionnaire: Questionnaire): string {
		const t = questionnaire.title;

		const codeMatch = t.match(
			/(BAT[-–]?\s?\d+|BAT[-–]?\s?[A-ZА-Я]+|PHQ[-–]?\s?9|GAD[-–]?\s?7|CPQ|ПШ\/ИПШ|ИПШ|ПШ)/i
		);

		if (codeMatch?.[0]) {
			return codeMatch[0].replace(/\s+/g, '').replace('–', '-').toUpperCase();
		}

		return t;
	}

	function getQuestionnaireTime(questionnaire: Questionnaire): string {
	
		return questionnaire.time;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="психологические тесты онлайн, тест на депрессию, тест на тревожность, тест на перфекционизм, тест на прокрастинацию, тест на выгорание, PHQ-9, GAD-7, CPQ, PSI, IPS, BAT, опросники, самодиагностика, психологическая помощь"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<!-- ═══════════════════ ГЕРОЙ ═══════════════════ -->
<section class="bg-background pt-16 lg:pt-24">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8 px-5 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.1fr_0.9fr] xl:px-0 pt-[43px]"
	>
		<Reveal width="full">
			<div class="flex flex-col">
				<span class="mb-1.5 inline-block w-fit" aria-hidden="true">
					<img src="/star_3.webp" class="h-9 w-9 object-contain" alt="" aria-hidden="true" />
				</span>

				<h1
					class="font-caveat relative mb-0 inline-block w-fit text-[52px] leading-[1.1] font-bold tracking-[1px] text-navy lg:text-[72px]"
				>
					Что вас беспокоит?
					<svg
						class="block h-3.5 w-full text-primary md:h-4"
						viewBox="0 0 520 18"
						fill="none"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path d="M4 12 C111 0.5 230 3 516 7" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
					</svg>
				</h1>

				<p class="mt-6 max-w-[470px] text-lg leading-[1.7] text-foreground/75 md:text-[18px]">
					Психологические опросники. Выберите тему, которая сейчас актуальна для
					вас, и пройдите подходящий опросник.
				</p>
			</div>
		</Reveal>

		<!-- иллюстрация: ваза с веточкой -->
		<div class="hidden items-center justify-center lg:flex">
			<img src="/vaza.webp" alt="" class="h-auto w-full max-w-[360px]" aria-hidden="true" />
		</div>
	</div>
</section>

<!-- ═══════════════════ ТЕМЫ + ОПРОСНИКИ ═══════════════════ -->
<section class="bg-background pt-8 pb-6">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		{#each groupedquestionnaires as group}
			<Reveal width="full">
				<div
					class="grid grid-cols-1 gap-x-14 gap-y-7 border-b border-[#e4dccb] py-11 lg:grid-cols-[340px_1fr]"
				>
					<!-- тема: иконка + заголовок + описание -->
					<div>
						<div class="flex items-center gap-5">
							<img src={group.topic.icon} alt="" class="h-10 w-10 shrink-0" aria-hidden="true" />
							<h2 class="m-0 text-[27px] leading-[1.1] font-extrabold tracking-[-0.3px] text-navy">
								{group.topic.title}
							</h2>
						</div>
						<p class="mt-5 max-w-[290px] text-[16px] leading-[1.65] text-foreground/75">
							{group.topic.description}
						</p>
					</div>

					<!-- список опросников -->
					<div class="flex flex-col">
						{#each group.questionnaires as questionnaire, j}
							<a
								href={questionnaire.link}
								class="group grid grid-cols-[1fr_auto_40px] items-center gap-7 py-5 transition-colors {j ===
								0
									? ''
									: 'border-t border-[#e4dccb]'}"
							>
								<span class="min-w-0">
									<span
										class="block text-[21px] leading-[1.2] font-bold text-navy transition-colors group-hover:text-primary"
									>
										{getQuestionnaireShortTitle(questionnaire)}
									</span>
									<span class="mt-1.5 block max-w-[460px] text-[15px] leading-[1.55] text-foreground/70">
										{questionnaire.description}
									</span>
								</span>

								<span
									class="inline-flex items-center gap-2 text-[14px] font-medium whitespace-nowrap text-foreground/45"
								>
									<span class="icon-[lucide--clock] h-[18px] w-[18px]"></span>
									{getQuestionnaireTime(questionnaire)}
								</span>

								<span
									class="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-navy transition-all group-hover:translate-x-1 group-hover:border-primary group-hover:text-primary"
									aria-hidden="true"
								>
									<span class="icon-[lucide--arrow-right] h-[22px] w-[22px]"></span>
								</span>
							</a>
						{/each}
					</div>
				</div>
			</Reveal>
		{/each}



		<!-- ═══════════════════ ПЛАШКА-ПРИГЛАШЕНИЕ ═══════════════════ -->
		<Reveal width="full">
			<div
				class="mt-[18px] grid grid-cols-1 items-center justify-items-center gap-5 rounded-[26px] border-2 border-dashed border-primary px-7 py-8 text-center sm:grid-cols-[auto_1fr_auto] sm:gap-11 sm:px-14"
			>
				<img src="/star_1.webp" class="shrink-0 h-12 w-12" alt="" aria-hidden="true" />
				<p class="max-w-[460px] text-[18px] leading-[1.7] font-semibold text-navy">
					Если результат вас тревожит, поделитесь им на консультации. Я помогу разобраться.
				</p>
				<img src="/heart_1.webp" class="shrink-0 h-12 w-12" alt="" aria-hidden="true" />
			</div>
		</Reveal>
	</div>
</section>
