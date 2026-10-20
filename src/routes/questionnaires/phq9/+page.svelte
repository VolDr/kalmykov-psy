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

	const title = 'Опросник депрессивных симптомов PHQ-9';
	const description = 'Скрининг выраженности депрессивных симптомов за последние две недели';
	const options = [
		{ label: 'Совсем нет', value: 0 },
		{ label: 'В течение нескольких дней', value: 1 },
		{ label: 'Более чем половину этого времени', value: 2 },
		{ label: 'Почти каждый день', value: 3 }
	];
	// Формулировки — русскоязычная версия А. А. Золотарёвой (2023)
	const questions = [
		{ id: 'q1', text: 'Снижение интереса и удовольствия от привычных дел' },
		{ id: 'q2', text: 'Чувство подавленности или безнадежности' },
		{
			id: 'q3',
			text: 'Проблемы со сном (неспособность заснуть, раннее пробуждение или слишком долгий сон)'
		},
		{ id: 'q4', text: 'Чувство усталости или недостатка энергии' },
		{ id: 'q5', text: 'Плохой аппетит или переедание' },
		{
			id: 'q6',
			text: 'Плохое мнение о себе или чувство, что не смог(ла) оправдать ожиданий моей семьи'
		},
		{
			id: 'q7',
			text: 'Проблемы с концентрацией внимания (например, при чтении газеты или просмотре телевизионной передачи)'
		},
		{
			id: 'q8',
			text: 'Замедленность движений или речи, которая стала заметна другим людям, или, напротив, суетливость, когда движения и речь стали более быстрыми и беспокойными'
		},
		{ id: 'q9', text: 'Мысли о том, что мне бы хотелось умереть или причинить себе боль' }
	];
	const impactOptions = [
		{ label: 'Совсем не затруднили', value: 0 },
		{ label: 'Немного затруднили', value: 1 },
		{ label: 'Сильно затруднили', value: 2 },
		{ label: 'Крайне затруднили', value: 3 }
	];
	const impactQuestion = {
		id: 'impact',
		text: 'Насколько эти проблемы затруднили вашу работу, домашние дела или общение с людьми?'
	};

	const storageKey = 'questionnaire-phq9-state';
	const initialState = loadAssessmentState(storageKey, {
		answers: {} as Record<string, number>,
		currentStep: 0,
		showResults: false
	});
	const initialScore = questions.reduce(
		(sum, question) => sum + (initialState.answers[question.id] ?? 0),
		0
	);
	let answers = $state(initialState.answers);
	let currentStep = $state(Math.min(initialState.currentStep, initialScore > 0 ? 9 : 8));
	let showResults = $state<boolean>(
		initialState.showResults &&
			questions.every((question) => initialState.answers[question.id] !== undefined)
	);
	let resultSection = $state<HTMLElement>();
	const score = $derived(questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0));
	const flowQuestions = $derived(score > 0 ? [...questions, impactQuestion] : questions);
	const currentQuestion = $derived(flowQuestions[currentStep]);
	const isImpactQuestion = $derived(currentQuestion.id === 'impact');
	const canGoNext = $derived(isImpactQuestion || answers[currentQuestion.id] !== undefined);
	const hasSafetySignal = $derived((answers.q9 ?? 0) > 0);
	const result = $derived.by((): { severity: string; tone: ResultTone; recommendation: string } => {
		if (score <= 4)
			return {
				severity: 'Минимальная симптоматика или её отсутствие',
				tone: 'green',
				recommendation:
					'По сумме ответов выраженные депрессивные симптомы сейчас не обнаружены. Ориентируйтесь не только на балл, но и на своё самочувствие и способность справляться с повседневными делами.'
			};
		if (score <= 9)
			return {
				severity: 'Лёгкая депрессивная симптоматика',
				tone: 'yellow',
				recommendation:
					'Полезно понаблюдать за динамикой симптомов и тем, как они влияют на сон, работу, быт и отношения. Если состояние сохраняется или ухудшается, обсудите его со специалистом.'
			};
		if (score <= 14)
			return {
				severity: 'Умеренная депрессивная симптоматика',
				tone: 'orange',
				recommendation:
					'Такой результат является основанием для более подробной профессиональной оценки. PHQ-9 не устанавливает диагноз, но помогает заметить симптомы, которые уже могут заметно влиять на жизнь.'
			};
		if (score <= 19)
			return {
				severity: 'Умеренно тяжёлая депрессивная симптоматика',
				tone: 'red',
				recommendation:
					'Выраженность симптомов высокая. Рекомендуется обратиться к врачу-психиатру или клиническому психологу для очной оценки состояния и выбора помощи.'
			};
		return {
			severity: 'Тяжёлая депрессивная симптоматика',
			tone: 'red',
			recommendation:
				'Результат указывает на очень выраженные симптомы. Обратитесь к врачу-психиатру как можно скорее. Если вы не чувствуете себя в безопасности, попросите близкого побыть рядом и обратитесь за экстренной помощью.'
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
		if (currentStep < flowQuestions.length - 1) {
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
	<title>Опросник депрессивных симптомов PHQ-9 — онлайн</title>
	<meta
		name="description"
		content="Русская версия PHQ-9 для скрининга выраженности депрессивных симптомов. Результат не является диагнозом."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage {title} {description} time="2–4 минуты" questions="9 пунктов + вопрос о влиянии" methodologyKey="phq9">
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={flowQuestions.length}
			instruction={isImpactQuestion
				? 'Этот ответ не входит в сумму PHQ-9'
				: 'Насколько часто это беспокоило вас в течение прошедших двух недель?'}
			canGoBack={currentStep > 0}
			{canGoNext}
			onback={back}
			onnext={next}
			nextLabel={currentStep === flowQuestions.length - 1 ? 'Показать результат' : 'Далее'}
		>
			<AssessmentQuestion
				id={currentQuestion.id}
				text={currentQuestion.text}
				options={isImpactQuestion ? impactOptions : options}
				value={answers[currentQuestion.id]}
				onchange={(value) => setAnswer(currentQuestion.id, value)}
				hint={isImpactQuestion
					? 'Можно пропустить. Ответ помогает понять влияние симптомов на жизнь.'
					: undefined}
			/>
			{#if currentQuestion.id === 'q9' && hasSafetySignal}
				<div
					class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-900"
					role="alert"
				>
					Этот ответ требует отдельного внимания независимо от общего балла. Если вам сейчас
					небезопасно,
					<a href="/sos" class="font-semibold underline underline-offset-4"
						>откройте контакты срочной помощи</a
					>.
				</div>
			{/if}
		</AssessmentWizard>
	{:else}
		<div bind:this={resultSection}>
			<AssessmentResult
				value={score}
				max={27}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
				note="PHQ-9 является скрининговой шкалой. Диагноз ставит специалист после полноценной оценки."
			>
				{#snippet actions()}<Button
						type="button"
						variant="secondary"
						onclick={reset}
						class="bg-primary text-primary-foreground outline-none hover:bg-primary-light"
						>Пройти заново</Button
					>{/snippet}
			</AssessmentResult>
			{#if hasSafetySignal}
				<div
					class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] leading-relaxed text-red-900 md:px-5 md:py-4 md:text-[15px]"
					role="alert"
				>
					<p class="font-semibold">Ответ на пункт 9 требует отдельного внимания</p>
					<p class="mt-1">
						Мысли о смерти или о том, чтобы причинить себе боль, важнее итоговой суммы баллов.
						Обсудите их со специалистом или человеком, которому доверяете. Если вам сейчас
						небезопасно,
						<a href="/sos" class="font-semibold underline underline-offset-4"
							>откройте контакты срочной помощи</a
						>.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</AssessmentPage>
