<script lang="ts">
	import { tick } from 'svelte';
	import AssessmentPage from '$lib/components/questionnaire/AssessmentPage.svelte';
	import AssessmentQuestion from '$lib/components/questionnaire/AssessmentQuestion.svelte';
	import AssessmentResult from '$lib/components/questionnaire/AssessmentResult.svelte';
	import AssessmentWizard from '$lib/components/questionnaire/AssessmentWizard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		loadAssessmentState,
		saveAssessmentState
	} from '$lib/utils/questionnaire/assessmentState';

	const url = 'https://kalmykov.pro/questionnaires/bat4';
	const options = [
		{ label: 'Никогда', value: 1 },
		{ label: 'Редко', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Часто', value: 4 },
		{ label: 'Постоянно', value: 5 }
	];
	const questions = [
		'На работе я чувствую душевную усталость',
		'Мне трудно найти в себе энтузиазм к моей работе',
		'Когда я работаю, мне сложно сконцентрироваться',
		'На работе я могу слишком остро реагировать, сам(а) того не желая'
	].map((text, index) => ({ id: `q${index + 1}`, text }));

	const storageKey = 'questionnaire-bat4-state';
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
	const currentQuestion = $derived(questions[currentStep]);
	const canGoNext = $derived(answers[currentQuestion.id] !== undefined);
	const mean = $derived(
		questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0) / questions.length
	);

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
	<title>Опросник выгорания BAT-4 онлайн</title>
	<meta
		name="description"
		content="BAT-4 — ультракороткая шкала для группового и организационного скрининга выгорания без неподтверждённых индивидуальных порогов."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />
</svelte:head>

<AssessmentPage
	title="Опросник выгорания BAT-4"
	description="Ультракороткая форма для группового и организационного скрининга"
	time="1–2 минуты"
	questions="4 вопроса"
>
	{#snippet info()}
		<p>
			BAT-4 разработан для оценки показателей в группах и организациях. Опубликованных границ для
			индивидуальных категорий «нет риска», «риск» или «выгорание» у этой формы нет.
		</p>
		<p>
			Поэтому ниже мы показываем только средний ответ по четырём пунктам и не ставим персональное
			заключение.
		</p>
	{/snippet}
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Как часто вы испытываете это относительно своей работы?"
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
				value={mean}
				max={5}
				decimals={2}
				severity="Средний ответ без индивидуальной категории"
				tone="neutral"
				recommendation="Значение показывает среднюю частоту четырёх признаков по шкале от 1 («никогда») до 5 («постоянно»). Само по себе оно не подтверждает и не исключает выгорание. Для индивидуальной оценки используйте полную форму BAT и клиническое интервью."
				note="Мы намеренно не используем прежние границы 2,50 и 3,00: опубликованного обоснования для индивидуальной интерпретации BAT-4 у них нет."
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
