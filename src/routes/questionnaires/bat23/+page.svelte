<script lang="ts">
	import { tick } from 'svelte';
	import AssessmentPage from '$lib/components/questionnaire/AssessmentPage.svelte';
	import AssessmentQuestion from '$lib/components/questionnaire/AssessmentQuestion.svelte';
	import AssessmentResult, {
		type ResultSubscale,
		type ResultTone
	} from '$lib/components/questionnaire/AssessmentResult.svelte';
	import AssessmentWizard from '$lib/components/questionnaire/AssessmentWizard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		loadAssessmentState,
		saveAssessmentState
	} from '$lib/utils/questionnaire/assessmentState';

	type Question = { id: string; text: string };
	type Zone = { severity: string; tone: ResultTone };
	const options = [
		{ label: 'Никогда', value: 1 },
		{ label: 'Редко', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Часто', value: 4 },
		{ label: 'Постоянно', value: 5 }
	];
	const questions: Question[] = [
		'На работе я чувствую душевную усталость',
		'Всё, что я делаю на работе, требует от меня больших усилий',
		'После рабочего дня мне трудно восстановить свои силы',
		'На работе я чувствую физическую усталость',
		'Просыпаясь утром, я чувствую нехватку сил для нового рабочего дня',
		'Я хочу быть активным(ой) на работе, но почему-то мне это не удаётся',
		'Когда я прилагаю усилия к работе, я быстро устаю',
		'В конце рабочего дня я чувствую себя внутренне опустошённым(ой) и выжатым(ой)',
		'Мне трудно найти в себе энтузиазм к моей работе',
		'На работе я не задумываюсь о том, что делаю, работаю на автопилоте',
		'Я чувствую сильное отвращение к моей работе',
		'Я чувствую, что моя работа мне безразлична',
		'Я сомневаюсь, что моя работа имеет для кого-то значение',
		'На работе мне сложно оставаться собранным(ой)',
		'Во время работы мне с трудом удается мыслить ясно',
		'На работе я забывчив(а) и рассеян(на)',
		'Когда я работаю, мне сложно сконцентрироваться',
		'Я делаю ошибки в процессе работы, потому что думаю о других вещах',
		'На работе я чувствую, что не способен(а) контролировать свои эмоции',
		'Я не узнаю себя в том, как я эмоционально реагирую на работе',
		'Во время работы я раздражаюсь, если дела идут не так, как я хочу',
		'Я расстраиваюсь и огорчаюсь на работе, сам(а) не зная, почему',
		'На работе я могу слишком остро реагировать, сам(а) того не желая'
	].map((text, index) => ({ id: `w${index + 1}`, text }));
	const groups = [
		{ name: 'Истощение', ids: questions.slice(0, 8).map((q) => q.id), orange: 3.06, red: 3.31 },
		{
			name: 'Внутреннее дистанцирование',
			ids: questions.slice(8, 13).map((q) => q.id),
			orange: 2.1,
			red: 3.3
		},
		{
			name: 'Когнитивные затруднения',
			ids: questions.slice(13, 18).map((q) => q.id),
			orange: 2.7,
			red: 3.1
		},
		{
			name: 'Эмоциональные затруднения',
			ids: questions.slice(18, 23).map((q) => q.id),
			orange: 2.3,
			red: 2.9
		}
	];
	const storageKey = 'questionnaire-bat23-state';
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

	function zone(value: number, orange: number, red: number): Zone {
		if (value >= red) return { severity: 'Красная зона', tone: 'red' };
		if (value >= orange) return { severity: 'Оранжевая зона', tone: 'orange' };
		return { severity: 'Зелёная зона', tone: 'green' };
	}

	const totalResult = $derived.by(() => {
		const current = zone(mean, 2.59, 3.02);
		const recommendation =
			current.tone === 'green'
				? 'Средний показатель находится в зелёной зоне BAT. Это скрининговый результат, а не гарантия отсутствия выгорания.'
				: current.tone === 'orange'
					? 'Средний показатель соответствует зоне повышенного риска. Имеет смысл подробнее оценить нагрузку, восстановление и устойчивость симптомов.'
					: 'Средний показатель соответствует красной зоне BAT и выраженным признакам выгорания. Для заключения нужна дополнительная информация и клиническое интервью.';
		return { ...current, recommendation };
	});
	const subscales = $derived(
		groups.map((group): ResultSubscale => {
			const value = group.ids.reduce((sum, id) => sum + (answers[id] ?? 0), 0) / group.ids.length;
			const current = zone(value, group.orange, group.red);
			return { name: group.name, value, max: 5, severity: current.severity, tone: current.tone };
		})
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
	<title>Опросник профессионального выгорания BAT-23 онлайн</title>
	<meta
		name="description"
		content="Официальная русская форма BAT-23 для оценки признаков профессионального выгорания."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Опросник выгорания BAT — полная версия"
	description="Официальная русская версия для работающих"
	time="6–10 минут"
	questions="23 вопроса"
 methodologyKey="bat23">

	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Насколько часто это утверждение соответствует вашим ощущениям?"
			canGoBack={currentStep > 0}
			{canGoNext}
			onback={back}
			onnext={next}
			nextLabel={currentStep === questions.length - 1 ? 'Посмотреть результат' : 'Далее'}
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
				title="Результат BAT-23"
				value={mean}
				max={5}
				decimals={2}
				severity={totalResult.severity}
				tone={totalResult.tone}
				recommendation={totalResult.recommendation}
				note="Общий порог: оранжевая зона с 2,59, красная — с 3,02. Пороговые значения предварительные и получены не на российской выборке."
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
