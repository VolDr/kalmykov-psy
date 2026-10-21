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
	const options = [
		{ label: 'Совершенно не согласен(на)', value: 1 },
		{ label: 'Скорее не согласен(на)', value: 2 },
		{ label: 'Ни да, ни нет', value: 3 },
		{ label: 'Скорее согласен(на)', value: 4 },
		{ label: 'Полностью согласен(на)', value: 5 }
	];
	// Собственный перевод пунктов GPS-9 (Sirois, Yang & van Eerde, 2019); порядок — как в исходной шкале Лэя
	const questions = [
		'Я часто ловлю себя на том, что выполняю дела, которые собирался(ась) сделать ещё несколько дней назад',
		'Даже дела, для которых нужно лишь сесть и сделать их, у меня по несколько дней остаются несделанными',
		'Обычно я тяну, прежде чем взяться за работу, которую нужно сделать',
		'Готовясь к какому-либо сроку, я часто трачу время на посторонние дела',
		'Я часто заканчиваю дела раньше, чем нужно',
		'Даже необходимые вещи я обычно покупаю в последний момент',
		'Обычно я успеваю сделать всё, что запланировал(а) на день',
		'Я постоянно говорю себе: «Сделаю это завтра»',
		'Обычно я заканчиваю все необходимые дела, прежде чем вечером расслабиться и отдохнуть'
	].map((text, index) => ({ id: `q${index + 1}`, text }));
	const reversed = new Set(['q5', 'q7', 'q9']);

	const storageKey = 'questionnaire-gps9-state';
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
		questions.reduce(
			(sum, question) =>
				sum +
				(reversed.has(question.id) ? 6 - (answers[question.id] ?? 0) : (answers[question.id] ?? 0)),
			0
		) / questions.length
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
	<title>Тест на прокрастинацию GPS-9 онлайн — короткая шкала</title>
	<meta
		name="description"
		content="Пройдите короткую шкалу общей прокрастинации GPS-9 онлайн: 9 вопросов о привычке откладывать дела в повседневной жизни. Бесплатно, 2–4 минуты, с пояснением."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Шкала общей прокрастинации (GPS-9)"
	description="Короткая шкала устойчивой склонности откладывать дела в повседневной жизни"
	time="2–4 минуты"
	questions="9 вопросов"
	methodologyKey="gps9"
>
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Насколько вы согласны с этим утверждением?"
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
				title="Результат GPS-9"
				value={mean}
				max={5}
				decimals={2}
				severity="Средний балл без диагностической категории"
				tone="neutral"
				recommendation="Чем выше балл, тем сильнее выражена привычка откладывать дела. Пороговых значений у шкалы нет, поэтому результат удобнее всего сравнивать с вашими же повторными замерами. Для ориентира: в исследованиях авторов средний балл взрослых и студентов составлял примерно 2,9–3,4."
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
