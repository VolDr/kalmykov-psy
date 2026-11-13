<script lang="ts">
	import { tick } from 'svelte';
	import AssessmentPage from '#lib/components/questionnaire/AssessmentPage.svelte';
	import AssessmentQuestion from '#lib/components/questionnaire/AssessmentQuestion.svelte';
	import AssessmentResult from '#lib/components/questionnaire/AssessmentResult.svelte';
	import AssessmentWizard from '#lib/components/questionnaire/AssessmentWizard.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import { mzq15Questions, scoreMzq15 } from '#lib/data/questionnaires/mzq15.js';
	import { loadAssessmentState, saveAssessmentState } from '#lib/utils/questionnaire/assessmentState.js';

	const options = [
		{ label: 'Совершенно не согласен', value: 1 },
		{ label: 'Скорее не согласен', value: 2 },
		{ label: 'Ни согласен, ни не согласен', value: 3 },
		{ label: 'Скорее согласен', value: 4 },
		{ label: 'Полностью согласен', value: 5 }
	];

	const storageKey = 'questionnaire-mzq15-state';
	const initialState = loadAssessmentState(storageKey, {
		answers: {} as Record<string, number>,
		currentStep: 0,
		showResults: false
	});
	let answers = $state(initialState.answers);
	let currentStep = $state(Math.min(initialState.currentStep, mzq15Questions.length - 1));
	let showResults = $state(
		initialState.showResults && scoreMzq15(initialState.answers) !== null
	);
	let resultSection = $state<HTMLElement>();
	const currentQuestion = $derived(mzq15Questions[currentStep]);
	const canGoNext = $derived(
		Number.isInteger(answers[currentQuestion.id]) &&
			answers[currentQuestion.id] >= 1 && answers[currentQuestion.id] <= 5
	);
	const result = $derived(scoreMzq15(answers));

	$effect(() => {
		saveAssessmentState(storageKey, { answers, currentStep, showResults });
	});

	function setAnswer(id: string, value: number) {
		answers = { ...answers, [id]: value };
	}
	async function next() {
		if (!canGoNext) return;
		if (currentStep < mzq15Questions.length - 1) {
			currentStep += 1;
			return;
		}
		if (!scoreMzq15(answers)) return;
		showResults = true;
		await tick();
		resultSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	function back() {
		if (currentStep > 0) currentStep -= 1;
	}
	function reset() {
		answers = {};
		currentStep = 0;
		showResults = false;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Опросник ментализации MZQ-15 онлайн — 15 вопросов</title>
	<meta name="description" content="Опросник ментализации MZQ-15 на русском языке: 15 вопросов о саморефлексии, эмоциональном осознавании и регуляции аффекта. Исследовательский перевод без диагностических порогов." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Опросник ментализации (MZQ-15)"
	description="Как вы воспринимаете свои чувства и осмысляете внутренние переживания"
	time="3–5 минут"
	questions="15 утверждений"
	methodologyKey="mzq15"
>
	{#if !showResults || !result}
		<AssessmentWizard
			step={currentStep + 1}
			total={mzq15Questions.length}
			instruction="Насколько вы согласны с утверждением? Выбирайте ответ, который лучше всего отражает ваш обычный опыт."
			canGoBack={currentStep > 0}
			{canGoNext}
			onback={back}
			onnext={next}
			nextLabel={currentStep === mzq15Questions.length - 1 ? 'Показать результат' : 'Далее'}
		>
			<AssessmentQuestion
				id={currentQuestion.id}
				text={currentQuestion.text}
				{options}
				value={answers[currentQuestion.id]}
				onchange={(value) => setAnswer(currentQuestion.id, value)}
			/>
		</AssessmentWizard>
	{:else}
		<div bind:this={resultSection}>
			<AssessmentResult
				title="Результат MZQ-15"
				value={result.mean}
				max={5}
				decimals={2}
				severity="Средний балл согласия с утверждениями"
				tone="neutral"
				subscales={result.subscales}
				recommendation="Более высокий балл означает большее согласие с утверждениями о трудностях ментализации. Подшкалы описывают разные аспекты переживаний: саморефлексию, осознавание эмоций, режим психической эквивалентности и регуляцию аффекта. Это не диагноз и не нормативная оценка уровня ментализации."
				note={`Сумма ответов: ${result.total} из 75 (минимум 15). Здесь использован прямой средний балл согласия; в исходной статье направление итогового показателя обратное. Русскоязычный согласованный перевод пока не прошёл отдельную психометрическую валидацию; клинические пороги не применяются.`}
			>
				{#snippet actions()}<Button
					type="button"
					variant="secondary"
					onclick={reset}
					class="bg-primary text-primary-foreground outline-none hover:bg-primary-light"
					>Пройти заново</Button
				>{/snippet}
			</AssessmentResult>
		</div>
	{/if}
</AssessmentPage>
