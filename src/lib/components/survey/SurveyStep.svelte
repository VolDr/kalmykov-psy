<script lang="ts">
	import { browser } from '$app/environment';
	import { reachGoal } from '$lib/metrika';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import ScoreDisplay from './ScoreDisplay.svelte';
	import NextSteps from './NextSteps.svelte';
	import type { SurveyConfig } from '$lib/data/surveys/types';
	import {
		calculateScore,
		evaluateWarnings,
		shouldDisplayQuestion
	} from '$lib/utils/survey/scoringEngine';
	import { formatResultsForClipboard } from '$lib/utils/survey/formatResults';
	import Button from '../ui/Button.svelte';

	
	type Props = {
		config: SurveyConfig;
	};

	let { config }: Props = $props();

	const storageKey = `survey-${config.id}-wizard-state`;

	const questionSteps = config.questions.filter((q) => q.type !== 'subheading');

	function loadState() {
		if (!browser) {
			return {
				answers: {} as Record<string, number>,
				email: '',
				consent: false,
				currentStep: -1,
				showResults: false,
				copied: false
			};
		}

		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					answers: parsed.answers || {},
					email: parsed.email || '',
					consent: parsed.consent || false,
					currentStep: parsed.currentStep ?? -1,
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
			currentStep: -1,
			showResults: false,
			copied: false
		};
	}

	let state = $state(loadState());
	let isMounted = $state(false);
	const firedProgressMilestones = new Set<number>();
	let resultsSection: HTMLElement;
	let hasInitialScrolled = false;

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

	let isEmailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email));
	let canProceedFromEmail = $derived(isEmailValid && state.consent);

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

	function sendResultsEmail() {
		if (!browser) return;

		const data = new FormData();
		data.append('email', state.email);
		data.append('score', currentScore.averageScore?.toFixed(2) || currentScore.totalScore.toString());
		data.append('severity', currentScore.interpretation.severity);
		
		data.append('total_recommendation', currentScore.interpretation.recommendation);

		const colorMap: Record<string, string> = { green: '#10b981', orange: '#f59e0b', red: '#ef4444' };
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
		}).catch(err => console.error('Silent email send error:', err));
	}

	function nextStep() {
		if (state.currentStep === -1 && !canProceedFromEmail) return;
		if (state.currentStep >= 0 && !canProceedQuestion) return;

		if (state.currentStep === -1) {
			reachGoal('survey_email_submitted');
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
					reachGoal(`survey_progress_${milestone}`);
				}
			}
		} else {
			state.showResults = true;
			reachGoal('survey_completed', {
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

<div class="space-y-6 py-6 md:space-y-10 md:py-12 px-5 xl:px-0">
     {#if !isMounted}
        <!-- Лоадер или скелетон, пока подтягивается стейт из localStorage -->
        <div class="flex min-h-[300px] items-center justify-center">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
	{:else if state.currentStep === -1 && !state.showResults}
		<div>
			<div class="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-8 md:rounded-2xl">
				<h2 class="mb-4 text-xl font-semibold text-foreground md:text-xl">Опросник на уровень выгорания</h2>
				<p class="mb-8 text-sm leading-relaxed text-foreground/70">
					Укажите вашу электронную почту. Ваши результаты придут на неё.
				</p>

				<div class="space-y-6">
					<div>
						<input
							type="email"
							id="email"
							bind:value={state.email}
							class="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
							placeholder="mail@example.ru"
						/>
					</div>

					<label class="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							bind:checked={state.consent}
							class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span class="text-sm text-gray-600">
							Я согласен(-на) на <a href="/privacy" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 transition-colors hover:text-foreground">обработку персональных данных</a>
						</span>
					</label>

					<Button 
						variant="primary" 
						class="w-full justify-center py-3" 
						disabled={!canProceedFromEmail} 
						onclick={nextStep}
					>
						Далее
					</Button>
				</div>
			</div>
		</div>

	{:else if state.currentStep >= 0 && !state.showResults && currentQuestion}
		<div>
			<div class="mx-auto max-w-2xl max-w-[760px]">
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
					<div class="mb-4 rounded-lg bg-background px-3 py-3 text-center text-sm font-medium text-foreground/80 md:text-base">
						{currentSubheadingText}
					</div>
				{/if}

				<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:p-8 md:rounded-2xl">
					<QuestionRenderer
						question={currentQuestion}
						value={state.answers[currentQuestion.id]}
						onChange={(value) => { state.answers[currentQuestion!.id] = value; }}
						shouldDisplay={true}
						disabled={false}
						answers={state.answers}
					/>

					<div class="mt-6 flex gap-3  ">
						<Button variant="secondary" onclick={prevStep} class="flex-1 justify-center bg-gray-100 border-transparent text-foreground hover:bg-gray-200">
							Назад
						</Button>
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
		<div bind:this={resultsSection} id="survey-results" class="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-8 md:rounded-2xl">
	


	<h2 class="mb-3 mt-0 text-[22px] font-semibold leading-tight text-foreground md:text-2xl">
		Ваши результаты оценки выгорания
	</h2>

	<p class="mb-[30px] mt-0 text-base leading-[1.6] text-muted-foreground">
		Вы прошли диагностику по методике BAT-23. Ниже представлена подробная детализация
		вашего состояния.
	</p>

	<ScoreDisplay
		score={currentScore.totalScore}
		maxScore={config.scoring.maxScore}
		interpretation={currentScore.interpretation}
		averageScore={currentScore.averageScore}
		maxAverageScore={config.scoring.maxAverageScore}
		subscales={currentScore.subscales}
	/>

			{#if config.nextSteps}
				<NextSteps nextSteps={config.nextSteps} />
			{/if}

			<div class="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-center mt-12">
				<Button
					href="/"
					onclick={() => reachGoal('lead_cta_click')}
					variant="secondary"
					class="w-full self-start px-5 py-2 text-base text-white bg-foreground outline-none hover:bg-foreground/80 hover:text-white transition-colors duration-200 sm:self-auto sm:w-auto justify-center"
				>
					Хочу снизить уровень выгорания
				</Button>
				<Button variant="primary" onclick={handleReset} class="w-full sm:w-auto justify-center">
					Пройти заново
				</Button>
			</div>

	<div
	class="mt-12 rounded-2xl border border-primary bg-white px-4 py-6 text-center md:mt-12 md:px-8 md:py-8"
>
	<h3 class="mb-3 mt-0  text-xl font-semibold leading-tight text-foreground">
			Следите за полезными материалами
	</h3>

	<p class="mx-auto mb-3 max-w-[460px] leading-[1.6] text-muted-foreground">
		В моем Telegram-канале я регулярно рассказываю о том, как справляться с выгоранием, выстраивать здоровые границы на работе, управлять стрессом и возвращать себе энергию.
				
	</p>

	<a href="https://t.me/kalmykov_psy" target="_blank" rel="noopener noreferrer" onclick={() => reachGoal('survey_telegram_click')} class="inline-block">
				<Button variant="primary" onclick={handleReset} class="w-full sm:w-auto justify-center">
						Подписаться
					</Button>
				</a>
</div>
		</div>
	{/if}
</div>