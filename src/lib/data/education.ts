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
				title: 'Мастерство психологического консультирования',
				details: '500 часов, Психодемия, 2024',
				diploma: '/mpk.webp', // Существующий файл
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
				diploma: '/kpt.webp', // Существующий файл
				completed: true
			},
			{
				title: 'Когнитивно-поведенческая терапия: теория, стратегия, техники',
				details: '72 часа, Спб ИДПО для психологов и психотерапевтов, 2024',
				completed: true
			},
			{
				title: 'ACT для всех',
				details: 'Академия Современной Психологии, 2025',
				diploma: '/act.webp', // Добавь файл
				completed: true
			}
		]
	},
	{
		category: 'Специализации',
		items: [
			{
				title: 'Работа с хронической болью',
				details: 'Психосалат, 2025',
				diploma: '/pain.webp', // Добавь файл
				completed: true
			},
			{
				title: 'Клиническая психология',
				details: 'НУСТ, 2025',
				diploma: '/klinpsy.webp', // Добавь файл
				completed: true
			},
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
				diploma: '/diploma13129454.webp', // Существующий файл
				completed: true
			},
			{
				title: 'Конференция "Гештальт-мозаика"',
				details: '96 часов, январь 2024',
				diploma: '/diploma14282846.webp', // Существующий файл
				completed: true
			},
			{
				title: 'Док Пси Фест.Мини',
				details: '2 дня, март 2024',
				diploma: '/diploma15042285.webp', // Существующий файл
				completed: true
			},
			{
				title: "Док Пси Фест'24",
				details: '10 дней, сентябрь 2024',
				diploma: '/diploma17382016.webp', // Существующий файл
				completed: true
			},
			{
				title:
					'CBT Approach in Counseling and Psychotherapy: Trends and Innovations in Research and Practice',
				details: '3 дня, ноябрь 2024',
				diploma: '/Certificate-2024_8116415.webp', // Существующий файл
				completed: true
			},
			{
				title: "Док Пси Фест'25",
				details: '10 дней, июнь 2025',
				diploma: '/diploma20859704.webp', // Существующий файл
				completed: true
			},
			{
				title:
					'Evidence-Based Psychological Practice: Cognitive-Behavioural Approach and Contemporary Challenges',
				details: '3 дня, октябрь 2025',
				diploma: '/Certificate-2025_8116415.webp', // Существующий файл
				completed: true
			},
			{
				title: 'Ментализация в психотерапии и за её пределами',
				details: '3 дня, ноябрь 2025',
				diploma: '/mbt.webp', // Добавь файл
				completed: true
			},
			{
				title: 'Radically Open Conference 2025',
				details: '2 дня, декабрь 2025',
				diploma: '/ro-dbt.webp', // Добавь файл
				completed: true
			}
		]
	},
	{
		category: 'Остальное',
		items: [
			{
				title: 'Прикладная математика и информатика',
				details: 'Тульский государственный университет, 2019',
				completed: true
			},
			{
				title: 'Introduction to Psychology',
				details: '14 часов, Yale University, 2024',
				diploma: '/Coursera-YZHHWWXP725Z.webp', 
				completed: true
			},
			{
				title: 'Психология',
				details: '56 часа, БФУ им. И. Канта, 2024',
				diploma: '/psy.webp', // Добавь файл
				completed: true
			},
			{
				title: 'Психология развития и возрастная психология',
				details: '54 часа, БФУ им. И. Канта, 2024',
				diploma: '/rost.webp', // Добавь файл
				completed: true
			},
			{
				title: 'Теория Реляционных Фреймов',
				details: '11 часов, Психосалат, 2025',
				diploma: '/rft.webp', // Существующий файл
				completed: true
			}
		]
	}
];