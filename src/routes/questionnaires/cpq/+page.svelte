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

	const url = 'https://kalmykov.pro/questionnaires/cpq';
	const options = [
		{ label: 'Совсем нет', value: 1 },
		{ label: 'Иногда', value: 2 },
		{ label: 'Часто', value: 3 },
		{ label: 'Постоянно', value: 4 }
	];
	const questions = [
		'За последний месяц вы прилагали большие усилия к достижению своих целей?',
		'За последний месяц вы были склонны сосредотачиваться скорее на том, чего вы достигли, а не на том, чего вы не достигли?',
		'За последний месяц вам говорили, что ваши стандарты слишком высоки?',
		'За последний месяц вы чувствовали себя неудачником, потому что вы не преуспели в достижении своих целей?',
		'За последний месяц вы боялись, что можете не достичь ваших стандартов?',
		'За последний месяц вы повышали свои стандарты, потому что думали, что они были слишком просты в достижении?',
		'За последний месяц вы оценивали себя на основе своей способности достигать высоких стандартов?',
		'За последний месяц вы сделали достаточно для того, чтобы минимально соответствовать своим стандартам?',
		'За последний месяц вы неоднократно проверяли, насколько хорошо соответствуете своим стандартам, например сравнивая свои результаты с результатами других?',
		'Как вы думаете, за последний месяц другие люди подумали бы о вас как о «перфекционисте»?',
		'В течение последнего месяца вы продолжали пытаться соответствовать своим стандартам, даже если это означало, что какая-то часть вашей жизни страдает?',
		'За последний месяц вы избегали каких-либо проверок своей результативности при достижении целей в случае, если вы потерпели неудачу?'
	].map((text, index) => ({ id: `q${index + 1}`, text }));
	const reversed = new Set(['q2', 'q8']);
	const factorIds = {
		achievements: ['q4', 'q5', 'q7', 'q9', 'q12'],
		standards: ['q1', 'q3', 'q6', 'q10', 'q11'],
		negativeEvaluation: ['q2', 'q8']
	};

	const storageKey = 'questionnaire-cpq-state';
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
	const scoredAnswers = $derived.by(() =>
		Object.fromEntries(
			questions.map((question) => [
				question.id,
				reversed.has(question.id) ? 5 - (answers[question.id] ?? 0) : (answers[question.id] ?? 0)
			])
		)
	);
	const total = $derived(Object.values(scoredAnswers).reduce((sum, value) => sum + value, 0));
	const factorScore = (ids: string[]) => ids.reduce((sum, id) => sum + (scoredAnswers[id] ?? 0), 0);
	const subscales = $derived([
		{
			name: 'Самооценка на основании достижений',
			value: factorScore(factorIds.achievements),
			max: 20,
			tone: 'neutral' as const,
			description: 'Насколько самооценка связана с достижением высоких стандартов.'
		},
		{
			name: 'Соответствие высоким стандартам',
			value: factorScore(factorIds.standards),
			max: 20,
			tone: 'neutral' as const,
			description: 'Стремление поддерживать высокие стандарты, в том числе ценой других сфер жизни.'
		},
		{
			name: 'Негативное оценивание результатов',
			value: factorScore(factorIds.negativeEvaluation),
			max: 8,
			tone: 'neutral' as const,
			description: 'Склонность замечать недостигнутое и обесценивать достигнутое.'
		}
	]);

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
	<title>Тест на перфекционизм CPQ онлайн</title>
	<meta
		name="description"
		content="Русская версия опросника клинического перфекционизма CPQ с корректным подсчётом общего и факторных баллов."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />
</svelte:head>

<AssessmentPage
	title="Опросник клинического перфекционизма (CPQ)"
	description="Оценка перфекционистских тенденций за последний месяц"
	time="3–6 минут"
	questions="12 вопросов"
>
	{#snippet info()}
		<p>
			CPQ даёт общий показатель от 12 до 48 баллов: чем он выше, тем сильнее выражены измеряемые
			перфекционистские тенденции.
		</p>
		<p>
			В русской адаптации не опубликованы пороги «низкого», «среднего» и «высокого» уровня, поэтому
			мы не присваиваем такие категории ни общей шкале, ни факторам.
		</p>
	{/snippet}

	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Оцените, как часто это происходило за последний месяц"
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
				title="Результат CPQ"
				value={total}
				max={48}
				severity="Суммарный показатель без диагностического порога"
				tone="neutral"
				recommendation="Сравнивать этот балл корректнее с вашими собственными повторными измерениями, а не с несуществующими нормативными категориями. Важен не только балл, но и то, мешают ли высокие стандарты отдыху, отношениям, работе и самооценке."
				{subscales}
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
