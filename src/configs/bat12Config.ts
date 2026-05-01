import type { SurveyConfig } from '$lib/data/surveys/types';

export const bat12Config: SurveyConfig = {
	id: 'bat12',
	title: 'BAT-12',
	description: 'Короткий опросник для оценки профессионального выгорания',

	infoSections: {
		beforeUse: {
			title: 'Важный дисклеймер',
			type: 'warning',
			content:
				'BAT-12 может использоваться для скрининга, мониторинга и организационных исследований, где важна экономия времени респондентов.\n\nЕсли вы не скованы временем и хотите получить более детальную оценку, лучше будет пройти [BAT-23](/surveys/bat23).\n\nПрохождение этого теста не заменяет консультацию со специалистом. Если результаты теста вызывают у вас беспокойство, пожалуйста, [обратитесь к специалисту](https://t.me/m/UJBYiSocNzE6) для получения профессиональной помощи.',
			expanded: true
		}
	},

	questions: [
		{
			id: 'subheading',
			type: 'subheading',
			text: 'Как часто вы испытываете следующие ощущения относительно своей работы?'
		},
		// Истощение (3 вопроса)
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
			text: 'После рабочего дня мне трудно восстановить свои силы',
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
			text: 'На работе я чувствую физическую усталость',
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
		// Внутреннее дистанцирование (3 вопроса)
		{
			id: 'q4',
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
			id: 'q5',
			text: 'Я чувствую сильное отвращение к моей работе',
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
			text: 'Я сомневаюсь, что моя работа имеет для кого-то значение',
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
		// Когнитивные затруднения (3 вопроса)
		{
			id: 'q7',
			text: 'На работе мне сложно оставаться собранным(ой)',
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
			id: 'q9',
			text: 'Я делаю ошибки в процессе работы, потому что думаю о других вещах',
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
		// Эмоциональные затруднения (3 вопроса)
		{
			id: 'q10',
			text: 'На работе я чувствую, что не способен(а) контролировать свои эмоции',
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
			text: 'Я не узнаю себя в том, как я эмоционально реагирую на работе',
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
		maxScore: 60,
		maxAverageScore: 5.0,
		interpretation: [
			{
				min: 1.0,
				max: 2.53,
				severity: 'Нет риска выгорания',
				recommendation:
					'Ваши результаты находятся в зелёной зоне, что означает отсутствие риска выгорания. Вы справляетесь с рабочими требованиями, у вас достаточно энергии и вовлечённости в работу. Это хороший результат, который говорит о здоровом балансе между рабочей нагрузкой и вашими ресурсами.\n\nРекомендации:\n— Регулярно заполняйте опросник для мониторинга состояния',
				color: 'green'
			},
			{
				min: 2.54,
				max: 2.95,
				severity: 'Риск выгорания',
				recommendation:
					'Ваши результаты попадают в оранжевую зону, что указывает на риск развития выгорания. Это означает, что вы начинаете испытывать симптомы, которые требуют внимания. Сейчас критически важно предпринять меры для предотвращения дальнейшего ухудшения состояния.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](https://t.me/m/UJBYiSocNzE6)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния',
				color: 'orange'
			},
			{
				min: 2.96,
				max: 5.0,
				severity: 'Выгорание присутствует',
				recommendation:
					'Ваши результаты находятся в красной зоне, что указывает на присутствие выгорания. Это серьёзное состояние, которое требует немедленного внимания и активного вмешательства. Вы испытываете значительное истощение и другие симптомы, которые существенно влияют на ваше функционирование и благополучие.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](https://t.me/m/UJBYiSocNzE6)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния',
				color: 'red'
			}
		]
	}
};
