<script lang="ts">
	import { browser } from '$app/environment';
	import { reachGoal } from '$lib/metrika';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import ScoreDisplay from './ScoreDisplay.svelte';
	import NextSteps from './NextSteps.svelte';
	import type { QuestionnaireConfig } from '$lib/data/questionnaires/types';
	import {
		calculateScore,
		evaluateWarnings,
		shouldDisplayQuestion
	} from '$lib/utils/questionnaire/scoringEngine';
	import { formatResultsForClipboard } from '$lib/utils/questionnaire/formatResults';
	import Button from '../ui/Button.svelte';
	import ButtonSvg from '../ui/ButtonSvg.svelte';

	type Props = {
		config: QuestionnaireConfig;
		showEmailStep?: boolean;
		title?: string;
	};

	let { config, showEmailStep = true, title }: Props = $props();

	const storageKey = `questionnaire-${config.id}-wizard-state`;

	const questionSteps = config.questions.filter((q) => q.type !== 'subheading');

	const initialStep = showEmailStep ? -1 : 0;

	function loadState() {
		if (!browser) {
			return {
				answers: {} as Record<string, number>,
				email: '',
				consent: false,
				currentStep: initialStep,
				showResults: false,
				copied: false
			};
		}

		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				const savedStep = parsed.currentStep ?? initialStep;
				return {
					answers: parsed.answers || {},
					email: parsed.email || '',
					consent: parsed.consent || false,
					currentStep: showEmailStep ? savedStep : Math.max(0, savedStep),
					showResults: parsed.showResults || false,
					copied: false
				};
			}
		} catch (err) {
			console.error(err);
		}

		return {
			answers: {} as Record<string, number>,
			email: '',
			consent: false,
			currentStep: initialStep,
			showResults: false,
			copied: false
		};
	}

	let state = $state(loadState());
	let isMounted = $state(false);
	const firedProgressMilestones = new Set<number>();
	let resultsSection: HTMLElement | undefined = $state(undefined);
	let hasInitialScrolled = false;

	function handleKeydown(e: KeyboardEvent) {
		if (state.currentStep < 0 || state.showResults) return;

		const tag = (e.target as HTMLElement).tagName;
		const inputType = (e.target as HTMLInputElement).type;
		// Текстовые поля — не перехватываем Enter/Space/Backspace, только стрелки
		const isText =
			tag === 'TEXTAREA' || (tag === 'INPUT' && inputType !== 'radio' && inputType !== 'checkbox');

		if (e.key === 'ArrowRight') {
			// Всегда перехватываем, чтобы radio не переключал вариант
			e.preventDefault();
			if (canProceedQuestion) nextStep();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prevStep();
		} else if ((e.key === 'Enter' || e.key === ' ') && !isText) {
			if (canProceedQuestion) {
				e.preventDefault();
				nextStep();
			}
		} else if (e.key === 'Backspace' && !isText) {
			e.preventDefault();
			prevStep();
		}
	}

	$effect(() => {
		if (!browser) return;
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	$effect(() => {
		isMounted = true;
		if (browser) {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					answers: state.answers,
					email: state.email,
					consent: state.consent,
					currentStep: state.currentStep,
					showResults: state.showResults
				})
			);
		}
	});

	$effect(() => {
		if (state.showResults && resultsSection && !hasInitialScrolled) {
			resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			hasInitialScrolled = true;
		}
	});

	let trimmedEmail = $derived(state.email.trim());
	let isEmailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail));
	// Email необязателен: без него можно идти дальше,
	// но если введён — нужны валидный адрес и согласие
	let canProceedFromEmail = $derived(trimmedEmail === '' || (isEmailValid && state.consent));

	let currentQuestion = $derived(
		state.currentStep >= 0 && state.currentStep < questionSteps.length
			? questionSteps[state.currentStep]
			: null
	);

	let canProceedQuestion = $derived.by(() => {
		if (!currentQuestion) return false;
		if (!currentQuestion.required) return true;
		return state.answers[currentQuestion.id] !== undefined;
	});

	let currentSubheadingText = $derived.by(() => {
		if (!currentQuestion) return null;
		const qIndex = config.questions.findIndex((q) => q.id === currentQuestion.id);

		for (let i = qIndex - 1; i >= 0; i--) {
			const q = config.questions[i];
			if (q.type === 'subheading') {
				const isAlternative = q.textCondition && q.textCondition(state.answers);
				return isAlternative && q.alternativeText ? q.alternativeText : q.text;
			}
		}
		return null;
	});

	let currentScore = $derived(calculateScore(state.answers, config));
	let activeWarnings = $derived(evaluateWarnings(state.answers, config));
	let canGoBack = $derived(state.currentStep > initialStep);

	const dimensionRecs: Record<string, Partial<Record<'orange' | 'red', { title: string; text: string }>>> = {
		exhaustion: {
			orange: {
				title: 'Истощение уже заметно',
				text: 'Похоже, запас сил начинает снижаться. Важно не ждать, пока усталость станет постоянным фоном. Попробуйте в ближайшие дни уменьшить необязательную нагрузку, заранее поставить короткие периоды восстановления и отследить, после каких задач вы быстрее всего проседаете.'
			},
			red: {
				title: 'Истощение выражено сильнее всего',
				text: 'Ваши ответы показывают, что главный источник трудностей сейчас — истощение. В таком состоянии отдых может переставать восстанавливать, а простые задачи требуют всё больше усилий. Здесь важно не пытаться «дожать», а снижать нагрузку там, где это возможно, возвращать регулярное восстановление и разбираться, почему силы снова не успевают восстановиться.'
			}
		},
		mentalDistance: {
			red: {
				title: 'Работа всё чаще ощущается чужой',
				text: 'Высокий показатель внутреннего дистанцирования может означать, что работа всё чаще вызывает отстранённость, раздражение или ощущение бессмысленности. Не стоит сразу делать резкий вывод, что профессию нужно бросать. Сначала важно понять, что именно изменилось: выросла нагрузка, стало меньше контроля, работа разошлась с вашими ценностями, пропало восстановление или накопилось разочарование.'
			}
		},

		cognitiveImpairment: {
			red: {
				title: 'Когнитивная перегрузка выражена сильно',
				text: 'Ваши ответы показывают, что выгорание может уже сказываться на внимании, памяти и принятии решений. В таком состоянии попытка работать быстрее часто только увеличивает количество ошибок и усталость. На время лучше упростить рабочую систему: меньше параллельных задач, больше внешних опор, короткие рабочие блоки, ясные приоритеты и меньше решений там, где их можно заранее снять с себя.'
			}
		},

		emotionalImpairment: {
			red: {
				title: 'Эмоциями стало сложнее управлять',
				text: 'Высокий показатель эмоциональных затруднений может означать, что напряжение стало труднее выдерживать, а после сильных реакций сложнее возвращаться в спокойное состояние. Раздражение, слёзы или вспышки злости чаще появляются там, где долго не хватает пауз, восстановления и пространства для себя. Здесь важно снижать общий уровень перегрузки, возвращать регулярные паузы, не добавлять лишнего общения сверх ресурса и разбирать ситуации, в которых эмоции снова выходят из-под контроля.'
			}
		}
	};

	const allGreenCard = {
		title: 'Сильных просадок по шкалам не видно',
		text: 'По ответам не видно выраженных признаков выгорания. Чтобы сохранить это состояние, полезно заранее замечать ранние сигналы перегрузки: хуже восстанавливаетесь после выходных, чаще откладываете задачи, сложнее выключиться вечером или отдых начинает вызывать чувство вины.'
	};

	const subscaleToRec: Record<string, string> = {
		exhaustion: 'exhaustion',
		distancing: 'mentalDistance',
		cognitive: 'cognitiveImpairment',
		emotional: 'emotionalImpairment'
	};

	let topSubscales = $derived.by(() => {
		const isHot = (c: string) => c === 'red' || c === 'darkred';
		return (currentScore.subscales ?? [])
			.filter((s) => s.interpretation.color !== 'green')
			.sort((a, b) => {
				const pa = isHot(a.interpretation.color) ? 1 : 0;
				const pb = isHot(b.interpretation.color) ? 1 : 0;
				if (pb !== pa) return pb - pa;
				return (b.averageScore ?? b.score) - (a.averageScore ?? a.score);
			});
	});

	function sendResultsEmail() {
		if (!browser) return;
		if (!trimmedEmail || !isEmailValid) return;

		const data = new FormData();
		data.append('email', state.email);
		data.append(
			'score',
			currentScore.averageScore?.toFixed(2) || currentScore.totalScore.toString()
		);
		data.append('severity', currentScore.interpretation.severity);

		data.append('total_recommendation', currentScore.interpretation.recommendation);

		const colorMap: Record<string, string> = {
			green: '#10b981',
			orange: '#f59e0b',
			red: '#ef4444'
		};
		data.append('color', colorMap[currentScore.interpretation.color] || '#191919');

		currentScore.subscales.forEach((sub, i) => {
			data.append(`sub${i}_name`, sub.name);
			data.append(`sub${i}_score`, sub.averageScore?.toFixed(2) || sub.score.toString());
			data.append(`sub${i}_severity`, sub.interpretation.severity);
			data.append(`sub${i}_color`, colorMap[sub.interpretation.color] || '#191919');
			data.append(`sub${i}_desc`, sub.description);
		});

		fetch('?/sendResults', {
			method: 'POST',
			body: data
		}).catch((err) => console.error('Silent email send error:', err));
	}

	function nextStep() {
		if (state.currentStep === -1 && !canProceedFromEmail) return;
		if (state.currentStep >= 0 && !canProceedQuestion) return;

		if (state.currentStep === -1 && trimmedEmail) {
			reachGoal('questionnaire_email_submitted');
		}

		let nextIdx = state.currentStep + 1;

		while (nextIdx < questionSteps.length) {
			if (shouldDisplayQuestion(questionSteps[nextIdx], state.answers)) break;
			nextIdx++;
		}

		if (nextIdx < questionSteps.length) {
			state.currentStep = nextIdx;
			window.scrollTo({ top: 0, behavior: 'smooth' });

			const progress = Math.round(((nextIdx + 1) / questionSteps.length) * 100);
			for (const milestone of [25, 50, 75]) {
				if (progress >= milestone && !firedProgressMilestones.has(milestone)) {
					firedProgressMilestones.add(milestone);
					reachGoal(`questionnaire_progress_${milestone}`);
				}
			}
		} else {
			state.showResults = true;
			reachGoal('questionnaire_completed', {
				result: currentScore.interpretation.severity,
				questions_answered: state.currentStep + 1,
				email_provided: !!state.email
			});
			sendResultsEmail();
		}
	}

	function prevStep() {
		if (state.currentStep > -1) {
			let prevIdx = state.currentStep - 1;

			while (prevIdx >= 0) {
				if (shouldDisplayQuestion(questionSteps[prevIdx], state.answers)) {
					break;
				}
				prevIdx--;
			}

			state.currentStep = prevIdx;

			if (state.showResults) {
				state.showResults = false;
				hasInitialScrolled = false;
			}
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function handleReset() {
		state.answers = {};
		state.email = '';
		state.consent = false;
		state.currentStep = -1;
		state.showResults = false;
		state.copied = false;
		hasInitialScrolled = false;

		if (browser) {
			localStorage.removeItem(storageKey);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<div class="space-y-6 px-5 py-6 md:space-y-10 md:py-12 xl:px-0">
	{#if !isMounted}
		<!-- Лоадер или скелетон, пока подтягивается стейт из localStorage -->
		<div class="flex min-h-[300px] items-center justify-center">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if showEmailStep && state.currentStep === -1 && !state.showResults}
		<div>
			<div
				class="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-8"
			>
				<h2 class="mb-4 font-caveat text-[28px] font-semibold text-foreground lg:text-[34px]">
					Опросник на уровень выгорания
				</h2>
				<p class="mb-8 text-sm leading-relaxed text-foreground/70">
					Хотите получить результаты на почту? Укажите email. Это необязательно — можно пройти
					опросник и без него.
				</p>

				<div class="space-y-6">
					<div>
						<input
							type="email"
							id="email"
							bind:value={state.email}
							class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
							placeholder="mail@example.ru"
						/>
					</div>

					{#if trimmedEmail !== ''}
						<label class="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								bind:checked={state.consent}
								class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<span class="text-sm text-gray-600">
								Я согласен(-на) на <a
									href="/privacy"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary underline underline-offset-2 transition-colors hover:text-foreground"
									>обработку персональных данных</a
								>
							</span>
						</label>
					{/if}

					<Button
						variant="primary"
						class="w-full justify-center py-3"
						disabled={!canProceedFromEmail}
						onclick={nextStep}
					>
						{trimmedEmail === '' ? 'Продолжить без почты' : 'Далее'}
					</Button>

					{#if trimmedEmail !== '' && !canProceedFromEmail}
						<p class="text-xs leading-relaxed text-gray-500">
							{#if !isEmailValid}
								Проверьте адрес почты — или очистите поле, чтобы пройти опросник без него.
							{:else}
								Чтобы получить результаты на почту, подтвердите согласие на обработку данных — или
								очистите поле email.
							{/if}
						</p>
					{/if}
				</div>
			</div>
		</div>
	{:else if state.currentStep >= 0 && !state.showResults && currentQuestion}
		<div>
			<div class="mx-auto max-w-2xl max-w-[760px]">
				{#if title && !showEmailStep}
					<h2 class="mb-5 font-caveat text-[28px] font-semibold text-foreground lg:text-[34px]">
						{title}
					</h2>
				{/if}
				<div class="mb-6">
					<div class="mb-2 flex justify-end text-xs font-medium text-gray-500">
						<span>Вопрос {state.currentStep + 1} из {questionSteps.length}</span>
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
						<div
							class="t-resize h-full rounded-full bg-primary"
							style="width: {((state.currentStep + 1) / questionSteps.length) * 100}%"
						></div>
					</div>
				</div>

				{#if currentSubheadingText}
					<div
						class="mb-4 rounded-lg bg-background px-3 py-3 text-center text-sm font-medium text-foreground/80 md:text-base"
					>
						{currentSubheadingText}
					</div>
				{/if}

				<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:rounded-2xl md:p-8">
					<QuestionRenderer
						question={currentQuestion}
						value={state.answers[currentQuestion.id]}
						onChange={(value) => {
							state.answers[currentQuestion!.id] = value;
						}}
						shouldDisplay={true}
						disabled={false}
						answers={state.answers}
					/>

					<div class="mt-6 flex gap-3">
						{#if canGoBack}
							<Button
								variant="secondary"
								onclick={prevStep}
								class="flex-1 justify-center border-transparent bg-gray-100 text-foreground hover:bg-gray-200"
							>
								Назад
							</Button>
						{/if}
						<Button
							variant="primary"
							onclick={nextStep}
							disabled={!canProceedQuestion}
							class="flex-1 justify-center"
						>
							Далее
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else if state.showResults}
		<div
			bind:this={resultsSection}
			id="questionnaire-results"
			class="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-8"
		>
			<h2
				class="mt-0 mb-3 font-caveat text-[30px] leading-tight font-semibold text-navy lg:text-[36px]"
			>
				Ваши результаты оценки выгорания
			</h2>

			<p class="mt-0 mb-[30px] text-base leading-[1.6] text-muted-foreground">
				Вы прошли диагностику по методике BAT-23. Ниже представлена подробная детализация вашего
				состояния.
			</p>

			<ScoreDisplay
				score={currentScore.totalScore}
				maxScore={config.scoring.maxScore}
				interpretation={currentScore.interpretation}
				averageScore={currentScore.averageScore}
				maxAverageScore={config.scoring.maxAverageScore}
				subscales={currentScore.subscales}
				beforeRecommendations={undefined}
			/>

			{#if config.nextSteps}
				<NextSteps nextSteps={config.nextSteps} />
			{/if}

			<!-- Индивидуальная интерпретация по шкалам -->
			{#if topSubscales.length > 0}
				<section class="my-4 lg:my-8">
					<h3
						class="mb-5 font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
					>
						Что у вас выражено сильнее всего
					</h3>

					<div class="grid gap-4 {topSubscales.length > 1 ? 'sm:grid-cols-2' : ''}">
						{#each topSubscales as sub}
							{@const recKey = subscaleToRec[sub.id]}
							{@const zone =
								sub.interpretation.color === 'red' || sub.interpretation.color === 'darkred'
									? 'red'
									: 'orange'}
							{@const rec = recKey ? (dimensionRecs[recKey]?.[zone] ?? dimensionRecs[recKey]?.red) : null}
							{#if rec}
								<div class="rounded-2xl bg-card px-6 py-6 sm:px-8 sm:py-7">
									<div class="mb-3 flex items-start gap-2.5">
										<span
											class="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full {zone === 'red'
												? 'bg-red-400'
												: 'bg-orange-400'}"
										></span>
										<p class="leading-snug font-semibold">{rec.title}</p>
									</div>
									<p class="text-[15px] leading-relaxed text-foreground/70">{rec.text}</p>
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}

			{#if currentScore.interpretation.color !== 'green'}
				<!-- About (как в organized-burnout) — не показываем в зелёной зоне -->
				<section>
					<div class="my-4 rounded-2xl bg-card px-6 py-7 sm:px-10 sm:py-9 lg:my-10">
						<h3
							class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
						>
							Как я могу помочь
						</h3>
						<div
							class="flex flex-col gap-4 text-[clamp(15px,1.6vw,17px)] leading-[1.75] text-foreground"
						>
							<p>
								Меня зовут Андрей Калмыков, я клинический психолог. Я работаю со специалистами из IT
								и digital, которые сталкиваются с выгоранием, хронической усталостью,
								прокрастинацией и чувством вины за отдых.
							</p>
							<p>
								До психологии я работал в IT — в веб-разработке и рисёрч-отделах, поэтому мне не
								нужно долго объяснять, почему вечером тянет проверить рабочий чат, а в отпуск берут
								ноутбук «на всякий случай».
							</p>
							<p>Я провожу индивидуальные психологические консультации. Формат работы — онлайн-встречи по 50 минут, обычно раз в неделю.</p>
							<p>В работе я опираюсь на когнитивно-поведенческие подходы (КПТ и ACT) — с широкой исследовательской базой.</p>
							<p>
								На консультациях мы разбираемся, что именно у вас отнимает силы и почему они не
								восстанавливаются. Смотрим, какие рабочие условия, мысли, правила и привычные
								реакции поддерживают перегрузку. Затем шаг за шагом проверяем новые способы работать
								и отдыхать: обозначать границы, раньше замечать истощение, не соглашаться
								автоматически на лишнее и возвращать в жизнь место для восстановления, отношений и
								собственных планов.
							</p>
						</div>
					</div>
				</section>
			{/if}

			<!-- CTA — три варианта в зависимости от зоны результата, в стиле секции «Рекомендации» -->
			<section class="mt-8 md:mt-10">
				{#if currentScore.interpretation.color === 'green'}
					<!-- Зелёная зона: канал -->
					<h3
						class="mb-4 font-caveat text-[28px] font-extrabold tracking-[-0.3px] text-navy lg:text-[34px]"
					>
						Что дальше
					</h3>
					<div class="flex flex-col gap-4 text-[16px] leading-[1.7] text-foreground/80">
						<p>
							Сейчас по ответам не видно выраженных признаков выгорания. Если хотите сохранить
							ресурс и раньше замечать перегрузку, можно начать с канала.
						</p>
						<p>
							Там я пишу о выгорании, отдыхе без чувства вины, прокрастинации, сне и том, как работа
							постепенно начинает занимать слишком много жизни.
						</p>
					</div>
					<div class="mt-6 flex flex-col items-center">
						<ButtonSvg
							href="https://t.me/kalmykov_psy"
							target="_blank"
							rel="noopener noreferrer"
							onclick={() => reachGoal('questionnaire_telegram_click')}
							variant="3"
							mobileWidth="280px"
							mobileHeight="80px"
							width="350px"
							class="mb-3"
						>
							Подписаться на канал
						</ButtonSvg>
					</div>
				{:else}
					<!-- Оранжевая и красная зоны: встреча-знакомство -->
					<h3
						class="mb-4 font-caveat text-[28px] text-[clamp(26px,2.5vw,32px)] font-extrabold tracking-[-0.3px] text-navy"
					>
						Что делать дальше
					</h3>
					<div class="flex flex-col gap-4 text-[clamp(15px,1.6vw,17px)] leading-[1.7]">
						{#if currentScore.interpretation.color === 'orange'}
							<p>
								Если результат похож на то, как вы себя чувствуете, это может быть хорошим моментом
								не ждать ухудшения, а начать психологическую работу с выгоранием: понять, что
								поддерживает перегрузку, и постепенно менять привычные способы работать, отдыхать и
								относиться к себе.
							</p>
						{:else}
							<p>
								Если результат совпадает с вашим состоянием, важно не объяснять это ленью, слабостью
								или недостаточной дисциплиной. В такой зоне часто уже не помогает просто «ещё
								немного отдохнуть» или «собраться».
							</p>
							<p>
								Я предлагаю психологическую работу с выгоранием. Обычно это еженедельные
								онлайн-сессии по 50 минут, на которых мы смотрим, что именно поддерживает истощение,
								какие реакции снова возвращают вас в перегрузку, и постепенно выстраиваем более
								устойчивый способ работать и восстанавливаться.
							</p>
						{/if}
						<p>
							Начать можно со встречи-знакомства. Это короткая встреча, чтобы проверить, подходим ли мы друг другу:
						</p>
						<ul class="flex flex-col gap-1">
							<li>— вы расскажете, что вас беспокоит;</li>
							<li>— я расскажу, что мы можем с этим сделать;</li>
							<li>— встреча длится 20–25 минут;</li>
							<li>— бесплатно и ни к чему не обязывает.</li>
						</ul>
					</div>
					<div class="mt-6 flex flex-col items-center">
						<ButtonSvg
							href="/booking?acquaintance"
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
								href="/booking"
								onclick={() => reachGoal('lead_booking_click')}
								class="block w-full cursor-pointer text-center text-[14px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy lg:text-[16px]"
							>
								Вопросов нет, хочу на терапию
							</a>
						</div>
					</div>
				{/if}

				<div class="mt-12 flex flex-col items-center">
					<ButtonSvg
						mode="button"
						onclick={handleReset}
						variant="1"
						mobileWidth="180px"
						mobileHeight="80px"
						width="190px"
						fill="#e7e2db"
						textColor="#25221f"
					>
						Пройти заново
					</ButtonSvg>
				</div>
			</section>
		</div>
	{/if}
</div>
