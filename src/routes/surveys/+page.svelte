<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/surveys/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн страницы «Опросники» под общий дизайн сайта (эталон —
  online-therapy/+page.svelte «Перед началом работы»).
  · Header / Footer берутся из +layout.svelte — здесь только контент.
  · Данные те же: surveyCategories из $lib/data/content.
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
	import { surveyCategories } from '$lib/data/content';
	import Reveal from '$lib/components/Reveal.svelte';

	const url = `${import.meta.env.VITE_URL}/surveys`;
	const ogImage = `${import.meta.env.VITE_URL}/header.webp`;

	const title =
		'Психологические опросники онлайн | Тесты на депрессию, тревогу, перфекционизм, прокрастинацию и выгорание';
	const description =
		'Бесплатные психологические опросники онлайн: PHQ-9 на депрессию, GAD-7 на тревожность, CPQ на перфекционизм, ПШ/ИПШ на прокрастинацию, BAT на профессиональное выгорание. Валидированные тесты для самодиагностики с мгновенными результатами и рекомендациями психолога.';

	type Survey = {
		title: string;
		link: string;
		description: string;
	};

	type Category = {
		category: string;
		surveys: Survey[];
	};

	type SurveyWithCategory = Survey & {
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
			icon: 'icon-[lucide--flame]'
		},
		{
			id: 'anxiety',
			title: 'Тревога',
			description:
				'Чувство напряжения, беспокойства, трудности с расслаблением и навязчивые мысли.',
			icon: 'icon-[lucide--waves]'
		},
		{
			id: 'depression',
			title: 'Депрессия',
			description: 'Пониженное настроение, потеря интереса и удовольствия, упадок сил.',
			icon: 'icon-[lucide--cloud-rain]'
		},
		{
			id: 'perfectionism',
			title: 'Перфекционизм',
			description: 'Высокие требования к себе, страх ошибок и трудности с принятием результата.',
			icon: 'icon-[lucide--star]'
		},
		{
			id: 'procrastination',
			title: 'Прокрастинация',
			description:
				'Откладывание важных задач, внутреннее сопротивление и сложности с началом действия.',
			icon: 'icon-[lucide--hourglass]'
		},
		{
			id: 'other',
			title: 'Другие темы',
			description: 'Сон, стресс, самооценка, удовлетворённость жизнью и другие аспекты.',
			icon: 'icon-[lucide--more-horizontal]'
		}
	];

	const allSurveys: SurveyWithCategory[] = (surveyCategories as Category[]).flatMap((category) =>
		category.surveys.map((survey) => ({
			...survey,
			sourceCategory: category.category
		}))
	);

	function getTopicId(survey: SurveyWithCategory): TopicId {
		const ownText = `${survey.title} ${survey.description}`.toLowerCase();
		const categoryText = survey.sourceCategory.toLowerCase();

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

	const groupedSurveys = topics
		.map((topic) => ({
			topic,
			surveys: allSurveys.filter((survey) => getTopicId(survey) === topic.id)
		}))
		.filter((group) => group.surveys.length > 0);

	function getSurveyShortTitle(survey: Survey): string {
		const t = survey.title;

		const codeMatch = t.match(
			/(BAT[-–]?\s?\d+|BAT[-–]?\s?[A-ZА-Я]+|PHQ[-–]?\s?9|GAD[-–]?\s?7|CPQ|ПШ\/ИПШ|ИПШ|ПШ)/i
		);

		if (codeMatch?.[0]) {
			return codeMatch[0].replace(/\s+/g, '').replace('–', '-').toUpperCase();
		}

		return t;
	}

	function getSurveyTime(survey: Survey): string {
	
		return survey.time;
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
<section class="bg-background pt-24 lg:pt-32">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8  md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.1fr_0.9fr] px-5 xl:px-0"
	>
		<Reveal width="full">
			<div class="flex flex-col">
				<span class="mb-1.5 inline-block w-fit" aria-hidden="true">
					<svg class="h-9 w-14" viewBox="0 0 58 40" fill="none">
						<path d="M29 4 C30 14 33 17 43 18 C33 19 30 22 29 32 C28 22 25 19 15 18 C25 17 28 14 29 4 Z" fill="none" stroke="var(--color-primary)" stroke-width="2.2" stroke-linejoin="round" />
						<path d="M48 6 L52 4 M50 12 L54 12 M9 9 L6 7" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" />
					</svg>
				</span>

				<h1
					class="font-caveat relative mb-0 inline-block w-fit text-[52px] leading-[1.1] font-bold tracking-[1px] text-navy md:text-[76px]"
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

				<p class="mt-6 max-w-[470px] text-lg leading-[1.7] text-foreground/75 md:text-[19px]">
					Психологические опросники. Выберите тему, которая сейчас актуальна для
					вас, и пройдите подходящий опросник.
				</p>
			</div>
		</Reveal>

		<!-- иллюстрация: ваза с веточкой -->
			<div class="hidden items-center justify-center lg:flex">
			<svg class="h-auto w-full max-w-[360px]" viewBox="0 0 380 320" fill="none" aria-hidden="true">
				<circle cx="232" cy="138" r="98" fill="#F6E7CF" />
				<path d="M188 150 C190 110 196 78 214 50" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M214 50 C224 38 240 32 256 34" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M200 96 C212 84 228 82 242 88" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M194 122 C182 116 170 118 160 128" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M256 34 C268 26 282 28 288 38 C278 44 264 44 256 34 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M242 88 C254 82 268 86 272 96 C261 100 248 97 242 88 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M160 128 C148 124 136 128 132 138 C143 142 154 138 160 128 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M214 50 C206 38 206 26 214 18 C222 26 222 40 214 50 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M174 152 C172 178 178 192 181 206 C166 232 158 252 163 280 C165 298 170 308 186 309 L206 309 C222 308 226 298 228 280 C233 252 224 232 210 206 C213 192 219 178 216 152" stroke="var(--color-navy)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
				<ellipse cx="195" cy="152" rx="21" ry="6" stroke="var(--color-navy)" stroke-width="2.2" fill="none" />
				<path d="M173 170 C185 175 205 175 217 170" stroke="var(--color-navy)" stroke-width="1.6" stroke-linecap="round" opacity="0.5" />
				<path d="M86 312 C150 320 240 314 318 318" stroke="var(--color-navy)" stroke-width="2" stroke-linecap="round" />
			</svg>
	</div>
</section>

<!-- ═══════════════════ ТЕМЫ + ОПРОСНИКИ ═══════════════════ -->
<section class="bg-background pt-8 pb-6">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0">
		<div class="h-px w-full bg-[#d8cfbc]"></div>

		{#each groupedSurveys as group}
			<Reveal width="full">
				<div
					class="grid grid-cols-1 gap-x-14 gap-y-7 border-b border-[#e4dccb] py-11 lg:grid-cols-[340px_1fr]"
				>
					<!-- тема: иконка + заголовок + описание -->
					<div>
						<div class="flex items-center gap-5">
							<span
								class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#f6e7cf] text-navy"
							>
								<span
									class="{group.topic.icon} h-8 w-8 {group.topic.id === 'burnout'
										? 'text-primary'
										: ''}"
								></span>
							</span>
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
						{#each group.surveys as survey, j}
							<a
								href={survey.link}
								class="group grid grid-cols-[1fr_auto_40px] items-center gap-7 py-5 transition-colors {j ===
								0
									? ''
									: 'border-t border-[#e4dccb]'}"
							>
								<span class="min-w-0">
									<span
										class="block text-[21px] leading-[1.2] font-bold text-navy transition-colors group-hover:text-primary"
									>
										{getSurveyShortTitle(survey)}
									</span>
									<span class="mt-1.5 block max-w-[460px] text-[15px] leading-[1.55] text-foreground/70">
										{survey.description}
									</span>
								</span>

								<span
									class="inline-flex items-center gap-2 text-[14px] font-medium whitespace-nowrap text-foreground/45"
								>
									<span class="icon-[lucide--clock] h-[18px] w-[18px]"></span>
									{getSurveyTime(survey)}
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
				<svg class="shrink-0 text-primary" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
					<path d="M24 4 C25.5 17 31 22.5 44 24 C31 25.5 25.5 31 24 44 C22.5 31 17 25.5 4 24 C17 22.5 22.5 17 24 4 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
				</svg>
				<p class="max-w-[460px] text-[19px] leading-[1.7] font-semibold text-navy">
					Если результат вас тревожит, поделитесь им на консультации. Я помогу разобраться.
				</p>
				<svg class="shrink-0 text-primary" width="48" height="44" viewBox="0 0 48 44" fill="none" aria-hidden="true">
					<path d="M24 39 C7 27 3.5 16.5 9 9.5 C13.5 3.8 21.5 5.2 24 12 C26.7 5 34.5 4.2 39 10.3 C44 17.2 39.5 27.6 24 39 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
		</Reveal>
	</div>
</section>
