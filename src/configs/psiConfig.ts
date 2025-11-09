import type { SurveyConfig } from '$lib/data/surveys/types';

export const psiConfig: SurveyConfig = {
	id: 'psi',
	title: 'ПШ (PSI)',
	description: 'Шкала прокрастинации П. Стила',

	infoSections: {
		beforeUse: {
			title: 'О шкале прокрастинации',
			type: 'info',
			content:
				'Шкала прокрастинации (ПШ/PSI) — это инструмент для оценки склонности откладывать дела на потом.\n\nОпросник помогает понять, насколько часто вы откладываете важные задачи и как это влияет на вашу продуктивность.\n\n',
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
			id: 'q6',
			text: 'Некоторые дела в моей жизни я откладываю слишком часто',
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
			text: 'Моя жизнь была бы лучше, если бы я сделал все, что в свое время отложил на неопределенный срок',
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
			id: 'q9',
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
			id: 'q10',
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
			id: 'q11',
			text: 'Я стараюсь делать все в те сроки, в которые необходимо успеть',
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
			id: 'q12',
			text: 'Иногда я ловлю себя на том, что делаю второстепенные дела, хотя у меня есть важные задачи',
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
			id: 'q13',
			text: 'Иногда при выполнении задачи я концентрируюсь на деталях и затягиваю с выполнением главного',
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
			id: 'q14',
			text: 'Иногда я сдаю работу с большим опозданием',
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
			id: 'q15',
			text: 'Иногда я ловлю себя на том, что занимаюсь посторонними делами в рабочее время',
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
			id: 'q16',
			text: 'Часто я откладываю дело до тех пор, пока оно не начнет «давить» на меня',
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
			id: 'q17',
			text: 'Иногда я понимаю, что выполнил бы задачу лучше, если бы приступил к ней раньше',
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
			id: 'q18',
			text: 'Иногда я слишком долго откладываю какую-либо задачу',
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
			id: 'q19',
			text: 'Иногда я затягиваю сроки сдачи работы',
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
			id: 'q20',
			text: 'Я часто жалею, что начал выполнять конкретную задачу слишком поздно',
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
			id: 'q21',
			text: 'Я делаю свою работу именно тогда, когда планировал ее сделать',
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
			id: 'q22',
			text: 'Когда у меня есть ответственная работа, я приступаю к ней как можно раньше',
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
			id: 'q23',
			text: 'Чаще всего я организую свою работу так, чтобы в каждый конкретный момент заниматься тем, что актуально и важно',
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
			id: 'q24',
			text: 'Я довольно легко отвлекаюсь, когда занимаюсь учебой',
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
			id: 'q25',
			text: 'Иногда я ловлю себя на том, что выполняю задания, которые намеревался сделать несколько дней назад',
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
			id: 'q26',
			text: 'Иногда, когда я готовлюсь к занятиям, я отвлекаюсь на общение, игры или телевизор',
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
			id: 'q27',
			text: 'Обычно я не сразу приступаю к заданию, которое получил',
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
			id: 'q28',
			text: 'Я часто сдаю задания на несколько дней раньше, чем должен',
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
			id: 'q29',
			text: 'Когда я занят учебой, меня мало что способно отвлечь',
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
		}
	],

	scoring: {
		method: 'sum',
		maxScore: 145,
		interpretation: [
			{
				min: 29,
				max: 73,
				severity: 'Низкий уровень прокрастинации',
				recommendation:
					'Вы способны выполнять запланированные задачи в первую очередь, а затем заниматься другими делами.\n\nВы демонстрируете хороший контроль над отсроченными вознаграждениями и адекватное временное планирование.\n\nСпециальная помощь не требуется. Продолжайте в том же духе!',
				color: 'green'
			},
			{
				min: 74,
				max: 117,
				severity: 'Средний уровень прокрастинации',
				recommendation:
					'Вы способны адекватно распределять задачи и оценивать усилия, необходимые для их выполнения.\n\nВы демонстрируете гибкость при распределении времени. В исключительных ситуациях дела могут быть отложены на потом, но без серьезных негативных последствий.\n\nЭто нормальный уровень. Старайтесь отслеживать ситуации, когда откладывание дел начинает мешать достижению целей.',
				color: 'yellow'
			},
			{
				min: 118,
				max: 145,
				severity: 'Высокий уровень прокрастинации',
				recommendation:
					'У вас выражена прокрастинация. Выполнение задач откладывается на неопределенный срок.\n\nЭто создает высокий риск снижения продуктивности и может приводить к проблемам в учебной или рабочей деятельности.\n\nРекомендуется [консультация с психологом](/online-therapy) для выявления причин прокрастинации.',
				color: 'red'
			}
		]
	}
};
