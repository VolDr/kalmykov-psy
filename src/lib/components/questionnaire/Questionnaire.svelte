<!--
  Заменяет: src/lib/components/questionnaire/Questionnaire.svelte
  Дизайн перенесён из макета: плашка «Важно», нумерованные вопросы (Caveat),
  варианты-карточки, золотая кнопка, аккуратный блок результата.
  Логика (скоринг, валидация, localStorage, копирование) НЕ изменена.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import InfoSection from './InfoSection.svelte';
	import WarningBox from './WarningBox.svelte';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import ScoreDisplay from './ScoreDisplay.svelte';
	import NextSteps from './NextSteps.svelte';
	import type { QuestionnaireConfig } from '$lib/data/questionnaires/types';
	import {
		calculateScore,
		validateAnswers,
		evaluateWarnings,
		shouldDisplayQuestion
	} from '$lib/utils/questionnaire/scoringEngine';
	import { formatResultsForClipboard } from '$lib/utils/questionnaire/formatResults';
	import Button from '../ui/Button.svelte';

	type Props = {
		config: QuestionnaireConfig;
	};

	let { config }: Props = $props();

	const storageKey = `questionnaire-${config.id}-state`;

	// Порядковые номера для всех вопросов кроме подзаголовков
	const questionNumbers: Record<string, number> = (() => {
		const map: Record<string, number> = {};
		let n = 0;
		for (const q of config.questions) {
			if (q.type !== 'subheading') {
				n += 1;
				map[q.id] = n;
			}
		}
		return map;
	})();

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
			console.error(err);
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

	let resultsSection: HTMLElement | undefined = $state(undefined);
	let hasInitialScrolled = false;

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

	$effect(() => {
		if (state.showResults && resultsSection && !hasInitialScrolled) {
			resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			hasInitialScrolled = true;
		}
	});

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
		} else {
			await tick();
			const firstMissing = config.questions.find(
				(q) =>
					q.required &&
					q.type !== 'subheading' &&
					state.answers[q.id] === undefined &&
					shouldDisplayQuestion(q, state.answers)
			);

			if (firstMissing) {
				const element = document.getElementById(`question-${firstMissing.id}`);
				element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
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
			console.error(err);
		}
	}
</script>

<div class="space-y-10 py-8 md:space-y-12 md:py-12">
	<!-- Information Sections (плашка «Важно» и т.п.) -->
	<div class="space-y-4 px-5 xl:px-0">
		{#each Object.entries(config.infoSections) as [key, section]}
			<InfoSection {section} sectionKey={`${config.id}-${key}`} />
		{/each}
	</div>

	<div class="h-px w-full bg-[#d8cfbc]"></div>

	<!-- Questionnaire Form -->
	<div class="px-5 xl:px-0">
		<form onsubmit={handleSubmit} class="space-y-10">
			{#each config.questions as question}
				{@const shouldShow = shouldDisplayQuestion(question, state.answers)}

				<div id="question-{question.id}">
					<QuestionRenderer
						{question}
						value={state.answers[question.id]}
						onChange={(value) => handleAnswerChange(question.id, value)}
						shouldDisplay={shouldShow}
						disabled={state.showResults}
						answers={state.answers}
						number={questionNumbers[question.id]}
					/>

					<!-- Show error if required question not answered after submit attempt -->
					{#if state.attemptedSubmit && question.required && question.type !== 'subheading' && state.answers[question.id] === undefined && shouldShow}
						<p class="mt-3 text-sm font-medium text-destructive md:ml-[58px]">
							Пожалуйста, ответьте на этот вопрос
						</p>
					{/if}
				</div>
			{/each}

			<!-- Show warnings during form filling -->
			{#if activeWarnings.length > 0 && !state.showResults}
				<div class="space-y-4 pt-2">
					{#each activeWarnings as warning}
						<WarningBox {warning} />
					{/each}
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="flex flex-wrap items-center gap-5 pt-2">
				<Button class="px-9 py-3.5 text-[17px]">Посмотреть результат</Button>
				{#if !validation.isValid}
					<span class="text-[15px] text-muted-foreground">Ответьте на все вопросы</span>
				{/if}
			</div>

			<!-- Validation Error Message -->
			{#if state.attemptedSubmit && !validation.isValid}
				<div class="rounded-2xl bg-card px-5 py-4">
					<p class="text-sm text-foreground">
						Пожалуйста, ответьте на все обязательные вопросы перед отправкой.
					</p>
				</div>
			{/if}
		</form>
	</div>

	<!-- Results Section -->
	{#if state.showResults}
		<div
			bind:this={resultsSection}
			id="questionnaire-results"
			class="scroll-mt-6 space-y-6 px-5 xl:px-0"
		>
			<div class="h-px w-full bg-[#d8cfbc]"></div>

			<div>
				<h2
					class="text-[28px] leading-tight font-extrabold tracking-[-0.5px] text-navy md:text-[34px]"
				>
					Результаты оценки
				</h2>
			</div>

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
			<div class="flex flex-col gap-4 pt-2 sm:flex-row sm:items-stretch sm:justify-center">
				<Button variant="primary" onclick={handleReset} class="w-full justify-center sm:w-auto">
					Пройти заново
				</Button>

				<Button
					variant="primary"
					onclick={handleCopyResults}
					class="relative w-full justify-center overflow-hidden sm:w-auto"
				>
					<span class="invisible flex items-center justify-center gap-2" aria-hidden="true">
						<span class="icon-[lucide--copy] h-4 w-4"></span>
						<span>Скопировать</span>
					</span>

					<span class="absolute inset-0 flex items-center justify-center gap-2">
						{#if state.copied}
							<span class="icon-[lucide--check] h-4 w-4"></span>
							<span>Скопировано</span>
						{:else}
							<span class="icon-[lucide--copy] h-4 w-4"></span>
							<span>Скопировать</span>
						{/if}
					</span>
				</Button>

				<a
					href="https://t.me/m/UJBYiSocNzE6"
					target="_blank"
					rel="noopener noreferrer"
					class="flex w-full sm:w-auto"
				>
					<Button variant="primary" class="h-full w-full justify-center">
						Получить консультацию
					</Button>
				</a>
			</div>
		</div>
	{/if}
</div>
