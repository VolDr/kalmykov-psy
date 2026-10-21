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
		{ label: 'Почти никогда, совсем не про меня', value: 1 },
		{ label: 'Редко', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Часто', value: 4 },
		{ label: 'Почти всегда, полностью про меня', value: 5 }
	];
	// Шкала феномена самозванца М. Леонтьевой (НИУ ВШЭ, 2024), приложение D
	const questions = [
		'Мой успех в работе (учебе) обусловлен удачей.',
		'Я добиваюсь успеха на работе (учебе) только благодаря своему обаянию.',
		'Мне кажется, что мой успех на работе (учебе) - результат какой-то случайной ошибки, например, невнимательность начальника (преподавателя).',
		'Я добиваюсь успеха в работе (учебе) и получаю престижную должность или повышение лишь потому, что оказываюсь в нужном месте в нужное время и знаком(а) с правильными людьми.',
		'Обычно я добиваюсь успеха в работе (учебе) только благодаря тому, что уделяю проекту или задаче намного больше времени, чем это объективно необходимо.',
		'Я склонен(на) искать причины неудач и провалов в себе, а свой успех объяснять скорее удачно сложившимися обстоятельствами.',
		'Когда меня хвалят или делают комплимент, я склонен(на) преуменьшать свои заслуги и оправдываться, объясняя свой успех везением и случайностью.',
		'Я боюсь, что окружающие обнаружат, скольких знаний мне действительно не хватает, и что я не настолько способный(ая) и компетентный(ая), как кажется.',
		'Представление окружающих об уровне моих знаний и компетентности зачастую завышено.',
		'У меня бывает страх, что мой начальник или преподаватель поймет, что на самом деле я незаслуженно занимаю свою должность или получаю высокие оценки.',
		'Когда меня хвалят и отмечают мои умения и способности, у меня появляется ощущение, что я как будто всех обманываю.',
		'Несмотря на мой успех и достижения, я боюсь, что кто-то более опытный и знающий может разоблачить меня и указать на мою некомпетентность.',
		'Приступая к новой должности, проекту или начиная новую учебную программу, я ощущаю себя самозванцем среди коллег.',
		'Когда меня хвалят за достижения, я пытаюсь преуменьшить значимость своей работы и стараний.',
		'Я боюсь, что могу провалить важный экзамен или презентацию важного проекта на работе, даже если хорошо подготовился(лась) и разбираюсь в материале.',
		'Я болезненно воспринимаю критику и оценку своей работы.',
		'Когда я сравниваю себя с окружающими, мне кажется, что они способнее и умнее меня и достигли гораздо большего.',
		'Я испытываю тревогу и волнение, когда оценивают результаты моего труда, и если бы я мог(ла), то избежал(а) бы этого.',
		'Даже после долгой и кропотливой работы над заданием / проектом я думаю, что мог(ла) бы сделать его намного лучше.',
		'Я чувствую себя подавленным(ной), если кому-то из коллег удалось опередить меня в чем-то или выполнить задание / проект лучше меня.',
		'Прежде чем начать выполнение задания / проекта, мне необходимо тщательно продумать все его этапы, чтобы избежать провала.',
		'Я могу несколько раз переделывать важное задание / проект и уделить его выполнению гораздо больше времени, чем нужно, чтобы избежать провала.',
		'Мне кажется, что мне нужно прикладывать больше усилий, чем другим, для достижения таких же успешных результатов в работе (учебе).',
		'Я испытываю тревогу, если не чувствую одобрение окружающих.',
		'Мне важно, чтобы в работе (учебе) меня считали «лучшим / лучшей» или, по крайней мере, «очень особенным / особенной».'
	].map((text, index) => ({ id: `q${index + 1}`, text }));
	const groups = [
		{
			name: 'Ощущение обмана',
			items: [3, 8, 9, 10, 11, 12, 13],
			description: 'Чувство, что вы незаслуженно занимаете своё место и вас могут разоблачить.'
		},
		{
			name: 'Страх негативной оценки',
			items: [16, 18, 20, 24, 25],
			description: 'Болезненное отношение к критике, оценке и успехам других.'
		},
		{
			name: 'Стиль работы',
			items: [5, 19, 21, 22],
			description:
				'Перестраховка: лишнее время, переделки и тщательное планирование, чтобы избежать провала.'
		},
		{
			name: 'Неуверенность в себе',
			items: [15, 17, 23],
			description: 'Сомнения в своих силах, даже когда вы хорошо подготовлены.'
		},
		{
			name: 'Обесценивание похвалы и успеха',
			items: [6, 7, 14],
			description: 'Склонность преуменьшать свои заслуги в ответ на похвалу.'
		},
		{
			name: 'Приписывание успеха внешним причинам',
			items: [1, 2, 4],
			description: 'Объяснение своего успеха удачей, обаянием или стечением обстоятельств.'
		}
	];

	const storageKey = 'questionnaire-impostor-state';
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
	const subscales = $derived(
		groups.map((group) => ({
			name: group.name,
			value: group.items.reduce((sum, item) => sum + (answers[`q${item}`] ?? 0), 0),
			max: group.items.length * 5,
			tone: 'neutral' as const,
			description: group.description
		}))
	);
	const result = $derived.by((): { severity: string; tone: ResultTone; recommendation: string } => {
		if (score <= 51)
			return {
				severity: 'Низкий уровень феномена самозванца',
				tone: 'green',
				recommendation:
					'Переживания, характерные для феномена самозванца, выражены слабо: скорее всего, вы считаете свои успехи заслуженными. Это не исключает отдельных ситуаций, в которых сомнения всё же появляются.'
			};
		if (score <= 68)
			return {
				severity: 'Умеренно низкий уровень феномена самозванца',
				tone: 'yellow',
				recommendation:
					'Переживания самозванца у вас есть, но выражены ниже среднего. Посмотрите на шкалы ниже: они покажут, какие стороны выражены сильнее остальных.'
			};
		if (score <= 85)
			return {
				severity: 'Умеренно высокий уровень феномена самозванца',
				tone: 'orange',
				recommendation:
					'Переживания самозванца выражены выше среднего: сомнения в заслуженности успеха, страх оценки или перестраховка в работе, вероятно, заметны в вашей жизни. Шкалы ниже помогут понять, что именно преобладает.'
			};
		return {
			severity: 'Высокий уровень феномена самозванца',
			tone: 'red',
			recommendation:
				'Переживания самозванца выражены сильно: в исследовании автора шкалы такой результат был примерно у каждого седьмого участника. Если эти переживания мешают работе, учёбе или самочувствию, это повод обсудить их со специалистом. Результат не является диагнозом.'
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
	<title>Тест на синдром самозванца онлайн — 25 вопросов</title>
	<meta
		name="description"
		content="Пройдите русскоязычную шкалу феномена самозванца онлайн: 25 вопросов, общий уровень и шесть сторон — от страха разоблачения до обесценивания похвалы. Бесплатно."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Шкала феномена самозванца"
	description="Русскоязычная шкала: общий уровень переживаний самозванца и шесть их сторон"
	time="5–8 минут"
	questions="25 вопросов"
	methodologyKey="impostor"
>
	{#if !showResults}
		<AssessmentWizard
			step={currentStep + 1}
			total={questions.length}
			instruction="Насколько это утверждение описывает именно вас? Отвечайте сразу, не раздумывая долго"
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
				title="Результат"
				value={score}
				max={125}
				thresholds={[52, 69, 86]}
				severity={result.severity}
				tone={result.tone}
				recommendation={result.recommendation}
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
