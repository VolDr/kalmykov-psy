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
		{ label: 'Не согласен', value: 1 },
		{ label: 'Скорее нет', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Скорее да', value: 4 },
		{ label: 'Согласен', value: 5 }
	];
	const questions = [
		'Иногда я тяну с выполнением какого-либо дела, даже если это очень неразумно с моей стороны',
		'Я делаю все в те сроки, в которые необходимо успеть',
		'Я часто жалею, что не начал делать что-либо раньше',
		'В моей жизни есть задачи и дела, которые я отложил, хотя знаю, что не должен был',
		'Если передо мной стоит крупная задача, я стараюсь приступить к ней как можно быстрее, прежде чем появится множество других мелких дел',
		'Иногда я встречаюсь с неприятными последствиями того, что слишком долго медлил с чем-то',
		'Иногда в конце дня я понимаю, что мог бы провести время лучше',
		'Я с умом трачу свое время',
		'Иногда вместо того, чтобы делать то, что необходимо, я начинаю заниматься посторонними делами'
	].map((text, index) => ({ id: `q${index + 1}`, text }));
	const reversed = new Set(['q2', 'q5', 'q8']);

	const storageKey = 'questionnaire-ips-state';
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
	const score = $derived(
		questions.reduce(
			(sum, question) =>
				sum +
				(reversed.has(question.id) ? 6 - (answers[question.id] ?? 0) : (answers[question.id] ?? 0)),
			0
		)
	);
	const result = $derived.by((): { severity: string; tone: ResultTone; recommendation: string } => {
		if (score <= 22)
			return {
				severity: 'Низкий уровень иррациональной прокрастинации',
				tone: 'green',
				recommendation:
					'По опубликованным интервалам выраженность иррационального откладывания невысока. Это не исключает отдельных ситуаций, в которых прокрастинация может мешать.'
			};
		if (score <= 37)
			return {
				severity: 'Средний уровень иррациональной прокрастинации',
				tone: 'yellow',
				recommendation:
					'Откладывание может периодически происходить вопреки пониманию последствий. Полезно обратить внимание на задачи и ситуации, в которых этот паттерн повторяется.'
			};
		return {
			severity: 'Высокий уровень иррациональной прокрастинации',
			tone: 'red',
			recommendation:
				'Иррациональное откладывание выражено и может заметно влиять на дела и самочувствие. Результат стоит рассматривать как повод подробнее изучить причины, а не как диагноз.'
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
	<title>Шкала иррациональной прокрастинации (IPS) П. Стила</title>
	<meta
		name="description"
		content="Русская версия шкалы иррациональной прокрастинации IPS П. Стила с исходными вариантами ответов."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Шкала иррациональной прокрастинации (IPS)"
	description="Короткая шкала П. Стила о добровольном откладывании дел вопреки ожидаемым последствиям"
	time="5–7 минут"
	questions="9 вопросов"
 methodologyKey="ips">
	{#snippet info()}
		<p>
			В исследовании русской адаптации внутренняя согласованность IPS была слабой: α = 0,363.
			Поэтому результат лучше считать ориентировочным и не использовать как самостоятельное
			клиническое заключение.
		</p>
	{/snippet}
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Отметьте, насколько утверждение вас характеризует"
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
				max={45}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
				note="Обратные пункты 2, 5 и 8 уже пересчитаны. Интервалы: 9–22, 23–37 и 38–45 баллов."
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
