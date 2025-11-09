import type { SurveyConfig } from '$lib/data/surveys/types';

export const ipsConfig: SurveyConfig = {
	id: 'ips',
	title: 'ИПШ (IPS)',
	description: 'Шкала иррациональной прокрастинации П. Стила',

	infoSections: {
		beforeUse: {
			title: 'О шкале иррациональной прокрастинации',
			type: 'info',
			content:
				'Шкала иррациональной прокрастинации (ИПШ/IPS) — это короткая версия опросника для оценки склонности откладывать дела вопреки осознанию негативных последствий.\n\nОпросник помогает выявить чистую иррациональную прокрастинацию — когда человек добровольно откладывает дела, хотя полностью осознает вредность такого поведения.\n\n',
			expanded: true
		}
	},

	questions: [
		{
			id: 'subheading',
			type: 'subheading',
			text: 'Отметьте напротив каждого утверждения, насколько оно вас характеризует, используя 5-балльную шкалу'
		},
		{
			id: 'q1',
			text: 'Иногда я тяну с выполнением какого-либо дела, даже если это очень неразумно с моей стороны',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q2',
			text: 'Я делаю все в те сроки, в которые необходимо успеть',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 5 },
				{ label: 'Скорее нет', value: 2, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 2 },
				{ label: 'Согласен', value: 5, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q3',
			text: 'Я часто жалею, что не начал делать что-либо раньше',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q4',
			text: 'В моей жизни есть задачи и дела, которые я отложил, хотя знаю, что не должен был',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q5',
			text: 'Если передо мной стоит крупная задача, я стараюсь приступить к ней как можно быстрее, прежде чем появится множество других мелких дел',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 5 },
				{ label: 'Скорее нет', value: 2, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 2 },
				{ label: 'Согласен', value: 5, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q6',
			text: 'Иногда я встречаюсь с неприятными последствиями того, что слишком долго медлил с чем-то',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q7',
			text: 'Иногда в конце дня я понимаю, что мог бы провести время лучше',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q8',
			text: 'Я с умом трачу свое время',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 5 },
				{ label: 'Скорее нет', value: 2, points: 4 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 2 },
				{ label: 'Согласен', value: 5, points: 1 }
			],
			showPoints: false,
			countInScore: true
		},
		{
			id: 'q9',
			text: 'Иногда вместо того, чтобы делать то, что необходимо, я начинаю заниматься посторонними делами',
			type: 'radio',
			required: true,
			options: [
				{ label: 'Не согласен', value: 1, points: 1 },
				{ label: 'Скорее нет', value: 2, points: 2 },
				{ label: 'Иногда', value: 3, points: 3 },
				{ label: 'Скорее да', value: 4, points: 4 },
				{ label: 'Согласен', value: 5, points: 5 }
			],
			showPoints: false,
			countInScore: true
		}
	],

	scoring: {
		method: 'sum',
		maxScore: 45,
		interpretation: [
			{
				min: 11,
				max: 22,
				severity: 'Низкий уровень иррациональной прокрастинации',
				recommendation:
					'Вы редко откладываете дела вопреки осознанию негативных последствий.\n\nВаше поведение преимущественно рациональное и осознанное. Вы способны действовать в соответствии со своими долгосрочными интересами.\n\nСпециальная помощь не требуется.',
				color: 'green'
			},
			{
				min: 23,
				max: 37,
				severity: 'Средний уровень иррациональной прокрастинации',
				recommendation:
					'У вас периодическое иррациональное откладывание задач.\n\nВы иногда понимаете нежелательность откладывания, но все же откладываете. Это ситуационное поведение, которое проявляется в определенных условиях.\n\nРекомендации:\n— Определите триггеры, когда вы чаще всего откладываете дела\n— Используйте техники самоконтроля (напоминания, планирование)\n— Работайте над осознанностью и отслеживанием своих действий',
				color: 'yellow'
			},
			{
				min: 38,
				max: 45,
				severity: 'Высокий уровень иррациональной прокрастинации',
				recommendation:
					'У вас выражена чистая иррациональная прокрастинация.\n\nВы добровольно откладываете дела, хотя полностью осознаете негативные последствия. Это указывает на дефицит волевой регуляции, высокую импульсивность и слабую дисциплину.\n\nРекомендуется [консультация с психологом](/online-therapy) для работы над волевой регуляцией.',
				color: 'red'
			}
		]
	}
};
