<script lang="ts">
	import { tick } from 'svelte';
	import AssessmentPage from '$lib/components/questionnaire/AssessmentPage.svelte';
	import AssessmentQuestion from '$lib/components/questionnaire/AssessmentQuestion.svelte';
	import AssessmentResult, {
		type ResultTone
	} from '$lib/components/questionnaire/AssessmentResult.svelte';
	import AssessmentWizard from '$lib/components/questionnaire/AssessmentWizard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		loadAssessmentState,
		saveAssessmentState
	} from '$lib/utils/questionnaire/assessmentState';

	const title = 'Опросник тревожных симптомов GAD-7';
	const description = 'Оценка выраженности тревожных симптомов за последние две недели';
	const url = 'https://kalmykov.pro/questionnaires/gad7';
	const options = [
		{ label: 'Совсем нет', value: 0 },
		{ label: 'В течение нескольких дней', value: 1 },
		{ label: 'Более чем половину этого времени', value: 2 },
		{ label: 'Почти каждый день', value: 3 }
	];
	const questions = [
		'Чувство тревоги или раздражения',
		'Неспособность справиться со своим беспокойством',
		'Чрезмерное беспокойство по разным поводам',
		'Неспособность расслабляться',
		'Ощущение такого беспокойства, что трудно найти себе место',
		'Склонность быстро испытывать злость или раздражительность',
		'Чувство страха, как будто может случиться что-то ужасное'
	].map((text, index) => ({ id: `q${index + 1}`, text }));

	const storageKey = 'questionnaire-gad7-state';
	const initialState = loadAssessmentState(storageKey, {
		answers: {} as Record<string, number>,
		currentStep: 0,
		showResults: false
	});
	let answers = $state(initialState.answers);
	let currentStep = $state(Math.min(initialState.currentStep, questions.length - 1));
	let showResults = $state(
		initialState.showResults &&
			questions.every((question) => initialState.answers[question.id] !== undefined)
	);
	let resultSection = $state<HTMLElement>();
	const score = $derived(questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0));
	const currentQuestion = $derived(questions[currentStep]);
	const canGoNext = $derived(answers[currentQuestion.id] !== undefined);
	const result = $derived.by((): { severity: string; tone: ResultTone; recommendation: string } => {
		if (score <= 4)
			return {
				severity: 'Минимальная тревожная симптоматика',
				tone: 'green',
				recommendation:
					'По ответам выраженные тревожные симптомы сейчас не обнаружены. Если самочувствие всё же беспокоит, ориентируйтесь на него, а не только на балл.'
			};
		if (score <= 9)
			return {
				severity: 'Лёгкая тревожная симптоматика',
				tone: 'yellow',
				recommendation:
					'Понаблюдайте, в каких ситуациях тревога усиливается и как влияет на сон, концентрацию и повседневную жизнь. При сохранении симптомов имеет смысл обсудить их со специалистом.'
			};
		if (score <= 14)
			return {
				severity: 'Умеренная тревожная симптоматика',
				tone: 'orange',
				recommendation:
					'Результат указывает на заметную выраженность тревожных симптомов. Порог 10 и выше используется для скрининга вероятного тревожного расстройства, но сам по себе не является диагнозом.'
			};
		return {
			severity: 'Тяжёлая тревожная симптоматика',
			tone: 'red',
			recommendation:
				'Выраженность симптомов высокая. Рекомендуется обратиться к специалисту для клинической оценки и обсуждения подходящей помощи.'
		};
	});

	$effect(() => {
		saveAssessmentState(storageKey, { answers, currentStep, showResults });
	});

	function setAnswer(id: string, value: number) {
		answers = { ...answers, [id]: value };
	}
	async function next() {
		if (!canGoNext) return;
		if (currentStep < questions.length - 1) {
			currentStep += 1;
			return;
		}
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
	<title>Опросник тревожных симптомов GAD-7 — онлайн</title>
	<meta
		name="description"
		content="Валидированная русская версия GAD-7 для оценки выраженности тревожных симптомов."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />
</svelte:head>

<AssessmentPage {title} {description} time="2–4 минуты" questions="7 вопросов">
	{#snippet info()}
		<p>
			Русская версия GAD-7 валидирована для общей популяции. Клинические чувствительность и
			специфичность этой адаптации требуют дальнейшего изучения.
		</p>
	{/snippet}
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Оцените частоту за прошедшие две недели"
			canGoBack={currentStep > 0}
			{canGoNext}
			onback={back}
			onnext={next}
			nextLabel={currentStep === questions.length - 1 ? 'Показать результат' : 'Далее'}
		>
			<AssessmentQuestion
				id={currentQuestion.id}
				number={currentStep + 1}
				text={currentQuestion.text}
				{options}
				value={answers[currentQuestion.id]}
				onchange={(value) => setAnswer(currentQuestion.id, value)}
			/>
		</AssessmentWizard>
	{:else}
		<div bind:this={resultSection}>
			<AssessmentResult
				value={score}
				max={21}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
				note="GAD-7 оценивает симптомы и не заменяет диагностическое интервью."
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
