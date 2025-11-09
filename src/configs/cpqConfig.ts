import type { SurveyConfig } from '$lib/data/surveys/types';

export const cpqConfig: SurveyConfig = {
	id: 'cpq',
	title: 'CPQ',
	description: 'Опросник клинического перфекционизма',

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
			text: 'За последний месяц...'
		},
		{
			id: 'q1',
			text: 'Прилагали ли вы большие усилия к достижению целей?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q2',
			text: 'Сосредотачивались ли вы скорее на достижениях, нежели на недостижениях?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 4, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 2, points: 2 },
				{ label: 'Всегда', value: 1, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q3',
			text: 'Говорили ли вам, что ваши стандарты слишком высоки?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q4',
			text: 'Чувствовали ли вы себя неудачником из-за того, что не преуспели в достижении целей?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q5',
			text: 'Боялись ли вы, что можете не достичь своих стандартов?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q6',
			text: 'Повышали ли вы стандарты, думая, что они слишком просты в достижении?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q7',
			text: 'Оценивали ли вы себя на основе своей способности достигать высоких стандартов?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q8',
			text: 'Сделали ли вы достаточно для минимального соответствия стандартам?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 4, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Часто', value: 2, points: 2 },
				{ label: 'Всегда', value: 1, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q9',
			text: 'Неоднократно ли вы проверяли, как хорошо вы соответствуете своим стандартам?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q10',
			text: 'Подумали бы другие люди о вас как о "перфекционисте"?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q11',
			text: 'Продолжали ли вы пытаться соответствовать стандартам, даже если это означало ущерб какой-то части жизни?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q12',
			text: 'Избегали ли вы каких-либо проверок в случае неудачи?',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Нет', value: 1, points: 1 },
				{ label: 'Иногда', value: 2, points: 2 },
				{ label: 'Часто', value: 3, points: 3 },
				{ label: 'Всегда', value: 4, points: 4 }
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
					'Ваш результат указывает на низкий уровень перфекционистских тенденций.\n\nВы склонны ставить реалистичные цели и не слишком жёстко оцениваете себя на основании достижений.\n\nСпециальная помощь не требуется.',
				color: 'green'
			},
			{
				min: 24,
				max: 35,
				severity: 'Умеренный уровень перфекционизма',
				recommendation:
					'Ваш результат указывает на умеренный уровень перфекционистских тенденций.\n\nВы стремитесь к высоким стандартам, но это не всегда приводит к значительному дистрессу.\n\nСтарайтесь отслеживать ситуации, когда стремление к совершенству начинает мешать вашему благополучию.',
				color: 'yellow'
			},
			{
				min: 36,
				max: 48,
				severity: 'Высокий уровень перфекционизма',
				recommendation:
					'Ваш результат указывает на высокий уровень перфекционистских тенденций.\n\nКлинический перфекционизм может быть связан с повышенным уровнем тревоги, депрессии и другими психологическими трудностями.\n\nРекомендуется [консультация с психологом](/online-therapy) для работы с перфекционизмом и его влиянием на вашу жизнь.',
				color: 'red'
			}
		],
		subscales: [
			{
				id: 'factor1',
				name: 'Фактор 1: Самооценка на основании достижений',
				description:
					'Оценивает склонность судить о себе на основе способности достигать целей и соответствовать стандартам',
				questionIds: ['q4', 'q5', 'q7', 'q9', 'q12'],
				interpretation: [
					{
						min: 1,
						max: 2.2,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 2.21,
						max: 3.2,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 3.21,
						max: 4,
						severity: 'Высокий',
						color: 'red'
					}
				]
			},
			{
				id: 'factor2',
				name: 'Фактор 2: Соответствие высоким стандартам',
				description:
					'Оценивает склонность устанавливать и поддерживать очень высокие стандарты для себя',
				questionIds: ['q1', 'q3', 'q6', 'q10', 'q11'],
				interpretation: [
					{
						min: 1,
						max: 2.2,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 2.21,
						max: 3.2,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 3.21,
						max: 4,
						severity: 'Высокий',
						color: 'red'
					}
				]
			},
			{
				id: 'factor3',
				name: 'Фактор 3: Негативное оценивание результатов',
				description:
					'Оценивает склонность фокусироваться на неудачах и недостаточном соответствии стандартам',
				questionIds: ['q2', 'q8'],
				interpretation: [
					{
						min: 1,
						max: 2,
						severity: 'Низкий',
						color: 'green'
					},
					{
						min: 2.01,
						max: 3,
						severity: 'Умеренный',
						color: 'yellow'
					},
					{
						min: 3.01,
						max: 4,
						severity: 'Высокий',
						color: 'red'
					}
				]
			}
		]
	}
};
