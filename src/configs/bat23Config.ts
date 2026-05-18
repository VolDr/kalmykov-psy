import type { SurveyConfig } from '$lib/data/surveys/types';

export const bat23Config: SurveyConfig = {
	id: 'bat23',
	title: 'BAT-23',
	description: 'Полный опросник для диагностической оценки профессионального выгорания',

	infoSections: {
		beforeUse: {
			title: 'Важный дисклеймер',
			type: 'warning',
			content:
				'BAT-23 рекомендован для индивидуальной диагностической оценки выгорания.\n\nЭто полная версия опросника, которая даёт наиболее точную оценку вашего состояния и позволяет оценить все аспекты профессионального выгорания.\n\nПрохождение этого опросника не заменяет консультацию со специалистом. Если результаты теста вызывают у вас беспокойство, пожалуйста, [обратитесь к специалисту](https://t.me/m/UJBYiSocNzE6) для получения профессиональной помощи.',
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
				severity: 'Нет риска выгорания',
				recommendation:
					'Ваши результаты находятся в зелёной зоне, что означает отсутствие риска выгорания. Вы справляетесь с рабочими требованиями, у вас достаточно энергии и вовлечённости в работу. Это хороший результат, который говорит о здоровом балансе между рабочей нагрузкой и вашими ресурсами.\n\nРекомендации:\n— Регулярно заполняйте опросник для мониторинга состояния',
				color: 'green'
			},
			{
				min: 2.59,
				max: 3.01,
				severity: 'Риск выгорания',
				recommendation:
					'Ваши результаты попадают в оранжевую зону, что указывает на риск развития выгорания. Это означает, что вы начинаете испытывать симптомы, которые требуют внимания. Сейчас критически важно предпринять меры для предотвращения дальнейшего ухудшения состояния.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](https://t.me/m/UJBYiSocNzE6)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния',
				color: 'orange'
			},
			{
				min: 3.02,
				max: 5.0,
				severity: 'Выгорание присутствует',
				recommendation:
					'Ваши результаты находятся в красной зоне, что указывает на присутствие выгорания. Это серьёзное состояние, которое требует немедленного внимания и активного вмешательства. Вы испытываете значительное истощение и другие симптомы, которые существенно влияют на ваше функционирование и благополучие.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](https://t.me/m/UJBYiSocNzE6)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния',
				color: 'red'
			}
		],
		subscales: [
			{
				id: 'exhaustion',
				name: 'Истощение',
				description:
					'Истощение — это когда вы чувствуете сильную физическую и душевную усталость, которая не проходит даже после отдыха. Вы можете чувствовать себя полностью опустошенным после рабочего дня, быстро устаете даже при минимальных усилиях, и утром просыпаетесь уже уставшим.',
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
					'Внутреннее дистанцирование — это когда вы начинаете отстраняться от своей работы, теряете к ней интерес и энтузиазм. Вы можете чувствовать сильную неприязнь к работе, безразличие, работать «на автопилоте», избегать контакта с коллегами или клиентами. Вы можете начать сомневаться, имеет ли ваша работа вообще какое-то значение.',
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
					'Когнитивные затруднения — это когда вам становится трудно думать, концентрироваться и запоминать. Вы можете замечать, что стали забывчивым и рассеянным, сложно удерживать внимание на задаче, трудно ясно мыслить и принимать решения. Вы можете делать ошибки, потому что отвлекаетесь или думаете о другом.',
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
					'Эмоциональные затруднения — это когда вам становится трудно контролировать свои эмоции. Вы можете слишком остро реагировать на мелочи, срываться на других, сами того не желая, расстраиваться и огорчаться без очевидной причины. Вы можете не узнавать себя в своих эмоциональных реакциях — они становятся более интенсивными и непредсказуемыми.',
				questionIds: ['q19', 'q20', 'q21', 'q22', 'q23'],
				interpretation: [
					{ min: 1.0, max: 2.29, severity: 'Нет риска', color: 'green' },
					{ min: 2.3, max: 2.89, severity: 'Риск выгорания', color: 'orange' },
					{ min: 2.9, max: 5.0, severity: 'Выгорание', color: 'red' }
				],
				alternativeInterpretation: [
					{ min: 1.0, max: 2.09, severity: 'Нет риска', color: 'green' },
					{ min: 2.1, max: 3.49, severity: 'Риск выгорания', color: 'orange' },
					{ min: 3.5, max: 5.0, severity: 'Выгорание', color: 'red' }
				],
				interpretationCondition: (answers) => answers.hasWork === 0,
				displayMethod: 'average'
			}
		]
	}
};
