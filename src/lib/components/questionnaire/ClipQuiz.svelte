<script lang="ts">
	import { browser } from '$app/environment';
	import { reachGoal } from '$lib/metrika';
	import { lmLog } from '$lib/client/lmDebug';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import Button from '../ui/Button.svelte';
	import ButtonSvg from '../ui/ButtonSvg.svelte';
	import type { QuestionnaireConfig } from '$lib/data/questionnaires/types';
	import { calculateScore, shouldDisplayQuestion } from '$lib/utils/questionnaire/scoringEngine';

	type SavedResult = {
		severity: string;
		color: string;
		averageScore: number | null;
		deeplink: string | null;
	};

	type Props = {
		config: QuestionnaireConfig;
		articleSlug: string;
		resultHeading: string;
		resultTextGreen: string;
		resultTextOrange: string;
		resultTextRed: string;
		botCtaText: string;
		botCtaButtonText: string;
		/**
		 * Опросник дошёл до экрана результатов. Страница вешает сюда своё событие
		 * лид-магнита (lm_<магнит>_completed), чтобы по нему запускалась
		 * догревающая цепочка — как по opened и read75.
		 */
		oncomplete?: () => void;
	};

	let {
		config,
		articleSlug,
		resultHeading,
		resultTextGreen,
		resultTextOrange,
		resultTextRed,
		botCtaText,
		botCtaButtonText,
		oncomplete
	}: Props = $props();

	const storageKey = `clip-${articleSlug}-quiz`;

	const questionSteps = config.questions.filter((q) => q.type !== 'subheading');

	function loadState() {
		const initial = {
			answers: {} as Record<string, number>,
			currentStep: 0,
			showResults: false,
			result: null as SavedResult | null
		};
		if (!browser) return initial;
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					answers: parsed.answers || {},
					currentStep: Math.max(0, parsed.currentStep ?? 0),
					showResults: parsed.showResults || false,
					result: parsed.result ?? null
				};
			}
		} catch (err) {
			console.error(err);
		}
		return initial;
	}

	let quizState = $state(loadState());
	let submitState = $state<'idle' | 'loading' | 'error'>('idle');

	$effect(() => {
		if (!browser) return;
		localStorage.setItem(
			storageKey,
			JSON.stringify({
				answers: quizState.answers,
				currentStep: quizState.currentStep,
				showResults: quizState.showResults,
				result: quizState.result
			})
		);
	});

	let currentQuestion = $derived(
		quizState.currentStep >= 0 && quizState.currentStep < questionSteps.length
			? questionSteps[quizState.currentStep]
			: null
	);

	let canProceed = $derived.by(() => {
		if (!currentQuestion) return false;
		if (!currentQuestion.required) return true;
		return quizState.answers[currentQuestion.id] !== undefined;
	});

	let currentSubheadingText = $derived.by(() => {
		if (!currentQuestion) return null;
		const qIndex = config.questions.findIndex((q) => q.id === currentQuestion.id);
		for (let i = qIndex - 1; i >= 0; i--) {
			const q = config.questions[i];
			if (q.type === 'subheading') {
				const isAlternative = q.textCondition && q.textCondition(quizState.answers);
				return isAlternative && q.alternativeText ? q.alternativeText : q.text;
			}
		}
		return null;
	});

	let currentScore = $derived(calculateScore(quizState.answers, config));

	// Тёплая палитра — как в ScoreDisplay
	const meterColors: Record<string, string> = {
		green: '#7FB069',
		yellow: '#E9B84E',
		orange: '#E0945C',
		red: '#D86A55',
		darkred: '#B23B3B'
	};
	const textColors: Record<string, string> = {
		green: 'text-[#5E9248]',
		yellow: 'text-[#C28A12]',
		orange: 'text-[#C26A38]',
		red: 'text-[#C24B3A]',
		darkred: 'text-[#9E2F2F]'
	};

	let resultZoneText = $derived.by(() => {
		const color = currentScore.interpretation.color;
		if (color === 'green') return resultTextGreen;
		if (color === 'orange' || color === 'yellow') return resultTextOrange;
		return resultTextRed;
	});

	let mainPercent = $derived(
		currentScore.averageScore !== undefined
			? Math.min(
					100,
					Math.round((currentScore.averageScore / (config.scoring.maxAverageScore ?? 5)) * 100)
				)
			: Math.min(100, Math.round((currentScore.totalScore / config.scoring.maxScore) * 100))
	);

	async function submitResults() {
		submitState = 'loading';
		try {
			const response = await fetch('/api/quiz-results', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ articleSlug, answers: quizState.answers })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			quizState.result = (await response.json()) as SavedResult;
			submitState = 'idle';
			lmLog('опросник: результат сохранён', {
				зона: quizState.result.severity,
				кнопкаВБота: quizState.result.deeplink ?? 'нет — не удалось узнать username бота'
			});
		} catch (err) {
			console.error('[clip-quiz] Не удалось сохранить результат:', err);
			submitState = 'error';
		}
	}

	function nextStep() {
		if (!canProceed) return;

		let nextIdx = quizState.currentStep + 1;
		while (nextIdx < questionSteps.length) {
			if (shouldDisplayQuestion(questionSteps[nextIdx], quizState.answers)) break;
			nextIdx++;
		}

		if (nextIdx < questionSteps.length) {
			quizState.currentStep = nextIdx;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			quizState.showResults = true;
			reachGoal('clip_quiz_completed', {
				article: articleSlug,
				result: currentScore.interpretation.severity
			});
			oncomplete?.();
			submitResults();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		if (quizState.showResults) {
			quizState.showResults = false;
			return;
		}
		let prevIdx = quizState.currentStep - 1;
		while (prevIdx >= 0) {
			if (shouldDisplayQuestion(questionSteps[prevIdx], quizState.answers)) break;
			prevIdx--;
		}
		if (prevIdx >= 0) {
			quizState.currentStep = prevIdx;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function handleBotClick() {
		reachGoal('clip_bot_results_click', {
			article: articleSlug,
			result: currentScore.interpretation.severity
		});
	}
</script>

{#if !quizState.showResults && currentQuestion}
	<div class="mx-auto max-w-2xl">
		<div class="mb-3 md:mb-6">
			<div class="mb-1.5 flex justify-end text-xs font-medium text-gray-500 md:mb-2">
				<span>Вопрос {quizState.currentStep + 1} из {questionSteps.length}</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
				<div
					class="t-resize h-full rounded-full bg-primary"
					style="width: {((quizState.currentStep + 1) / questionSteps.length) * 100}%"
				></div>
			</div>
		</div>

		{#if currentSubheadingText}
			<div
				class="mb-3 rounded-lg bg-background px-3 py-2 text-center text-[13px] leading-snug font-medium text-foreground/80 md:mb-4 md:py-3 md:text-base"
			>
				{currentSubheadingText}
			</div>
		{/if}

		<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:rounded-2xl md:p-8">
			<QuestionRenderer
				question={currentQuestion}
				value={quizState.answers[currentQuestion.id]}
				onChange={(value) => {
					quizState.answers[currentQuestion!.id] = value;
				}}
				shouldDisplay={true}
				disabled={false}
				answers={quizState.answers}
			/>

			<!-- На мобильном прилипают к низу экрана: «Далее» видна без прокрутки -->
			<div
				class="sticky bottom-0 z-10 -mx-4 mt-4 -mb-4 flex gap-3 rounded-b-xl border-t border-gray-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:mt-6 md:mb-0 md:rounded-none md:border-0 md:bg-transparent md:p-0"
			>
				{#if quizState.currentStep > 0}
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
					disabled={!canProceed}
					class="flex-1 justify-center"
				>
					Далее
				</Button>
			</div>
		</div>
	</div>
{:else if quizState.showResults}
	<div
		class="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-8"
	>
		<h2
			class="mt-0 mb-5 font-caveat text-[30px] leading-tight font-semibold text-navy lg:text-[36px]"
		>
			{resultHeading}
		</h2>

		<!-- Общий показатель — как в ScoreDisplay, без разбивки по сферам -->
		<section class="rounded-3xl bg-card p-6 md:p-8">
			<div class="mb-4 text-[14px] font-semibold tracking-wide text-muted-foreground uppercase">
				Общий показатель
			</div>
			<div class="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-[#e4dccb]">
				<div
					class="h-full rounded-full transition-[width] duration-500"
					style="width: {mainPercent}%; background: {meterColors[
						currentScore.interpretation.color
					] ?? meterColors.green};"
				></div>
			</div>
			<div class="flex flex-wrap items-end justify-between gap-2">
				<div
					class="text-[34px] leading-none font-extrabold md:text-[44px] {textColors[
						currentScore.interpretation.color
					] ?? textColors.green}"
				>
					{#if currentScore.averageScore !== undefined}
						{currentScore.averageScore.toFixed(2)}
						<span class="text-[18px] font-semibold text-foreground/45 md:text-[24px]">
							/ {(config.scoring.maxAverageScore ?? 5).toFixed(2)}
						</span>
					{:else}
						{currentScore.totalScore}
						<span class="text-[18px] font-semibold text-foreground/45 md:text-[24px]">
							/ {config.scoring.maxScore}
						</span>
					{/if}
				</div>
				<div
					class="text-[18px] font-extrabold md:text-[20px] {textColors[
						currentScore.interpretation.color
					] ?? textColors.green}"
				>
					{currentScore.interpretation.severity}
				</div>
			</div>
		</section>

		{#if resultZoneText}
			<div class="mt-6 flex flex-col gap-4 text-[clamp(15px,1.6vw,17px)] leading-[1.7]">
				{#each resultZoneText.split('\n\n') as paragraph}
					<p><MarkdownLink text={paragraph} /></p>
				{/each}
			</div>
		{/if}

		<!-- Полный разбор по сферам — в боте -->
		<section class="mt-6">
			<div class="flex flex-col gap-4 text-[clamp(15px,1.6vw,17px)] leading-[1.7]">
				{#each botCtaText.split('\n\n') as paragraph}
					<p><MarkdownLink text={paragraph} /></p>
				{/each}
			</div>
			<div class="mt-6 flex flex-col items-center">
				{#if quizState.result?.deeplink}
					<ButtonSvg
						href={quizState.result.deeplink}
						target="_blank"
						rel="noopener noreferrer"
						onclick={handleBotClick}
						variant="3"
						mobileWidth="280px"
						mobileHeight="80px"
						width="350px"
					>
						{botCtaButtonText}
					</ButtonSvg>
				{:else if submitState === 'loading'}
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
					></div>
				{:else}
					<p class="mb-3 text-center text-sm text-muted-foreground">
						Не удалось подготовить ссылку на разбор — проверьте соединение и попробуйте ещё раз.
					</p>
					<Button variant="primary" onclick={submitResults} class="justify-center">
						Попробовать снова
					</Button>
				{/if}
			</div>
		</section>
	</div>
{/if}
