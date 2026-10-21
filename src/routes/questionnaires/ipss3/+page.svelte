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
		{ label: 'Совершенно не про меня', value: 1 },
		{ label: 'В основном не про меня', value: 2 },
		{ label: 'Скорее не про меня', value: 3 },
		{ label: 'Отчасти про меня', value: 4 },
		{ label: 'В основном про меня', value: 5 },
		{ label: 'Полностью про меня', value: 6 }
	];
	// Собственный перевод пунктов IPSS-3 (Jansen, 2024)
	const questions = [
		'Хотя мне часто всё удаётся, с каждым новым заданием я снова боюсь провалиться',
		'Иногда я боюсь, что другие заметят, как много знаний и умений мне на самом деле не хватает',
		'Я часто боюсь не оправдать ожиданий других, хотя уже многого добился(лась)'
	].map((text, index) => ({ id: `q${index + 1}`, text }));

	const storageKey = 'questionnaire-ipss3-state';
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
	const score = $derived(questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0));

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
	<title>Короткий тест на синдром самозванца IPSS-3 онлайн</title>
	<meta
		name="description"
		content="Пройдите короткую шкалу феномена самозванца IPSS-3 онлайн: 3 вопроса о страхе провала, разоблачения и несоответствия чужим ожиданиям. Бесплатно, около минуты."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Короткая шкала феномена самозванца (IPSS-3)"
	description="Три вопроса о страхе провала, разоблачения и несоответствия ожиданиям"
	time="1 минута"
	questions="3 вопроса"
	methodologyKey="ipss3"
>
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Насколько это утверждение про вас?"
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
				title="Результат IPSS-3"
				value={score}
				max={18}
				severity="Сумма баллов без диагностической категории"
				tone="neutral"
				recommendation="Чем выше балл, тем сильнее выражены переживания самозванца: страх провала, разоблачения и того, что вы не оправдаете ожиданий. Пороговых значений у шкалы нет, поэтому результат удобнее всего сравнивать с вашими же повторными замерами. Для ориентира: у немецких подростков средний балл был около 12. Для подробной оценки пройдите полную шкалу феномена самозванца из 25 вопросов."
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
