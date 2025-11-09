<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import InfoSection from './InfoSection.svelte';
	import WarningBox from './WarningBox.svelte';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import ScoreDisplay from './ScoreDisplay.svelte';
	import NextSteps from './NextSteps.svelte';
	import type { SurveyConfig } from '$lib/data/surveys/types';
	import {
		calculateScore,
		validateAnswers,
		evaluateWarnings,
		shouldDisplayQuestion
	} from '$lib/utils/survey/scoringEngine';
	import { formatResultsForClipboard } from '$lib/utils/survey/formatResults';
	import Button from '../ui/Button.svelte';

	type Props = {
		config: SurveyConfig;
	};

	let { config }: Props = $props();

	const storageKey = `survey-${config.id}-state`;

	// Load state from localStorage
	function loadState() {
		if (!browser) {
			return {
				answers: {} as Record<string, number>,
				showResults: false,
				attemptedSubmit: false,
				copied: false,
				formKey: 0
			};
		}

		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					answers: parsed.answers || {},
					showResults: parsed.showResults || false,
					attemptedSubmit: false,
					copied: false,
					formKey: 0
				};
			}
		} catch (err) {
			console.error('Failed to load survey state:', err);
		}

		return {
			answers: {} as Record<string, number>,
			showResults: false,
			attemptedSubmit: false,
			copied: false,
			formKey: 0
		};
	}

	let state = $state(loadState());

	let resultsSection: HTMLElement;

	// Save state to localStorage whenever answers or showResults change
	$effect(() => {
		if (browser) {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					answers: state.answers,
					showResults: state.showResults
				})
			);
		}
	});

	// Derived state
	let currentScore = $derived(calculateScore(state.answers, config));
	let activeWarnings = $derived(evaluateWarnings(state.answers, config));
	let validation = $derived(validateAnswers(state.answers, config));

	function handleAnswerChange(questionId: string, value: number) {
		state.answers = {
			...state.answers,
			[questionId]: value
		};
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		state.attemptedSubmit = true;

		if (validation.isValid) {
			state.showResults = true;
			await tick();
			resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleReset() {
		state.answers = {};
		state.showResults = false;
		state.attemptedSubmit = false;
		state.copied = false;
		state.formKey = state.formKey + 1;
		if (browser) {
			localStorage.removeItem(storageKey);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function handleCopyResults() {
		if (!browser) return;

		const resultsText = formatResultsForClipboard(
			config,
			currentScore,
			activeWarnings,
			window.location.origin
		);

		try {
			await navigator.clipboard.writeText(resultsText);
			state.copied = true;
			setTimeout(() => (state.copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy results:', err);
		}
	}
</script>

<div class="py-8 md:py-12 space-y-8 md:space-y-10">
	<!-- Information Sections -->
	<div class="space-y-4 px-5">
		{#each Object.entries(config.infoSections) as [key, section]}
			<InfoSection {section} sectionKey={`${config.id}-${key}`} />
		{/each}
	</div>

	<!-- Survey Form -->
	<div class="px-5">
		<div class="p-6 md:p-8">
			<form onsubmit={handleSubmit} class="space-y-8" >
				{#each config.questions as question}
					{@const shouldShow = shouldDisplayQuestion(question, state.answers)}

					<div>
						<QuestionRenderer
							{question}
							value={state.answers[question.id]}
							onChange={(value) => handleAnswerChange(question.id, value)}
							shouldDisplay={shouldShow}
							disabled={state.showResults}
							answers={state.answers}
						/>

						<!-- Show error if required question not answered after submit attempt -->
						{#if state.attemptedSubmit && question.required && question.type !== 'subheading' && state.answers[question.id] === undefined && shouldShow}
							<p class="mt-2 text-sm text-red-600">Пожалуйста, ответьте на этот вопрос</p>
						{/if}
					</div>
				{/each}

				<!-- Show warnings during form filling -->
				{#if activeWarnings.length > 0 && !state.showResults}
					<div class="space-y-4 pt-4">
						{#each activeWarnings as warning}
							<WarningBox {warning} />
						{/each}
					</div>
				{/if}

				<!-- Current Score Display (optional, can be hidden) -->
				{#if Object.keys(state.answers).length > 0 && !state.showResults}
					<div class="pt-4 border-t border-[#F2F0EF]">
						<div class="flex items-center justify-between text-base md:text-lg">
							<span class="text-black opacity-70">Текущий балл:</span>
							<!-- Uncomment to show current score
							<span class="font-semibold text-[#191919]">
								{#if currentScore.averageScore !== undefined}
									{currentScore.averageScore.toFixed(2)} / {(config.scoring.maxAverageScore ?? 5).toFixed(2)}
								{:else}
									{currentScore.totalScore} / {config.scoring.maxScore}
								{/if}
							</span>
							-->
						</div>
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="flex gap-4 pt-4">
					<Button 
						class="flex-1  px-4 py-2 cursor-pointer"
					>
						Посмотреть результат
					</Button>
				</div>

				<!-- Validation Error Message -->
				{#if state.attemptedSubmit && !validation.isValid}
					<div class="p-4 bg-[#F2F0EF]">
						<p class="text-sm text-black">
							Пожалуйста, ответьте на все обязательные вопросы перед отправкой.
						</p>
					</div>
				{/if}
			</form>
		</div>
	</div>

	<!-- Results Section -->
	{#if state.showResults}
		<div bind:this={resultsSection} id="survey-results" class="space-y-6 scroll-mt-6 px-5">
			<div class="h-px bg-[#F2F0EF]"></div>

			<h2 class="text-[24px] md:text-[28px] lg:text-[32px] font-semibold text-[#191919]">
				Результаты оценки
			</h2>

			<!-- Critical Warnings (show prominently in results) -->
			{#if activeWarnings.length > 0}
				<div class="space-y-4">
					{#each activeWarnings as warning}
						<WarningBox {warning} />
					{/each}
				</div>
			{/if}

			<!-- Score Display -->
			<ScoreDisplay
				score={currentScore.totalScore}
				maxScore={config.scoring.maxScore}
				interpretation={currentScore.interpretation}
				averageScore={currentScore.averageScore}
				maxAverageScore={config.scoring.maxAverageScore}
				subscales={currentScore.subscales}
			/>

			<!-- Next Steps -->
			{#if config.nextSteps}
				<NextSteps nextSteps={config.nextSteps} />
			{/if}

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4">
				<Button
					onclick={handleReset}
					class="flex-1 bg-white  "
				>
					Пройти опрос заново
				</Button>
				<Button
					onclick={handleCopyResults}
					class="flex-1 gap-2 bg-white   "
				>
					{#if state.copied}
						<span class="icon-[lucide--check] w-4 h-4"></span>
						Скопировано
					{:else}
						<span class="icon-[lucide--copy] w-4 h-4"></span>
						Скопировать результаты
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</div>
