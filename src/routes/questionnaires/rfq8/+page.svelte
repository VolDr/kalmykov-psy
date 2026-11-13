<script lang="ts">
	import { tick } from 'svelte';
	import AssessmentPage from '#lib/components/questionnaire/AssessmentPage.svelte';
	import AssessmentQuestion from '#lib/components/questionnaire/AssessmentQuestion.svelte';
	import AssessmentResult from '#lib/components/questionnaire/AssessmentResult.svelte';
	import AssessmentWizard from '#lib/components/questionnaire/AssessmentWizard.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import { rfq8Questions, scoreRfq8 } from '#lib/data/questionnaires/rfq8.js';
	import { loadAssessmentState, saveAssessmentState } from '#lib/utils/questionnaire/assessmentState.js';

	const options = [
		{ label: '1 — Совершенно не согласен(на)', value: 1 },
		{ label: '2', value: 2 },
		{ label: '3', value: 3 },
		{ label: '4', value: 4 },
		{ label: '5', value: 5 },
		{ label: '6', value: 6 },
		{ label: '7 — Полностью согласен(на)', value: 7 }
	];
	const storageKey = 'questionnaire-rfq8-state';
	const initialState = loadAssessmentState(storageKey, {
		answers: {} as Record<string, number>,
		currentStep: 0,
		showResults: false
	});
	let answers = $state(initialState.answers);
	let currentStep = $state(Math.min(initialState.currentStep, rfq8Questions.length - 1));
	let showResults = $state(initialState.showResults && scoreRfq8(initialState.answers) !== null);
	let resultSection = $state<HTMLElement>();
	const currentQuestion = $derived(rfq8Questions[currentStep]);
	const canGoNext = $derived(
		Number.isInteger(answers[currentQuestion.id]) &&
			answers[currentQuestion.id] >= 1 && answers[currentQuestion.id] <= 7
	);
	const result = $derived(scoreRfq8(answers));

	$effect(() => {
		saveAssessmentState(storageKey, { answers, currentStep, showResults });
	});

	function setAnswer(id: string, value: number) {
		answers = { ...answers, [id]: value };
	}
	async function next() {
		if (!canGoNext) return;
		if (currentStep < rfq8Questions.length - 1) {
			currentStep += 1;
			return;
		}
		if (!scoreRfq8(answers)) return;
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
	<title>Опросник рефлексивного функционирования RFQ-8 онлайн</title>
	<meta name="description" content="8 вопросов RFQ-8 на русском: уверенность и неопределённость в понимании психических состояний. Отдельные результаты RFQ-C и RFQ-U без диагностических порогов." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Опросник рефлексивного функционирования (RFQ-8)"
	description="Как вы понимаете мысли, чувства и причины поступков — своих и других людей"
	time="2–3 минуты"
	questions="8 утверждений"
	methodologyKey="rfq8"
>
	{#if !showResults || !result}
		<AssessmentWizard
			step={currentStep + 1}
			total={rfq8Questions.length}
			instruction="Прочитайте утверждение и выберите число от 1 до 7. Не задумывайтесь слишком долго — обычно лучше всего подходят ваши первые, непосредственные ответы."
			canGoBack={currentStep > 0}
			{canGoNext}
			onback={back}
			onnext={next}
			nextLabel={currentStep === rfq8Questions.length - 1 ? 'Показать результат' : 'Далее'}
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
				title="Результат RFQ-8 · RFQ-C"
				value={result.certainty}
				max={3}
				decimals={2}
				severity="Уверенность в психических состояниях (RFQ-C)"
				tone="neutral"
				subscales={[
				{
					name: 'Неопределённость (RFQ-U)',
					value: result.uncertainty,
					max: 3,
					tone: 'neutral',
					description: 'Высокое значение означает выраженную неопределённость в понимании психических состояний.'
				}
			]}
				recommendation="Опросник даёт две независимые оценки от 0 до 3. Более высокий RFQ-C может отражать чрезмерную уверенность в собственных выводах о мыслях и чувствах; более высокий RFQ-U — выраженную неопределённость. Эти показатели не складываются в общий балл и не устанавливают диагноз."
				note="Результаты рассчитаны с помощью нелинейного перекодирования исходных ответов, а не их простого суммирования. Русский перевод ещё не прошёл отдельную психометрическую валидацию. Клинические пороги не применяются; двухфакторная модель RFQ является предметом научной дискуссии."
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
