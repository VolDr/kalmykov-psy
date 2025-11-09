export interface EducationItem {
	title: string;
	details: string;
	diploma?: string;
	completed: boolean;
}

export interface EducationGroup {
	category: string;
	items: EducationItem[];
}

export const educationGroups: EducationGroup[] = [
	{
		category: 'Основное образование',
		items: [
			{
				title: 'Прикладная математика и информатика',
				details: 'Тульский государственный университет, 2013 - 2019',
				completed: true
			},

			{
				title: 'Мастерство психологического консультирования',
				details: '500 часов, Психодемия, 2023 - 2024',
				diploma: '/mpk.webp',
				completed: true
			},
			{
				title: 'Психология личности',
				details: 'РАНХиГС, 2025 - н.в.',
				completed: false
			}
		]
	},
	{
		category: 'Подходы',
		items: [
			{
				title: 'Когнитивно-поведенческая терапия',
				details: '262 часа, Психодемия, 2024',
				diploma: '/kpt.webp',
				completed: true
			},
			{
				title: 'Когнитивно-поведенческая терапия: теория, стратегия, техники',
				details: '72 часа, Спб ИДПО для психологов и психотерапевтов, 2024',
				completed: true
			},

			{
				title: 'ACT для всех',
				details: 'Академия Современной Психологии, 2025 - н.в.',
				completed: false
			}
		]
	},
	{
		category: 'Специализации',
		items: [
			{
				title: 'Сексология',
				details: 'Академия Современной Психологии, 2025 - н.в.',
				completed: false
			}
		]
	},
	{
		category: 'Конференции',
		items: [
			{
				title: "Док Пси Фест'23",
				details: '7 дней, ноябрь 2023',
				diploma: '/diploma13129454.webp',
				completed: true
			},
			{
				title: 'Конференция "Гештальт-мозаика"',
				details: '96 часов, январь 2024',
				diploma: '/diploma14282846.webp',
				completed: true
			},
			{
				title: 'Док Пси Фест.Мини',
				details: '2 дня, март 2024',
				diploma: '/diploma15042285.webp',
				completed: true
			},
			{
				title: "Док Пси Фест'24",
				details: '10 дней, сентябрь 2024',
				diploma: '/diploma17382016.webp',
				completed: true
			},
			{
				title:
					'V International Science and Practice Oriented Conference "CBT Approach in Counseling and Psychotherapy: Trends and Innovations in Research and Practice"',
				details: '3 дня, ноябрь 2024',
				diploma: '/Certificate-2024_8116415.webp',
				completed: true
			},
			{
				title: "Док Пси Фест'25",
				details: '10 дней, июнь 2025',
				diploma: '/diploma20859704.webp',
				completed: true
			},
			{
				title:
					'6th International Science and Practice Oriented Conference "Evidence-Based Psychological Practice: Cognitive-Behavioural Approach and Contemporary Challenges"',
				details: '3 дня, октябрь 2025',
				diploma: '/Certificate-2025_8116415.webp',
				completed: true
			}
		]
	},
	{
		category: 'Другие курсы',
		items: [
			{
				title: 'Introduction to Psychology',
				details: '14 часов, Yale University, март 2024',
				diploma: '/Coursera-YZHHWWXP725Z.webp',
				completed: true
			},
			{
				title: 'Теория Реляционных Фреймов',
				details: '11 часов, Чистые Когниции, 2025',
				diploma: '/rft.webp',
				completed: true
			}
		]
	}
];
