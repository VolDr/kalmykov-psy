<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { initScrollGoals } from '$lib/useScrollGoals';
	import { reachGoal } from '$lib/metrika';
	import { setupLeadMagnetTracking } from '$lib/client/leadMagnetTracking';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';

	let { data } = $props();

	let ctaSection: HTMLElement;
	let cleanupTracking: (() => void) | undefined;

	// sbClientId приходит с сервера (из HttpOnly cookie, установленного /go/v/[clientId])
	const sbClientId = data.sbClientId;

	const introHref = sbClientId
		? `/booking?acquaintance&sb_client_id=${sbClientId}`
		: '/booking?acquaintance';
	const therapyHref = sbClientId ? `/booking?sb_client_id=${sbClientId}` : '/booking';

	onMount(() => {
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const targets = document.querySelectorAll('[data-reveal]');
			targets.forEach((el) => {
				(el as HTMLElement).style.opacity = '0';
				(el as HTMLElement).style.transform = 'translateY(18px)';
				(el as HTMLElement).style.transition =
					'opacity 640ms cubic-bezier(0.16,1,0.3,1), transform 640ms cubic-bezier(0.16,1,0.3,1)';
			});
			const obs = new IntersectionObserver(
				(entries) => {
					entries.forEach((e) => {
						if (e.isIntersecting) {
							(e.target as HTMLElement).style.opacity = '1';
							(e.target as HTMLElement).style.transform = '';
							obs.unobserve(e.target);
						}
					});
				},
				{ threshold: 0.07 }
			);
			targets.forEach((el) => obs.observe(el));
		}

		initScrollGoals();

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				reachGoal('lead_cta_seen');
				observer.disconnect();
			},
			{ threshold: 0.5 }
		);
		if (ctaSection) observer.observe(ctaSection);

		// SaleBot tracking — clientId берётся из HttpOnly cookie на сервере
		if (sbClientId) {
			cleanupTracking = setupLeadMagnetTracking({
				leadMagnet: 'otpusk',
				readThreshold: 75,
				minimumReadingTimeMs: 30_000
			});
		}

	});

	// afterNavigate стреляет после того как SvelteKit закончил свой scroll —
	// перебиваем smooth-scroll instant'ом если в URL есть #acquaintance
	afterNavigate(({ to }) => {
		if (to?.url.hash === '#acquaintance' && ctaSection) {
			ctaSection.scrollIntoView({ behavior: 'instant', block: 'start' });
		}
	});

	onDestroy(() => {
		cleanupTracking?.();
	});
</script>

