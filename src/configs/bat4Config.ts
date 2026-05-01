import type { SurveyConfig } from '$lib/data/surveys/types';

export const bat4Config: SurveyConfig = {
	id: 'bat4',
	title: 'BAT-4',
	description: 'Ультракороткий опросник для оценки профессионального выгорания',

	infoSections: {
		beforeUse: {
			title: 'Важный дисклеймер',
			type: 'warning',
			content:
				'BAT-4 не рекомендуется для индивидуальной диагностики. Используется только для группового скрининга на организационном уровне.\n\nДля индивидуальной диагностики воспользуйтесь [BAT-12](/surveys/bat12) или [BAT-23](/surveys/bat23).\n\nПрохождение этого теста не заменяет консультацию со специалистом. Если результаты теста вызывают у вас беспокойство, пожалуйста, [обратитесь к специалисту](https://t.me/m/UJBYiSocNzE6) для получения профессиональной помощи.',
			expanded: true
		}
	},

	questions: [
		{
			id: 'subheading',
			type: 'subheading',
			text: 'Как часто вы испытываете следующие ощущения относительно своей работы?'
		},
		{
			id: 'q1',
			text: 'На работе я чувствую душевную усталость',
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
			text: 'Мне трудно найти в себе энтузиазм к моей работе',
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
			text: 'Когда я работаю, мне сложно сконцентрироваться',
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
			text: 'На работе я могу слишком остро реагировать, сам(а) того не желая',
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
		maxScore: 20,
		maxAverageScore: 5.0,
		interpretation: [
			{
				min: 1.0,
				max: 2.5,
				severity: 'Нет риска выгорания',
				recommendation:
					'Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).',
				color: 'green'
			},
			{
				min: 2.51,
				max: 3.0,
				severity: 'Риск выгорания',
				recommendation:
					'Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).',
				color: 'orange'
			},
			{
				min: 3.01,
				max: 5.0,
				severity: 'Выгорание присутствует',
				recommendation:
					'Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).',
				color: 'red'
			}
		]
	}
};
