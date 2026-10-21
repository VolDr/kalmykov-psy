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
	const options = [
		{ label: 'Никогда', value: 1 },
		{ label: 'Редко', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Часто', value: 4 },
		{ label: 'Постоянно', value: 5 }
	];
	const questions = [
		'На работе я чувствую душевную усталость',
		'После рабочего дня мне трудно восстановить свои силы',
		'На работе я чувствую физическую усталость',
		'Мне трудно найти в себе энтузиазм к моей работе',
		'Я чувствую сильное отвращение к моей работе',
		'Я сомневаюсь, что моя работа имеет для кого-то значение',
		'На работе мне сложно оставаться собранным(ой)',
		'Когда я работаю, мне сложно сконцентрироваться',
		'Я делаю ошибки в процессе работы, потому что думаю о других вещах',
		'На работе я чувствую, что не способен(а) контролировать свои эмоции',
		'Я не узнаю себя в том, как я эмоционально реагирую на работе',
		'На работе я могу слишком остро реагировать, сам(а) того не желая'
	].map((text, index) => ({ id: `q${index + 1}`, text }));

	const storageKey = 'questionnaire-bat12-state';
	const initialState = loadAssessmentState(storageKey, {
		answers: {} as Record<string, number>,
		currentStep: 0,
		showResults: false
	});
	let answers = $state(initialState.answers);
	let currentStep = $state(Math.min(initialState.currentStep, questions.length - 1));
	let showResults = $state<boolean>(
		initialState.showResults &&
			questions.every((question) => initialState.answers[question.id] !== undefined)
	);
	let resultSection = $state<HTMLElement>();
	const currentQuestion = $derived(questions[currentStep]);
	const canGoNext = $derived(answers[currentQuestion.id] !== undefined);
	const mean = $derived(
		questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0) / questions.length
	);
	const result = $derived.by((): { severity: string; tone: ResultTone; recommendation: string } => {
		if (mean <= 2.53)
			return {
				severity: 'Зелёная зона BAT',
				tone: 'green',
				recommendation:
					'По предварительным европейским порогам средний показатель находится в зелёной зоне. Это скрининговый результат, а не подтверждение отсутствия выгорания.'
			};
		if (mean <= 2.95)
			return {
				severity: 'Оранжевая зона BAT',
				tone: 'orange',
				recommendation:
					'Показатель соответствует зоне повышенного риска по предварительным европейским порогам. Полезно оценить рабочую нагрузку, восстановление и динамику состояния, а при устойчивых трудностях обратиться за профессиональной оценкой.'
			};
		return {
			severity: 'Красная зона BAT: выраженные признаки',
			tone: 'red',
			recommendation:
				'Показатель соответствует красной зоне BAT и требует более подробной оценки. Это не самостоятельный диагноз: авторы метода рекомендуют учитывать дополнительную информацию и данные клинического интервью.'
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
	<title>Тест на профессиональное выгорание BAT-12 онлайн</title>
	<meta
		name="description"
		content="Пройдите короткую официальную форму BAT-12 онлайн: 12 вопросов о признаках профессионального выгорания. Бесплатно, 3–5 минут, результат по модели светофора."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Опросник выгорания BAT-12"
	description="Короткая форма для скрининга и наблюдения за динамикой профессионального выгорания"
	time="3–5 минут"
	questions="12 вопросов"
 methodologyKey="bat12">
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
				thresholds={[2.54, 2.96]}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
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
