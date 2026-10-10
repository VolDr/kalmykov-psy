<script lang="ts">
	import { onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { landOnHashTarget } from '$lib/hashLanding';
	import { browser } from '$app/environment';
	import { initScrollGoals } from '$lib/useScrollGoals';
	import { fly } from 'svelte/transition';
	import { reachGoal } from '$lib/metrika';
	import { sendEvent, setupLeadMagnetTracking } from '$lib/client/leadMagnetTracking';
	import { lmLog } from '$lib/client/lmDebug';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import ButtonHint from '$lib/components/leadmagnet/ButtonHint.svelte';
	import FocusAttentionArticle from '$lib/components/leadmagnet/FocusAttentionArticle.svelte';
	import ClipQuiz from '$lib/components/questionnaire/ClipQuiz.svelte';
	import { bat23Config } from '../../../configs/bat23ConfigSoft';

	/**
	 * Вариант B A/B-теста лид-магнита «Вы отдохнули, а легче не стало»:
	 * тот же лонгрид, но вместо приглашения на встречу-знакомство в конце —
	 * опросник на выгорание. На сайте человек видит только общий балл, подробный
	 * разбор по сферам присылает бот (тексты бота — в админке /admin/bot/quiz).
	 *
	 * Вариант A — /useful/focus-attention, трафик делится на уровне рекламы.
	 */

	// Ключ результата в quiz_results и параметр `article` у целей Метрики.
	// Записи в clip_articles у этой страницы нет — слаг разрешён списком
	// STATIC_QUIZ_SLUGS в clip-articles.server.ts
	const QUIZ_SLUG = 'focus-attention-quiz';
	const STAGE_KEY = `clip-${QUIZ_SLUG}-state`;

	// Ключ магнита для событий lm_focusq_opened / _read75 / _completed. Не focus, как у
	// варианта A: концовка другая, и догревающие цепочки в боте у B свои
	const LEAD_MAGNET = 'focusq';

	let { data } = $props();

	const sbClientId = data.sbClientId;

	/** Вернувшийся с недопройденным опросником продолжает с него, а не с начала статьи. */
	function loadStage(): 'article' | 'quiz' {
		if (!browser) return 'article';
		try {
			const restored = localStorage.getItem(STAGE_KEY) === 'quiz' ? 'quiz' : 'article';
			if (restored === 'quiz') {
				lmLog('шаг восстановлен из localStorage: опросник — события статьи ждут её показа');
			}
			return restored;
		} catch {
			return 'article';
		}
	}

	let stage = $state<'article' | 'quiz'>(loadStage());
	let quizStarted = false;

	/**
	 * Разовые события визита: lm_opened, цели прокрутки, трекинг чтения.
	 *
	 * Запускаются при первом показе статьи за загрузку страницы, а не в onMount:
	 * - в компоненте статьи их держать нельзя — он размонтируется на время
	 *   опросника, и «Вернуться к статье» отправило бы всё повторно (второй
	 *   запуск приветственной цепочки, дубли целей);
	 * - в onMount тоже нельзя — если шаг восстановился из localStorage на
	 *   опросник, статьи на экране нет: трекинг на коротком экране засчитал бы
	 *   100 % глубины и прислал ложный read75, а если человек потом вернётся к
	 *   статье и прочитает её, не ушло бы вообще ничего.
	 *
	 * $effect срабатывает после отрисовки, так что маркеры прокрутки к этому
	 * моменту уже в DOM. Трекинг чтения живёт до ухода со страницы и во время
	 * опросника не останавливается.
	 */
	let visitTracked = false;
	let cleanupTracking: (() => void) | undefined;

	$effect(() => {
		if (stage !== 'article' || visitTracked) return;
		visitTracked = true;

		reachGoal('lm_opened');
		initScrollGoals();

		if (sbClientId) {
			cleanupTracking = setupLeadMagnetTracking({
				leadMagnet: LEAD_MAGNET,
				readThreshold: 75,
				minimumReadingTimeMs: 30_000
			});
		} else {
			lmLog('статусы не отправляются: нет sb_client_id — страницу открыли не по ссылке из бота');
		}
	});

	onDestroy(() => cleanupTracking?.());

	// Блок CTA живёт только на шаге статьи, поэтому ссылка на него меняется —
	// отсюда $state и наблюдатель в $effect, а не разовая подписка в onMount
	let ctaSection = $state<HTMLElement | undefined>();

	// /go/fq/a/ ведёт на #acquaintance — блок с кнопкой опросника. Нативный переход к
	// якорю сбивают reveal-анимация и догрузка шрифтов, поэтому приземляемся сами.
	// Если шаг восстановился на опроснике, блока нет — человек и так на опроснике.
	afterNavigate(({ to }) => {
		if (to?.url.hash === '#acquaintance' && ctaSection) landOnHashTarget(ctaSection);
	});
	let ctaSeen = false;

	$effect(() => {
		if (!browser) return;
		try {
			localStorage.setItem(STAGE_KEY, stage);
		} catch {
			// приватный режим — переживём, просто не запомним шаг
		}
	});

	$effect(() => {
		if (!ctaSection || ctaSeen) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				ctaSeen = true;
				reachGoal('lead_cta_seen');
				observer.disconnect();
			},
			{ threshold: 0.5 }
		);
		observer.observe(ctaSection);
		return () => observer.disconnect();
	});

	// Тексты экрана результатов на сайте. Абзацы делятся переносами строк, в
	// атрибут такую строку не записать. Разбор в боте настраивается в /admin/bot/quiz
	const RESULT_TEXT_GREEN =
		'Общий показатель в зелёной зоне — выраженных признаков выгорания сейчас не видно.\n\n' +
		'Это не означает, что усталости или перегрузки совсем нет. Полезнее воспринимать результат как текущую точку отсчёта и обращать внимание на изменения относительно себя: стало ли труднее восстанавливаться после работы, выключаться из рабочих мыслей, сохранять интерес к задачам или концентрироваться так же легко, как раньше.';

	const RESULT_TEXT_ORANGE =
		'Общий показатель в оранжевой зоне — признаки выгорания уже заметны, и на них стоит обратить внимание.\n\n' +
		'Такой результат означает, что нагрузка уже начинает сказываться на состоянии. При этом у разных людей выгорание проявляется по-разному: у кого-то сильнее накапливается истощение, у кого-то меняется отношение к работе, а у кого-то становится труднее концентрироваться или справляться с эмоциональной нагрузкой.';

	const RESULT_TEXT_RED =
		'Общий показатель в красной зоне — признаки выгорания выражены сильно.\n\n' +
		'Такой результат говорит о том, что перегрузка уже заметно отражается на состоянии. Здесь особенно важно посмотреть не только на итоговый балл, но и на то, какие именно проявления выгорания выражены сильнее — от этого зависит, на что стоит обратить внимание в первую очередь.';

	const BOT_CTA_TEXT =
		'В телеграм-боте я пришлю подробный разбор вашего результата по четырём сферам: истощению, внутреннему дистанцированию от работы, когнитивным и эмоциональным затруднениям.\n\n' +
		'Вы увидите, как выглядит именно ваш профиль, и получите рекомендации по каждой сфере.';

	function startQuiz() {
		stage = 'quiz';
		// Цель — разовая: между опросником и статьёй можно ходить туда-сюда
		if (!quizStarted) {
			quizStarted = true;
			reachGoal('clip_quiz_started', { article: QUIZ_SLUG });
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	/**
	 * Опросник пройден. Событие уходит в /api/lm-progress: контакту вешается тег
	 * lm_focusq_completed и запускается сценарий с таким же ключом, если он
	 * включён. Смысл отдельный от quiz_results_delivered — тот срабатывает
	 * только у тех, кто вернулся в бота и прошёл шлагбаум, а этот ловит и тех,
	 * кто увидел балл на сайте и до бота не дошёл.
	 *
	 * Без sb_client_id (человек пришёл не из бота) слать некому — сервер такой
	 * запрос всё равно скипнет.
	 */
	function handleQuizComplete() {
		if (sbClientId) sendEvent(LEAD_MAGNET, 'completed', 100);
		else lmLog('опросник пройден, статус не отправлен: нет sb_client_id');
	}

	function backToArticle() {
		stage = 'article';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Вы отдохнули, а легче не стало | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if stage === 'quiz'}
	<div class="min-h-screen bg-background text-foreground">
		<div class="mx-auto max-w-[680px] px-5 pt-4 pb-6 md:py-10" in:fly={{ y: 14, duration: 350 }}>
			<ClipQuiz
				config={bat23Config}
				articleSlug={QUIZ_SLUG}
				resultHeading="Ваш результат"
				resultTextGreen={RESULT_TEXT_GREEN}
				resultTextOrange={RESULT_TEXT_ORANGE}
				resultTextRed={RESULT_TEXT_RED}
				botCtaText={BOT_CTA_TEXT}
				botCtaButtonText="Получить разбор в боте"
				oncomplete={handleQuizComplete}
			/>
			<div class="mt-6 flex justify-center pb-4">
				<button
					type="button"
					onclick={backToArticle}
					class="cursor-pointer text-sm font-medium text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy"
				>
					← Вернуться к статье
				</button>
			</div>
		</div>
	</div>
{:else}
	<FocusAttentionArticle>
		{#snippet cta()}
			<!-- Последний раздел статьи: от убеждений — к тому, что выгорание изнутри не видно -->
			<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
				<h2
					class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
				>
					Когда одной техники мало
				</h2>
				<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
					<p>
						Техника помогает возвращать внимание из рабочих мыслей в то, чем вы занимаетесь сейчас.
						<strong>Но она решает только одну часть проблемы.</strong>
					</p>
					<p>
						Если после работы вас снова и снова затягивает обратно — проверить чат, мысленно
						закончить разговор, ещё раз прокрутить ошибку или подготовиться к завтрашнему дню, —
						полезно посмотреть, что поддерживает этот цикл.
					</p>
					<p>Например:</p>
					<ul class="flex flex-col gap-2 pl-1">
						<li>«я должен быть всегда на связи»;</li>
						<li>«если я не проверю, всё развалится»;</li>
						<li>«ошибка — это катастрофа»;</li>
						<li>«отдых нужно заслужить»;</li>
						<li>«если я остановлюсь, я отстану».</li>
					</ul>
					<p>
						На фоне хронической нагрузки такие правила могут постепенно занимать всё больше места:
						отдых перестаёт восстанавливать, работа начинает требовать всё больше усилий, становится
						труднее концентрироваться, сохранять интерес и эмоционально включаться в то, что раньше
						давалось легче.
					</p>
					<p>И здесь важно различить две вещи.</p>
					<p>
						<strong>Одно дело</strong> — привычка продолжать думать о работе после рабочего дня. С ней
						действительно можно работать через тренировку внимания и изменение привычных реакций.
					</p>
					<p>
						<strong>Другое</strong> — когда это уже часть более широкой картины выгорания: вместе с устойчивой
						усталостью, снижением вовлечённости, трудностями с концентрацией и эмоциональным истощением.
					</p>
					<p>
						По ощущениям провести эту границу бывает непросто. <strong
							>К своему состоянию постепенно привыкаешь</strong
						>, и то, что ещё несколько месяцев назад казалось явным перегрузом, начинает
						восприниматься как обычная жизнь.
					</p>
				</div>
			</section>

			<section
				id="acquaintance"
				class="mx-auto mb-14 max-w-[680px] scroll-mt-8 px-5 sm:mb-20"
				data-reveal
				bind:this={ctaSection}
			>
				<div class="rounded-2xl bg-card px-6 py-8 text-center sm:px-12 sm:py-[44px]">
					<h2
						class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
					>
						Посмотрите на своё состояние чуть объективнее
					</h2>
					<div
						class="mx-auto flex max-w-[520px] flex-col gap-4 text-left text-[clamp(16px,1.8vw,18px)] leading-[1.75]"
					>
						<p>
							Я подготовил опросник на выгорание, который помогает оценить не только усталость, но и
							другие стороны состояния.
						</p>
						<p>
							Прохождение занимает 5–7 минут. Сразу после него вы увидите общий результат, а в
							Telegram-боте получите более подробный разбор: что происходит с усталостью, интересом
							к работе, концентрацией и эмоциональными реакциями — и на что стоит обратить внимание
							дальше.
						</p>
					</div>
					<div class="mx-auto flex flex-col items-center">
						<ButtonHint line1="5–7 минут" line2="на прохождение">
							<ButtonSvg
								mode="button"
								onclick={startQuiz}
								variant="3"
								mobileWidth="100%"
								mobileHeight="80px"
								width="350px"
							>
								Пройти опросник на выгорание
							</ButtonSvg>
						</ButtonHint>
					</div>
				</div>
			</section>
		{/snippet}
	</FocusAttentionArticle>
{/if}
