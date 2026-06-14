import type { QuestionnaireConfig } from '$lib/data/questionnaires/types';


export const bat23Config: QuestionnaireConfig = {
    id: 'bat23',
    title: 'BAT-23',
    description: 'Опросник для оценки признаков профессионального выгорания',


    infoSections: {
        beforeUse: {
            title: 'Несколько слов перед началом',
            type: 'warning',
            content:
                'BAT-23 используется для индивидуальной оценки состояния при выгорании.\n\nЭто полная версия опросника — она даёт наиболее полное представление о вашем состоянии и позволяет рассмотреть разные его стороны.\n\nОпросник не заменяет живую встречу со специалистом. Если результаты вас встревожат или вызовут вопросы — [я готов поговорить](https://t.me/psy_kalmykov).',
            expanded: true
        }
    },


	questions: [
		{
			id: 'hasWork',
			text: 'Есть ли у вас сейчас работа?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Да, я работаю', value: 1 },
				{ label: 'Нет, я не работаю', value: 0 }
			],
			countInScore: false
		},
		{
			id: 'subheading1',
			type: 'subheading',
			text: 'Как часто вы испытываете следующие ощущения относительно своей работы?',
			alternativeText: 'Как часто вы испытываете следующие ощущения в повседневной жизни?',
			textCondition: (answers) => answers.hasWork === 0
		},
		// Истощение (8 вопросов)
		{
			id: 'q1',
			text: 'На работе я чувствую душевную усталость',
			alternativeText: 'В повседневной жизни я чувствую душевную усталость',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q2',
			text: 'Всё, что я делаю на работе, требует от меня больших усилий',
			alternativeText: 'Всё, что я делаю, требует от меня больших усилий',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q3',
			text: 'После рабочего дня мне трудно восстановить свои силы',
			alternativeText: 'После дня мне трудно восстановить свои силы',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q4',
			text: 'На работе я чувствую физическую усталость',
			alternativeText: 'В повседневной жизни я чувствую физическую усталость',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q5',
			text: 'Просыпаясь утром, я чувствую нехватку сил для нового рабочего дня',
			alternativeText: 'Просыпаясь утром, я чувствую нехватку сил для нового дня',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q6',
			text: 'Я хочу быть активным(ой) на работе, но почему-то мне это не удаётся',
			alternativeText: 'Я хочу быть активным(ой), но почему-то мне это не удаётся',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q7',
			text: 'Когда я прилагаю усилия к работе, я быстро устаю',
			alternativeText: 'Когда я прилагаю усилия, я быстро устаю',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q8',
			text: 'В конце рабочего дня я чувствую себя внутренне опустошённым(ой) и выжатым(ой)',
			alternativeText: 'В конце дня я чувствую себя внутренне опустошённым(ой) и выжатым(ой)',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		// Внутреннее дистанцирование (5 вопросов)
		{
			id: 'q9',
			text: 'Мне трудно найти в себе энтузиазм к моей работе',
			alternativeText: 'Мне трудно найти в себе энтузиазм к повседневным делам',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q10',
			text: 'На работе я не задумываюсь, о том, что делаю, работаю на автопилоте',
			alternativeText: 'В повседневной жизни я не задумываюсь о том, что делаю, живу на автопилоте',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q11',
			text: 'Я чувствую сильное отвращение к моей работе',
			alternativeText: 'Я чувствую сильное отвращение к повседневным делам',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q12',
			text: 'Я чувствую, что моя работа мне безразлична',
			alternativeText: 'Я чувствую, что повседневные дела мне безразличны',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q13',
			text: 'Я сомневаюсь, что моя работа имеет для кого-то значение',
			alternativeText: 'Я сомневаюсь, что мои повседневные дела имеют для кого-то значение',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		// Когнитивные затруднения (5 вопросов)
		{
			id: 'q14',
			text: 'На работе мне сложно оставаться собранным(ой)',
			alternativeText: 'В повседневной жизни мне сложно оставаться собранным(ой)',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q15',
			text: 'Во время работы мне с трудом удается мыслить ясно',
			alternativeText: 'Мне с трудом удается мыслить ясно',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q16',
			text: 'На работе я забывчив(а) и рассеян(на)',
			alternativeText: 'Я забывчив(а) и рассеян(на)',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q17',
			text: 'Когда я работаю, мне сложно сконцентрироваться',
			alternativeText: 'Мне сложно сконцентрироваться',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q18',
			text: 'Я делаю ошибки в процессе работы, потому что думаю о других вещах',
			alternativeText: 'Я делаю ошибки, потому что думаю о других вещах',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		// Эмоциональные затруднения (5 вопросов)
		{
			id: 'q19',
			text: 'На работе я чувствую, что не способен(а) контролировать свои эмоции',
			alternativeText: 'Я чувствую, что не способен(а) контролировать свои эмоции',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q20',
			text: 'Я не узнаю себя в том, как я эмоционально реагирую на работе',
			alternativeText: 'Я не узнаю себя в том, как я эмоционально реагирую',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q21',
			text: 'Во время работы я раздражаюсь, если дела идут не так, как я хочу',
			alternativeText: 'Я раздражаюсь, если дела идут не так, как я хочу',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q22',
			text: 'Я расстраиваюсь и огорчаюсь на работе, сам(а) не зная, почему',
			alternativeText: 'Я расстраиваюсь и огорчаюсь, сам(а) не зная, почему',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q23',
			text: 'На работе я могу слишком остро реагировать, сам(а) того не желая',
			alternativeText: 'Я могу слишком остро реагировать, сам(а) того не желая',
			textCondition: (answers) => answers.hasWork === 0,
			type: 'radio',
			required: true,
			options: [
				{ label: 'Никогда', value: 1, points: 1 },
				{ label: 'Редко', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 4, points: 4 },
				{ label: 'Постоянно', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		}
	],

    scoring: {
        method: 'average',
        maxScore: 115,
        maxAverageScore: 5.0,
interpretation: [
{
min: 1.0,
max: 2.58,
severity: 'Признаков выгорания не выявлено',
recommendation:
'Ваши результаты в зелёной зоне. По ответам сейчас не видно выраженных признаков выгорания: похоже, баланс между нагрузкой и ресурсами пока сохраняется.\n\nЭто не значит, что перегрузки не бывает совсем. Скорее, сейчас у вас ещё есть запас сил, вовлечённость и способность восстанавливаться после напряжения.\n\n**Что с этим делать**\n\nВ зелёной зоне главная задача — не срочно что-то чинить, а поддерживать то, что уже работает: сон, регулярный отдых, понятные границы рабочего времени, смену видов нагрузки и занятия, которые возвращают ощущение жизни вне работы.\n\nПолезно заранее замечать ранние сигналы перегрузки: когда вечером становится сложнее выключиться из рабочих мыслей, отдых начинает сопровождаться виной, простые задачи требуют больше усилий, а прокрастинация появляется не из лени, а из усталости.\n\nНиже вы увидите короткий ориентир по шкалам. Он поможет понять, где пока всё стабильно и на какие признаки стоит обращать внимание в будущем.',
color: 'green'
},
{
min: 2.59,
max: 3.01,
severity: 'Есть риск выгорания',
recommendation:
'Ваши результаты попали в оранжевую зону. Это не катастрофа, но уже сигнал: первые признаки истощения заметны, и обычного отдыха может становиться недостаточно.\n\nВ таком состоянии человек часто ещё продолжает справляться, но цена становится выше. Простые задачи занимают больше времени, отдых хуже восстанавливает, раздражение появляется быстрее, а желание всё отложить может усиливаться именно на фоне усталости.\n\n**Что с этим делать**\n\nСейчас важно не пытаться просто сильнее собраться. Лучше понять, что именно начинает возвращать вас в перегрузку: рабочие условия, страх отказать, привычка всегда быть на связи, перфекционизм, самокритика или ощущение, что отдых нужно заслужить.\n\nВ оранжевой зоне изменения обычно проще начинать с небольших шагов: снизить часть необязательной нагрузки, заранее выделить время без рабочих чатов, заметить ситуации, где вы автоматически соглашаетесь на лишнее, и проверить, что можно изменить уже сейчас, пока состояние не стало тяжелее.\n\nНиже вы увидите, какие стороны выгорания выражены у вас сильнее всего. Это поможет понять, с чего разумнее начинать: с восстановления сил, снижения когнитивной перегрузки, работы с эмоциональным напряжением или пересмотра отношений с работой.',
color: 'orange'
},
{
min: 3.02,
max: 5.0,
severity: 'Выраженные признаки выгорания',
recommendation:
'Ваш результат в красной зоне. По ответам видны выраженные признаки выгорания: усталость уже может влиять не только на работу, но и на отдых, сон, концентрацию, отношения и ощущение смысла.\n\nВ такой точке проблема обычно не решается одним выходным, отпуском или попыткой «собраться». Человек может формально отдыхать, но не восстанавливаться; закрывать задачи, но чувствовать всё меньше вовлечённости; понимать, что нужно остановиться, но снова дожимать, соглашаться и оставаться на связи.\n\nВажно не объяснять это ленью, слабостью или недостаточной дисциплиной. При выгорании часто перестают помогать именно те стратегии, которые раньше работали: терпеть, контролировать, брать на себя больше, быть надёжным и справляться самому.\n\n**Что с этим делать**\n\nСейчас важно не искать ещё одну технику быстрого восстановления, а понять, что именно снова возвращает вас в истощение.\n\nИногда это рабочая среда: постоянная перегрузка, нехватка контроля, размытые границы, слишком много ответственности без возможности влиять на ситуацию.\n\nИногда — привычные правила, по которым вы действуете автоматически: «я должен быть на связи», «если я откажу, подведу команду», «хороший специалист справляется сам», «отдых нужно заслужить».\n\nА часто — сочетание и того, и другого.\n\nНиже вы увидите, какие стороны выгорания выражены у вас сильнее всего. Это поможет понять, с чего разумнее начинать: с восстановления сил, снижения когнитивной перегрузки, работы с эмоциональным напряжением или пересмотра отношений с работой.',
color: 'red'
}
],


        subscales: [
            {
                id: 'exhaustion',
                name: 'Истощение',
                description:
                    'Истощение — это глубокая физическая и душевная усталость, которая не уходит даже после отдыха. При высоких показателях вы можете чувствовать себя полностью опустошённым к концу дня, уставать очень быстро и просыпаться по утрам уже без сил.',
                questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'],
                interpretation: [
                    { min: 1.0, max: 3.05, severity: 'Нет риска', color: 'green' },
                    { min: 3.06, max: 3.3, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.31, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                alternativeInterpretation: [
                    { min: 1.0, max: 3.3, severity: 'Нет риска', color: 'green' },
                    { min: 3.31, max: 3.8, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.81, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                interpretationCondition: (answers) => answers.hasWork === 0,
                displayMethod: 'average'
            },
            {
                id: 'distancing',
                name: 'Внутреннее дистанцирование',
                description:
                    'Внутреннее дистанцирование — это когда работа начинает становиться чужой: пропадает интерес, всё чаще включается «автопилот», появляется ощущение безразличия или отторжения. Иногда возникает чувство, что то, что вы делаете, не имеет смысла.',
                questionIds: ['q9', 'q10', 'q11', 'q12', 'q13'],
                interpretation: [
                    { min: 1.0, max: 2.09, severity: 'Нет риска', color: 'green' },
                    { min: 2.1, max: 3.29, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.3, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                alternativeInterpretation: [
                    { min: 1.0, max: 2.49, severity: 'Нет риска', color: 'green' },
                    { min: 2.5, max: 3.09, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.1, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                interpretationCondition: (answers) => answers.hasWork === 0,
                displayMethod: 'average'
            },
            {
                id: 'cognitive',
                name: 'Когнитивные затруднения',
                description:
                    'Когнитивные затруднения — это когда становится сложнее думать, запоминать и концентрироваться. При высоких показателях вы можете замечать, что стали более рассеянным(ой), мысли «плывут», трудно принять решение или удержать внимание на задаче.',
                questionIds: ['q14', 'q15', 'q16', 'q17', 'q18'],
                interpretation: [
                    { min: 1.0, max: 2.69, severity: 'Нет риска', color: 'green' },
                    { min: 2.7, max: 3.09, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.1, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                alternativeInterpretation: [
                    { min: 1.0, max: 2.69, severity: 'Нет риска', color: 'green' },
                    { min: 2.7, max: 3.49, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.5, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                interpretationCondition: (answers) => answers.hasWork === 0,
                displayMethod: 'average'
            },
            {
                id: 'emotional',
                name: 'Эмоциональные затруднения',
                description:
                    'Эмоциональные затруднения — это когда управлять своими эмоциями становится труднее, чем обычно. При высоких показателях вы можете замечать, что острее реагируете на мелочи, срываетесь — хотя сами этого не хотите, или расстраиваетесь без видимой причины. Эмоциональные реакции становятся менее предсказуемыми.',
                questionIds: ['q19', 'q20', 'q21', 'q22', 'q23'],
                interpretation: [
                    { min: 1.0, max: 2.29, severity: 'Нет риска', color: 'green' },
                    { min: 2.3, max: 2.89, severity: 'Риск выгорания', color: 'orange' },
                    { min: 2.9, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                alternativeInterpretation: [
                    { min: 1.0, max: 3.09, severity: 'Нет риска', color: 'green' },
                    { min: 3.1, max: 3.49, severity: 'Риск выгорания', color: 'orange' },
                    { min: 3.5, max: 5.0, severity: 'Выгорание', color: 'red' }
                ],
                interpretationCondition: (answers) => answers.hasWork === 0,
                displayMethod: 'average'
            }
        ]
    }
};