<svelte:head>
	<title>Почему организованные люди выгорают сильнее всего | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<article class="min-h-screen border-primary bg-background text-foreground">
	<!-- Hero -->
	<header class="mb-10 border-b border-border pt-12 pb-9 sm:mb-16 sm:pt-16 sm:pb-[52px]">
		<div class="mx-auto max-w-[680px] px-5">
			<h1
				class="mb-4 max-w-[600px] font-caveat  text-[clamp(26px,4.5vw,42px)] leading-[1.2] font-semibold tracking-[-0.02em]"
			>
				Почему организованные люди выгорают сильнее всего
			</h1>
			<p class="text-[clamp(16px,1.8vw,19px)] text-muted-foreground">
				Для тех, кто уже пробовал всё — и всё равно возвращается в ту же точку
			</p>
		</div>
	</header>

	<!-- Image 1: обложка — задаёт главный конфликт -->
	<div class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-16" data-reveal>
		<figure class="m-0">
			<img
				src="/lmb/1.webp"
				alt="Человечек сидит внутри календаря как в клетке, рядом список дел, помидорка Pomodoro и карточка Deep Work"
				loading="eager"
				class="block h-auto w-full rounded-[14px]"
			/>
		</figure>
	</div>

	<!-- Intro -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<h2
			class="mb-[22px] font-caveat  text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
		>
			Это читают те, кто уже перестал верить советам
		</h2>
		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Вы прошли курс по продуктивности. Купили правильный ежедневник. Настроили систему задач.
				Ведёте идеальный календарь и умеете расставлять приоритеты лучше большинства людей в вашей
				команде.
			</p>
			<p>И всё равно — в воскресенье вечером у вас тревога. Потому что завтра понедельник.</p>
			<p>
				Если это про вас — эта статья не про тайм-менеджмент. Она про то, почему именно у
				организованных, умных, дисциплинированных людей это происходит чаще всего. И где на самом
				деле находится точка, с которой нужно начинать.
			</p>
		</div>
	</section>

	<!-- Story: Коля -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<h2
			class="mb-[22px] font-caveat  text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
		>
			История, которую вы, скорее всего, уже проживаете
		</h2>
		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Познакомьтесь с Колей. Продуктовый менеджер, умный, с опытом в IT лет на десять. Из тех, кто
				читает не только технические статьи, но и про продуктивность, осознанность, прокачку
				мышления. Знает про Pomodoro, про «глубокую работу» Кэла Ньюпорта, про важность сна.
			</p>
			<p>
				В какой-то момент Коля понял, что устал. Не как после плохого дня — фундаментально, как
				будто внутри что-то выработалось. Он взял отпуск. Первые три дня смотрел сериалы с
				ощущением, что предаёт команду. К концу недели зашёл в рабочий Slack «просто посмотреть».
				На второй неделе уже работал вполсилы, убеждая себя, что это «не считается».
			</p>
			<p>Вернулся с отпуска — и через две недели был там же, откуда уехал.</p>
				<!-- Image 5: перегрузка стала аккуратнее — вывод после истории -->
	<div class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-16" data-reveal>
		<figure class="m-0">
			<img
				src="/lmb/5.webp"
				alt="Человек держит огромную стопку задач, а рядом эти задачи красиво разложены по коробкам: срочно, важно, потом, ещё потерплю"
				loading="lazy"
				class="block h-auto w-full rounded-[14px]"
			/>
		</figure>
	</div>
			<p>
				Коля — не исключение. Это паттерн, который я вижу снова и снова. Умные, дисциплинированные
				люди делают всё правильно — и всё равно не могут вырваться. И первое, что они спрашивают у
				себя: «Что со мной не так?»
			</p>
			<p class="mt-2 text-[clamp(17px,1.9vw,19px)] text-muted-foreground italic">
				Проблема тут, конечно, не В Коле, а в интрументе, которые он использует под неподходящую задачу.
			</p>
		</div>
	</section>

	<div data-scroll-goal="lead_scroll_25"></div>



	<div data-scroll-goal="lead_scroll_50"></div>

	<!-- Time management section -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<h2
			class="mb-[22px] font-caveat  text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
		>
			Тайм-менеджмент — это таблетка от головной боли при переломе ноги
		</h2>

		<!-- Image 2: сразу под заголовком — главная метафора -->


		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Тайм-менеджмент разработан для ситуации, когда проблема — в распределении задач. Он
				отвечает на вопрос «как успеть больше» — но совершенно не отвечает на вопрос «почему я
				истощён».
			</p>
			<p>
				Больше того: чем лучше вы организованы, тем хуже работает эта стратегия при выгорании.
				Хороший планировщик помогает взять на себя ещё больше. Вы становитесь эффективнее в
				перегрузке — и перегрузка растёт вместе с вами. Вы не отдыхаете лучше. Вы просто делаете
				истощение аккуратнее.
			</p>
					<div class="mb-[28px]">
			<figure class="m-0">
				<img
					src="/lmb/2.webp"
					alt="Человек со сломанной ногой пьёт таблетку «тайм-менеджмент» и держит рядом план"
					loading="lazy"
					class="block h-auto w-full rounded-[14px]"
				/>
			</figure>
		</div>
			<p>
				Работа никогда не заканчивается. На место одного закрытого дедлайна немедленно встаёт
				следующий. И сколько бы вы ни оптимизировали расписание, привычка реагировать на любую
				задачу как на угрозу никуда не девается — она срабатывает даже там, где спешить уже некуда.
			</p>
			<p>
				Именно поэтому отпуск не помог. Именно поэтому «просто меньше работать» вызывало чувство
				вины, а не облегчение. Именно поэтому медитации казались полезными, но не меняли ничего в
				понедельник утром.
			</p>
		</div>
	</section>

	<!-- What's really happening -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<h2
			class="mb-[22px] font-caveat  text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
		>
			Что на самом деле происходит — и почему это не лень
		</h2>
		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Выгорание — это не плохое расписание. Это ситуация, когда правила, по которым вы привыкли
				действовать, продолжают управлять поведением в любом контексте — на работе, в выходной, в
				отпуске.
			</p>
			<p>
				Когда годами живёте по правилам «мне нужно всегда быть на связи», «ошибка — это
				катастрофа», «если я остановлюсь — всё рухнет» — отдых перестаёт быть отдыхом. Вы лежите у
				моря, а поведением по-прежнему командует «проверь чат». Не потому что вы плохо стараетесь
				отдыхать. А потому что правило не выключается от смены декораций.
			</p>
			<p>
				И вот что никто не говорит: попытка контролировать это состояние — через планирование, через
				дисциплину, через «возьму себя в руки» — сама по себе является частью проблемы. Это как
				давить на тормоз и газ одновременно. Вы тратите силы на борьбу с собственным состоянием, а
				не на работу или жизнь.
			</p>
		</div>
	</section>

	<!-- Image 4: газ и тормоз — иллюстрирует фразу выше -->
	<div class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-16" data-reveal>
		<figure class="m-0">
			<img
				src="/lmb/4.webp"
				alt="Человек в машине одновременно давит на «дожать» и «отдохнуть», машина дымится и не едет"
				loading="lazy"
				class="block h-auto w-full rounded-[14px]"
			/>
		</figure>
	</div>

	<!-- Continuation: trajectory -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Если не работать с настоящим корнем, состояние накапливается по предсказуемой траектории.
				Сначала — усталость. Потом — цинизм и ощущение бессмысленности. Потом — функциональный
				спад: начинаете переспрашивать на встречах то, что раньше схватывали с полуслова. Пишете
				письмо двадцать минут — хотя раньше на это уходило три. Заходите в рабочий чат семь раз за
				вечер, но ни разу не отвечаете — просто проверяете.
			</p>
			<p class="mt-2 text-[clamp(17px,1.9vw,19px)] text-muted-foreground italic">
				Человек начинает чувствовать себя сломанным. Хотя сломана система, не он.
			</p>
		</div>
	</section>


	<div class="mx-auto mb-10 max-w-[680px] px-5 " data-reveal>
		<figure class="m-0">
			<img
				src="/lmb/3.webp"
				alt="Два человечка приподнимают календарь, а под ним корни: страх ошибки, «всегда на связи», «если остановлюсь — всё рухнет», «надо быть эффективным»"
				loading="lazy"
				class="block h-auto w-full rounded-[14px]"
			/>
		</figure>
	</div>

	<div data-scroll-goal="lead_scroll_75"></div>

	<!-- About -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<div class="rounded-2xl bg-card px-6 py-7 sm:px-10 sm:py-9">
			<h2
				class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
			>
				Кто я и почему пишу про это так уверенно
			</h2>
			<div class="flex flex-col gap-4 text-[clamp(15px,1.6vw,17px)] leading-[1.75] text-foreground">
				<p>
					Меня зовут Андрей Калмыков, я клинический психолог. Я помогаю людям, которые живут в
					постоянной перегрузке, изменить рабочие привычки, образ жизни и способы справляться со
					стрессом — чтобы восстановить силы, вернуть интерес к работе и освободить место для жизни
					вне неё.
				</p>
				<p>
					В психологию пришёл из IT. До этого долго работал в веб-разработке и рисёрч-отделах,
					параллельно учился в аспирантуре, и какое-то время жил ровно в том режиме, который сейчас
					описывают мне клиенты. Ощущение, что остановиться нельзя и постоянно надо куда-то
					двигаться и что-то делать.
				</p>
				<p>
					Этот опыт позволяет мне понимать вас без долгих предисловий. Я знаю, что значит открыть
					ноутбук в отпуске «на минутку», почему в субботу тянет проверить деплой и как трудно
					спокойно отдыхать, пока команда продолжает работать. Я знаю эту среду изнутри — потому что
					сам в ней работал.
				</p>
				<p>Я провожу индивидуальные психологические консультации. Формат работы — онлайн-встречи по 50 минут, обычно раз в неделю.</p>
				<p>
					Я работаю в КПТ и ACT — подходах, эффективность которых изучена и подтверждена
					исследованиями, в том числе применительно к выгоранию.
				</p>
				<p>
					Отзывов и клиентских кейсов вы здесь не увидите — это мой осознанный выбор. Просить их у
					людей, которые пришли в уязвимом состоянии, я считаю неправильным — даже если они
					согласны. То, что мои клиенты рассказывают на сессии, остаётся там же. Нигде не
					публикуется, не становится кейсом, историей успеха или маркетинговым аргументом на сайте.
				</p>
			</div>
		</div>
	</section>

	<!-- Entry point -->
	<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
		<h2
			class="mb-[22px] font-caveat  text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
		>
			Где находится настоящая точка входа
		</h2>
		<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
			<p>
				Подход, который я использую, направлен не на борьбу с симптомами, а с тем, что их
				производит.
			</p>
			<p>
				Сначала мы выявляем убеждения, которые поддерживают истощение. Перфекционизм, «мне нужно
				всегда быть на связи», страх ошибки — это не черты характера. Это усвоенные паттерны,
				которые когда-то помогали добиваться результатов, а теперь работают против вас. Пока они
				активны, любое расписание будет перегружено — потому что проблема не в расписании.
			</p>
			<p>
				Дальше мы учимся реагировать иначе. Не подавлять тревогу и не бороться с ней, а перестать
				отдавать ей управление. Человек, который прошёл эту работу, замечает: он перестал открывать
				рабочий чат в 23:00 — не потому что запретил себе, а потому что перестал чувствовать, что
				обязан. Это не дисциплина. Дисциплина — это когда правило «будь на связи» никуда не делось и
				вы с усилием ему сопротивляетесь. Здесь правило просто перестало управлять поведением.
			</p>
			<p>
				И наконец — мы тренируем новые реакции там, где возникает проблема. В рабочем контексте, в
				реальных ситуациях. Навык формируется не в разговоре, а в понедельник утром, когда в чате
				уже пятнадцать сообщений и внутри всё сжимается.
			</p>
			<p>
				Накопленные данные показывают, что эффект этой работы не только сохраняется, но и
				усиливается на горизонте полугода-года: человек продолжает применять инструменты
				самостоятельно, потому что они встроены в поведение, а не существуют как красивая теория.
			</p>
		</div>
	</section>

	<!-- CTA -->
	<section id="acquaintance" class="mx-auto mb-14 max-w-[680px] scroll-mt-8 px-5 sm:mb-20" data-reveal bind:this={ctaSection}>
		<div class="rounded-2xl bg-card px-6 py-8 text-center sm:px-12 sm:py-[44px]">
			<h2
				class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
			>
				Если узнаёте себя
			</h2>
			<div
				class="mx-auto flex max-w-[520px] flex-col gap-4 text-[clamp(16px,1.8vw,18px)] leading-[1.75]"
			>
				<p>
					Обращаться к психологу впервые может быть непросто. Может быть непонятно, подойдёт ли вам
					специалист, получится ли говорить открыто и действительно ли такая работа сможет помочь.
				</p>
				<p>
					Поэтому можно начать со встречи-знакомства. На встрече вы сможете рассказать, что сейчас
					происходит, задать вопросы о терапии и услышать, как я предлагаю работать именно с вашей
					ситуацией. Заодно мы поймём, комфортно ли нам будет работать вместе.
				</p>
				<p>Встреча проходит онлайн, длится 20–25 минут, бесплатна и ни к чему не обязывает.</p>
			</div>
			<div class="mx-auto mt-2 flex flex-col items-center">
				<ButtonSvg
					href={introHref}
					onclick={() => reachGoal('modal_intro_click')}
					variant="3"
					mobileWidth="280px"
					mobileHeight="80px"
					width="350px"
					class="mb-3"
				>
					Записаться на встречу-знакомство
				</ButtonSvg>
				<div class="flex justify-center">
					<a
						href={therapyHref}
						onclick={() => reachGoal('lead_booking_click')}
						class="block w-full cursor-pointer text-center text-[14px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy lg:text-[16px]"
					>
						Вопросов нет, хочу на терапию
					</a>
				</div>
			</div>
		</div>
	</section>
</article>
