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
		saveAssessmentState,
		type AssessmentState
	} from '$lib/utils/questionnaire/assessmentState';

	type Version = 'work' | 'general';
	type Question = { id: string; text: string };
	type Zone = { severity: string; tone: ResultTone };
	const options = [
		{ label: 'Никогда', value: 1 },
		{ label: 'Редко', value: 2 },
		{ label: 'Иногда', value: 3 },
		{ label: 'Часто', value: 4 },
		{ label: 'Постоянно', value: 5 }
	];
	const versionOptions = [
		{ label: 'Да, я сейчас работаю', value: 1 },
		{ label: 'Нет, сейчас я не работаю', value: 0 }
	];
	const workQuestions: Question[] = [
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
	const generalQuestions: Question[] = [
		'Я чувствую душевную усталость',
		'Всё, что я делаю, требует от меня больших усилий',
		'В конце дня мне трудно восстановить свои силы',
		'Я чувствую физическую усталость',
		'Просыпаясь утром, я чувствую нехватку сил для нового дня',
		'Я хочу быть активным(ой), но почему-то мне это не удаётся',
		'Когда я прилагаю усилия, я быстро устаю',
		'В конце дня я чувствую себя внутренне опустошённым(ой) и выжатым(ой)',
		'Мне трудно найти в себе энтузиазм к моей работе',
		'Я чувствую сильное отвращение к моей работе',
		'Я чувствую, что моя работа мне безразлична',
		'Я сомневаюсь, что моя работа имеет для кого-то значение',
		'Мне сложно оставаться собранным(ой)',
		'Мне с трудом удается мыслить ясно',
		'Я забывчив(а) и рассеян(на)',
		'Мне сложно сконцентрироваться',
		'Я делаю ошибки, потому что думаю о других вещах',
		'Я чувствую, что не способен(а) контролировать свои эмоции',
		'Я не узнаю себя в том, как я эмоционально реагирую',
		'Я раздражаюсь, если дела идут не так, как я хочу',
		'Я расстраиваюсь и огорчаюсь, сам(а) не зная, почему',
		'Я могу слишком остро реагировать, сам(а) того не желая'
	].map((text, index) => ({ id: `g${index + 1}`, text }));

	const workGroups = [
		{ name: 'Истощение', ids: workQuestions.slice(0, 8).map((q) => q.id), orange: 3.06, red: 3.31 },
		{
			name: 'Психологическое дистанцирование',
			ids: workQuestions.slice(8, 13).map((q) => q.id),
			orange: 2.1,
			red: 3.3
		},
		{
			name: 'Когнитивные нарушения',
			ids: workQuestions.slice(13, 18).map((q) => q.id),
			orange: 2.7,
			red: 3.1
		},
		{
			name: 'Эмоциональные нарушения',
			ids: workQuestions.slice(18, 23).map((q) => q.id),
			orange: 2.3,
			red: 2.9
		}
	];
	const generalGroups = [
		{
			name: 'Истощение',
			ids: generalQuestions.slice(0, 8).map((q) => q.id),
			orange: 3.31,
			red: 3.81
		},
		{
			name: 'Психологическое дистанцирование',
			ids: generalQuestions.slice(8, 12).map((q) => q.id),
			orange: 2.5,
			red: 3.1
		},
		{
			name: 'Когнитивные нарушения',
			ids: generalQuestions.slice(12, 17).map((q) => q.id),
			orange: 2.7,
			red: 3.5
		},
		{
			name: 'Эмоциональные нарушения',
			ids: generalQuestions.slice(17, 22).map((q) => q.id),
			orange: 2.1,
			red: 3.5
		}
	];

	type Bat23State = AssessmentState & {
		version?: Version;
		selectingVersion: boolean;
	};

	const storageKey = 'questionnaire-bat23-state';
	const initialState = loadAssessmentState<Bat23State>(storageKey, {
		answers: {},
		currentStep: 0,
		showResults: false,
		version: undefined,
		selectingVersion: true
	});
	const initialVersion: Version | undefined =
		initialState.version === 'work' || initialState.version === 'general'
			? initialState.version
			: undefined;
	const initialQuestions =
		initialVersion === 'work'
			? workQuestions
			: initialVersion === 'general'
				? generalQuestions
				: [];
	const hasCompleteInitialResult =
		initialQuestions.length > 0 &&
		initialQuestions.every((question) => initialState.answers[question.id] !== undefined);

	let version = $state<Version | undefined>(initialVersion);
	let answers = $state<Record<string, number>>(initialState.answers);
	let selectingVersion = $state(initialVersion ? initialState.selectingVersion === true : true);
	let currentStep = $state(
		initialQuestions.length ? Math.min(initialState.currentStep, initialQuestions.length - 1) : 0
	);
	let showResults = $state(initialState.showResults && hasCompleteInitialResult);
	let resultSection = $state<HTMLElement>();
	const activeQuestions = $derived(
		version === 'work' ? workQuestions : version === 'general' ? generalQuestions : []
	);
	const activeGroups = $derived(version === 'work' ? workGroups : generalGroups);
	const currentQuestion = $derived(activeQuestions[currentStep]);
	const mean = $derived(
		activeQuestions.length
			? activeQuestions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0) /
					activeQuestions.length
			: 0
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
				? 'Средний показатель находится в зелёной зоне выбранной версии BAT. Это скрининговый результат, а не гарантия отсутствия выгорания.'
				: current.tone === 'orange'
					? 'Средний показатель соответствует зоне повышенного риска. Имеет смысл подробнее оценить нагрузку, восстановление и устойчивость симптомов.'
					: 'Средний показатель соответствует красной зоне BAT и выраженным признакам выгорания. Для заключения нужна дополнительная информация и клиническое интервью.';
		return { ...current, recommendation };
	});
	const subscales = $derived(
		activeGroups.map((group): ResultSubscale => {
			const value = group.ids.reduce((sum, id) => sum + (answers[id] ?? 0), 0) / group.ids.length;
			const current = zone(value, group.orange, group.red);
			return { name: group.name, value, max: 5, severity: current.severity, tone: current.tone };
		})
	);

	$effect(() => {
		saveAssessmentState(storageKey, {
			answers,
			currentStep,
			showResults,
			version,
			selectingVersion
		});
	});

	function chooseVersion(value: number) {
		version = value === 1 ? 'work' : 'general';
		answers = {};
		currentStep = 0;
		showResults = false;
	}
	function setAnswer(id: string, value: number) {
		answers = { ...answers, [id]: value };
	}
	function start() {
		if (!version) return;
		selectingVersion = false;
		currentStep = 0;
	}
	function back() {
		if (currentStep > 0) {
			currentStep -= 1;
			return;
		}
		selectingVersion = true;
	}
	async function next() {
		if (!currentQuestion || answers[currentQuestion.id] === undefined) return;
		if (currentStep < activeQuestions.length - 1) {
			currentStep += 1;
			return;
		}
		showResults = true;
		await tick();
		resultSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
	function reset() {
		version = undefined;
		answers = {};
		selectingVersion = true;
		currentStep = 0;
		showResults = false;
	}
</script>

<svelte:head>
	<title>Опросник профессионального выгорания BAT-23 онлайн</title>
	<meta
		name="description"
		content="Официальные русские формы BAT: 23 пункта для работающих и отдельная общая версия из 22 пунктов."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<AssessmentPage
	title="Опросник выгорания BAT — полная версия"
	description="Официальная версия для работающих или отдельная общая форма"
	time="8–12 минут"
	questions={version === 'general'
		? '22 вопроса'
		: version === 'work'
			? '23 вопроса'
			: '22 или 23 вопроса'}
 methodologyKey="bat23">
	{#snippet info()}
		<p>
			Для работающих используется официальная 23-пунктовая форма. Для неработающих — официальная
			общая форма из 22 пунктов: в ней нет пункта про «автопилот» и иначе распределены номера
			субшкал.
		</p>
		<p>
			Не удивляйтесь рабочим формулировкам в четырёх пунктах общей версии: именно так они приведены
			в официальном русском бланке, и мы не заменяем их самодельным переводом.
		</p>
		{#if version === 'work'}
			<p>
				Для рабочей версии используются объединённые предварительные пороги исследования 2023 года
				на выборках Нидерландов, Бельгии и Финляндии. Это не российские нормы. Особенно осторожно
				следует трактовать субшкалу психологического дистанцирования.
			</p>
		{:else if version === 'general'}
			<p>
				Для общей версии используются границы из руководства BAT, полученные прежде всего на
				фламандской выборке. Это не российские нормы и не диагностическое заключение.
			</p>
		{/if}
	{/snippet}

	{#if selectingVersion}
		<AssessmentWizard
			step={1}
			total={1}
			stepLabel="Подготовка"
			canGoNext={version !== undefined}
			onnext={start}
			nextLabel="Начать"
		>
			<AssessmentQuestion
				id="version"
				text="Есть ли у вас сейчас работа?"
				options={versionOptions}
				value={version === 'work' ? 1 : version === 'general' ? 0 : undefined}
				onchange={chooseVersion}
			/>
		</AssessmentWizard>
	{:else if version && !showResults && currentQuestion}
		<AssessmentWizard
			step={currentStep + 1}
			total={activeQuestions.length}
			instruction="Насколько часто это утверждение соответствует вашим ощущениям?"
			canGoBack
			canGoNext={answers[currentQuestion.id] !== undefined}
			onback={back}
			onnext={next}
			nextLabel={currentStep === activeQuestions.length - 1 ? 'Посмотреть результат' : 'Далее'}
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
	{:else if version && showResults}
		<div bind:this={resultSection}>
			<AssessmentResult
				title={version === 'work' ? 'Результат BAT-23' : 'Результат общей BAT-22'}
				value={mean}
				max={5}
				decimals={2}
				severity={totalResult.severity}
				tone={totalResult.tone}
				recommendation={totalResult.recommendation}
				note={version === 'work'
					? 'Общий порог: оранжевая зона с 2,59, красная — с 3,02. Пороговые значения предварительные и получены не на российской выборке.'
					: 'Для общей версии показаны пороги из руководства BAT. Они не являются российскими нормами.'}
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
