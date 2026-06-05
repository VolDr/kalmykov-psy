import type { SurveyConfig } from '$lib/data/surveys/types';

export const cpqConfig: SurveyConfig = {
	id: 'cpq',
	title: 'Опросник клинического перфекционизма (CPQ)',
	description: 'Опросник клинического перфекционизма',
	time: '3-6 минут',
	infoSections: {
		beforeUse: {
			title: 'О шкале клинического перфекционизма',
			type: 'info',
			content:
				'Опросник клинического перфекционизма (CPQ) — инструмент для оценки перфекционистских тенденций.\n\nОпросник измеряет три фактора:\n\n\t— Самооценка на основании достижений\n\n\t— Соответствие высоким стандартам\n\n\t— Негативное оценивание результатов\n\nОбщий балл варьируется от 12 до 48.',
			expanded: true
		}
	},

	questions: [
		{
			id: 'subheading',
			type: 'subheading',
			text: ''
		},
		{
			id: 'q1',
			text: 'За последний месяц вы прилагали большие усилия к достижению своих целей?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q2',
			text: 'За последний месяц вы были склонны сосредотачиваться скорее на том, чего вы достигли, а не на том, чего вы не достигли?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 4, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 2, points: 2 },
				{ label: 'Постоянно', value: 1, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q3',
			text: 'За последний месяц вам говорили, что ваши стандарты слишком высоки?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q4',
			text: 'За последний месяц вы чувствовали себя неудачником, потому что вы не преуспели в достижении своих целей?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q5',
			text: 'За последний месяц вы боялись, что можете не достичь ваших стандартов?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q6',
			text: 'За последний месяц вы повышали свои стандарты, потому что вы думали, что они были слишком просты в достижении?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q7',
			text: 'За последний месяц вы оценивали себя на основе своей способности достигать высоких стандартов?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q8',
			text: 'За последний месяц вы сделали достаточно для того, чтобы минимально соответствовать своим стандартам?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 4, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 2, points: 2 },
				{ label: 'Постоянно', value: 1, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q9',
			text: 'За последний месяц вы неоднократно проверяли как хорошо вы соответствуете своим стандартам (например, сравнивая свои результаты с результатами других)?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q10',
			text: 'Как вы думаете, за последний месяц другие люди подумали бы о вас как о «перфекционисте»?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q11',
			text: 'За последний месяц вы прилагали большие усилия к достижению своих целей?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q12',
			text: 'За последний месяц вы избегали каких-либо проверок своей результативности (при достижении целей) в случае, если вы потерпели неудачу?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Совсем нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Постоянно', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		}
	],

	scoring: {
		method: 'sum',
		maxScore: 48,
		maxAverageScore: 4,
		interpretation: [
			{
				min: 12,
				max: 23,
				severity: 'Низкий уровень перфекционизма',
				recommendation:
					'Ваш результат указывает на низкий уровень клинического перфекционизма.\n\nВы склонны ставить реалистичные цели и не слишком жёстко оцениваете себя на основании достижений.\n\nСпециальная помощь не требуется.',
				color: 'green'
			},
			{
				min: 24,
				max: 35,
				severity: 'Умеренный уровень перфекционизма',
				recommendation:
					'Ваш результат указывает на умеренный уровень клинического перфекционизма.\n\nВы стремитесь к высоким стандартам, но это не всегда приводит к значительному дистрессу.\n\nСтарайтесь отслеживать ситуации, когда стремление к совершенству начинает мешать вашему благополучию.',
				color: 'yellow'
			},
			{
				min: 36,
				max: 48,
				severity: 'Высокий уровень перфекционизма',
				recommendation:
					'Ваш результат указывает на выраженный клинический перфекционизм.\n\nКлинический перфекционизм может быть связан с повышенным уровнем тревоги, депрессии и другими психологическими трудностями.\n\nРекомендуется [консультация с психологом](https://t.me/m/UJBYiSocNzE6) для работы с перфекционизмом и его влиянием на вашу жизнь.',
				color: 'red'
			}
		],
		subscales: [
			{
				id: 'factor1',
				name: 'Фактор 1: Самооценка на основании достижений',
				description:
					'Оценивает степень, в которой ваша самоценность и самоуважение зависят исключительно от вашей способности достигать высокие стандарты.',
				questionIds: ['q4', 'q5', 'q7', 'q9', 'q12'],
				displayMethod: 'sum',
				interpretation: [
					{
						min: 5,
						max: 8,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 9,
						max: 14,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 15,
						max: 20,
						severity: 'Высокий',
						color: 'red'
					}
				]
			},
			{
				id: 'factor2',
				name: 'Фактор 2: Соответствие высоким стандартам',
				description:
					'Эта шкала измеряет поведенческий и мотивационный компонент перфекционизма — насколько вы:\n\n  1. Активно устанавливаете нереалистично высокие стандарты.\n  2. Неустанно пытаетесь их достичь, несмотря на препятствия.\n  3. Готовы жертвовать другими важными сферами жизни ради соответствия этим стандартам.',
				questionIds: ['q1', 'q3', 'q6', 'q10', 'q11'],
				displayMethod: 'sum',
				interpretation: [
					{
						min: 5,
						max: 8,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 9,
						max: 14,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 15,
						max: 20,
						severity: 'Высокий',
						color: 'red'
					}
				]
			},
			{
				id: 'factor3',
				name: 'Фактор 3: Негативное оценивание результатов',
				description:
					'Эта шкала измеряет, насколько вы склонны к селективному вниманию к неудачам и недостаткам, игнорируя или минимизируя успехи.',
				questionIds: ['q2', 'q8'],
				displayMethod: 'sum',
				interpretation: [
					{
						min: 2,
						max: 3,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 4,
						max: 6,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 7,
						max: 8,
						severity: 'Высокий',
						color: 'red'
					}
				]
			}
		]
	}
};
