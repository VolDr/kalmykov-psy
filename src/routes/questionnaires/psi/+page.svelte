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
		'Иногда вместо того, чтобы делать то, что необходимо, я начинаю заниматься посторонними делами',
		'Я часто жалею, что не начал делать что-либо раньше',
		'В моей жизни есть задачи и дела, которые я отложил, хотя знаю, что не должен был',
		'Иногда в конце дня я понимаю, что мог бы провести время лучше',
		'Некоторые дела в моей жизни я откладываю слишком часто',
		'Моя жизнь была бы лучше, если бы я сделал все, что в свое время отложил на неопределенный срок',
		'Иногда я встречаюсь с неприятными последствиями того, что слишком долго медлил с чем-то',
		'Если передо мной стоит крупная задача, я стараюсь приступить к ней как можно быстрее, прежде чем появится множество других мелких дел',
		'Я с умом трачу свое время',
		'Я стараюсь делать все в те сроки, в которые необходимо успеть',
		'Иногда я ловлю себя на том, что делаю второстепенные дела, хотя у меня есть важные задачи',
		'Иногда при выполнении задачи я концентрируюсь на деталях и затягиваю с выполнением главного',
		'Иногда я сдаю работу с большим опозданием',
		'Иногда я ловлю себя на том, что занимаюсь посторонними делами в рабочее время',
		'Часто я откладываю дело до тех пор, пока оно не начнет «давить» на меня',
		'Иногда я понимаю, что выполнил бы задачу лучше, если бы приступил к ней раньше',
		'Иногда я слишком долго откладываю какую-либо задачу',
		'Иногда я затягиваю сроки сдачи работы',
		'Я часто жалею, что начал выполнять конкретную задачу слишком поздно',
		'Я делаю свою работу именно тогда, когда планировал ее сделать',
		'Когда у меня есть ответственная работа, я приступаю к ней как можно раньше',
		'Чаще всего я организую свою работу так, чтобы в каждый конкретный момент заниматься тем, что актуально и важно',
		'Я довольно легко отвлекаюсь, когда занимаюсь учебой',
		'Иногда я ловлю себя на том, что выполняю задания, которые намеревался сделать несколько дней назад',
		'Иногда, когда я готовлюсь к занятиям, я отвлекаюсь на общение, игры или телевизор',
		'Обычно я не сразу приступаю к заданию, которое получил',
		'Я часто сдаю задания на несколько дней раньше, чем должен',
		'Когда я занят учебой, меня мало что способно отвлечь'
	].map((text, index) => ({ id: `q${index + 1}`, text }));
	const reversed = new Set(['q9', 'q10', 'q11', 'q21', 'q22', 'q23', 'q28', 'q29']);

	const storageKey = 'questionnaire-psi-state';
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
		if (score <= 73)
			return {
				severity: 'Низкий уровень прокрастинации',
				tone: 'green',
				recommendation:
					'По опубликованным нормативным интервалам склонность к откладыванию выражена невысоко. При этом отдельные ситуации всё равно лучше оценивать по их реальному влиянию на жизнь.'
			};
		if (score <= 117)
			return {
				severity: 'Средний уровень прокрастинации',
				tone: 'yellow',
				recommendation:
					'Откладывание проявляется заметно, но не обязательно одинаково во всех сферах. Полезно отследить, какие задачи, эмоции и условия чаще запускают этот паттерн.'
			};
		return {
			severity: 'Высокий уровень прокрастинации',
			tone: 'red',
			recommendation:
				'Склонность к откладыванию выражена сильно и может влиять на учёбу, работу или повседневные дела. Результат не является диагнозом, но может быть основанием для более подробного разбора причин и последствий.'
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
	<title>Шкала прокрастинации П. Стила (PSI) — онлайн</title>
	<meta
		name="description"
		content="Русская 29-пунктовая шкала прокрастинации PSI П. Стила с опубликованным алгоритмом подсчёта."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Шкала прокрастинации П. Стила (PSI)"
	description="Оценка общей склонности откладывать важные дела"
	time="8–10 минут"
	questions="29 вопросов"
 methodologyKey="psi">
	{#snippet info()}
		<p>
			Русская апробация шкалы проведена на выборке 213 человек. Это ограничивает переносимость
			полученных нормативных интервалов на другие группы.
		</p>
		<p>
			Шкала оценивает выраженность прокрастинации, но не объясняет её причины и не заменяет
			профессиональную оценку.
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
				max={145}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
				note="Обратные пункты 9, 10, 11, 21, 22, 23, 28 и 29 уже пересчитаны. Интервалы: 29–73, 74–117 и 118–145 баллов."
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
