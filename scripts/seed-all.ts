/**
 * Seed script to populate database with surveys and page content.
 * Run with: npx dotenv -e .env -- npx tsx scripts/seed-all.ts
 */

import { db } from '../src';
import * as schema from '../src/db/schema';

async function seedSurveyCategories() {
	console.log('Seeding survey categories...');

	const now = new Date().toISOString();

	const categories = [
		{
			id: crypto.randomUUID(),
			name: 'Депрессия и тревога',
			slug: 'depression-anxiety',
			description: 'Опросники для оценки депрессивных и тревожных состояний',
			sortOrder: 1,
			createdAt: now,
			updatedAt: now
		},
		{
			id: crypto.randomUUID(),
			name: 'Перфекционизм',
			slug: 'perfectionism',
			description: 'Опросники для оценки перфекционизма',
			sortOrder: 2,
			createdAt: now,
			updatedAt: now
		},
		{
			id: crypto.randomUUID(),
			name: 'Прокрастинация',
			slug: 'procrastination',
			description: 'Опросники для оценки прокрастинации',
			sortOrder: 3,
			createdAt: now,
			updatedAt: now
		},
		{
			id: crypto.randomUUID(),
			name: 'Выгорание',
			slug: 'burnout',
			description: 'Опросники для оценки профессионального выгорания',
			sortOrder: 4,
			createdAt: now,
			updatedAt: now
		}
	];

	for (const cat of categories) {
		await db.insert(schema.surveyCategory).values(cat).onConflictDoNothing();
	}
}

async function seedSurveys() {
	console.log('Seeding surveys...');

	const categories = await db.select().from(schema.surveyCategory);
	const catMap = new Map(categories.map((c) => [c.slug, c.id]));

	const surveys = [
		{
			name: 'PHQ-9',
			slug: 'phq9',
			title: 'PHQ-9',
			description:
				'Опросник здоровья пациента (Patient Health Questionnaire-9) — инструмент для скрининга депрессии',
			categoryId: catMap.get('depression-anxiety'),
			sortOrder: 1,
			isActive: true,
			estimatedMinutes: 5,
			config: {
				questions: [
					{
						id: 1,
						text: 'Как часто за последние 2 недели вас беспокоило чувство подавленности, депрессии или безнадёжности?'
					},
					{
						id: 2,
						text: 'Как часто за последние 2 недели вас беспокоило отсутствие интереса или удовольствия от занятий, которые обычно нравятся?'
					},
					{
						id: 3,
						text: 'Как часто за последние 2 недели вас беспокоили проблемы со сном (трудности с засыпанием, частые пробуждения или, наоборот, чрезмерная сонливость)?'
					},
					{
						id: 4,
						text: 'Как часто за последние 2 недели вас беспокоило чувство усталости или недостаток энергии?'
					},
					{
						id: 5,
						text: 'Как часто за последние 2 недели вас беспокоило снижение аппетита или переедание?'
					},
					{
						id: 6,
						text: 'Как часто за последние 2 недели вас беспокоило плохое мнение о себе (ощущение себя неудачником или что подвели себя или свою семью)?'
					},
					{
						id: 7,
						text: 'Как часто за последние 2 недели вас беспокоили трудности с концентрацией внимания (например, при чтении газеты или просмотре телевизора)?'
					},
					{
						id: 8,
						text: 'Как часто за последние 2 недели вас беспокоило то, что вы двигаетесь или говорите настолько медленно, что окружающие замечают это? Или наоборот — настолько беспокойны и суетливы, что двигаетесь больше обычного?'
					},
					{
						id: 9,
						text: 'Как часто за последние 2 недели вас беспокоили мысли о том, что лучше бы вам умереть, или мысли о том, чтобы причинить себе какой-либо вред?'
					}
				],
				options: [
					{ value: 0, label: 'Никогда' },
					{ value: 1, label: 'Несколько дней' },
					{ value: 2, label: 'Более половины дней' },
					{ value: 3, label: 'Почти каждый день' }
				],
				scoring: {
					type: 'sum',
					ranges: [
						{ min: 0, max: 4, label: 'Минимальная депрессия' },
						{ min: 5, max: 9, label: 'Лёгкая депрессия' },
						{ min: 10, max: 14, label: 'Умеренная депрессия' },
						{ min: 15, max: 19, label: 'Умеренно-тяжёлая депрессия' },
						{ min: 20, max: 27, label: 'Тяжёлая депрессия' }
					]
				}
			}
		},
		{
			name: 'GAD-7',
			slug: 'gad7',
			title: 'GAD-7',
			description:
				'Шкала генерализованного тревожного расстройства (Generalized Anxiety Disorder-7)',
			categoryId: catMap.get('depression-anxiety'),
			sortOrder: 2,
			isActive: true,
			estimatedMinutes: 3,
			config: {
				questions: [
					{
						id: 1,
						text: 'Как часто за последние 2 недели вас беспокоило чувство нервозности, тревоги или напряжения?'
					},
					{
						id: 2,
						text: 'Как часто за последние 2 недели вас беспокоила неспособность прекратить беспокоиться или контролировать беспокойство?'
					},
					{
						id: 3,
						text: 'Как часто за последние 2 недели вас беспокоило чрезмерное беспокойство по разным поводам?'
					},
					{
						id: 4,
						text: 'Как часто за последние 2 недели вас беспокоила трудность расслабиться?'
					},
					{
						id: 5,
						text: 'Как часто за последние 2 недели вас беспокоило настолько сильное беспокойство, что трудно усидеть на месте?'
					},
					{
						id: 6,
						text: 'Как часто за последние 2 недели вас беспокоило то, что вы легко раздражаетесь или злитесь?'
					},
					{
						id: 7,
						text: 'Как часто за последние 2 недели вас беспокоило чувство страха, как будто может произойти что-то ужасное?'
					}
				],
				options: [
					{ value: 0, label: 'Никогда' },
					{ value: 1, label: 'Несколько дней' },
					{ value: 2, label: 'Более половины дней' },
					{ value: 3, label: 'Почти каждый день' }
				],
				scoring: {
					type: 'sum',
					ranges: [
						{ min: 0, max: 4, label: 'Минимальная тревога' },
						{ min: 5, max: 9, label: 'Лёгкая тревога' },
						{ min: 10, max: 14, label: 'Умеренная тревога' },
						{ min: 15, max: 21, label: 'Тяжёлая тревога' }
					]
				}
			}
		},
		{
			name: 'CPQ',
			slug: 'cpq',
			title: 'Опросник клинического перфекционизма',
			description: 'Clinical Perfectionism Questionnaire — оценка клинического перфекционизма',
			categoryId: catMap.get('perfectionism'),
			sortOrder: 1,
			isActive: true,
			estimatedMinutes: 5,
			config: {
				questions: [
					{
						id: 1,
						text: 'За последний месяц насколько часто вы сосредотачивались на том, что вы должны сделать или чего достичь (вместо того чтобы сосредоточиться на том, что вы уже сделали или достигли)?'
					},
					{
						id: 2,
						text: 'За последний месяц насколько часто другие люди говорили вам, что ваши стандарты слишком высоки?'
					},
					{
						id: 3,
						text: 'За последний месяц насколько часто вы чувствовали, что ваше собственное поведение не отвечает вашим высоким стандартам?'
					},
					{
						id: 4,
						text: 'За последний месяц насколько часто вы добивались целей, которые другие считали невозможными?'
					},
					{
						id: 5,
						text: 'За последний месяц насколько часто вы заставляли себя переделывать задачи, чтобы убедиться, что они выполнены правильно?'
					},
					{
						id: 6,
						text: 'За последний месяц насколько часто вы судили о себе по своей способности достигать высоких стандартов?'
					},
					{
						id: 7,
						text: 'За последний месяц насколько часто вам казалось, что даже ваши лучшие достижения недостаточно хороши?'
					},
					{
						id: 8,
						text: 'За последний месяц насколько часто вы обращали внимание на то, что вы сделали неправильно, а не на то, что сделали хорошо?'
					},
					{
						id: 9,
						text: 'За последний месяц насколько часто вы обращали внимание на недостатки в своей работе (даже в тех случаях, когда другие говорили, что это хорошо)?'
					},
					{
						id: 10,
						text: 'За последний месяц насколько часто недостижение цели заставляло вас ставить ещё более высокую цель?'
					},
					{
						id: 11,
						text: 'За последний месяц насколько часто достижение цели заставляло вас ставить ещё более высокую цель?'
					},
					{
						id: 12,
						text: 'За последний месяц насколько часто вы откладывали дела из-за своего перфекционизма?'
					}
				],
				options: [
					{ value: 1, label: 'Совсем нет' },
					{ value: 2, label: 'Изредка' },
					{ value: 3, label: 'Иногда' },
					{ value: 4, label: 'Часто' }
				],
				scoring: {
					type: 'sum',
					ranges: [
						{ min: 12, max: 24, label: 'Низкий уровень перфекционизма' },
						{ min: 25, max: 36, label: 'Умеренный уровень перфекционизма' },
						{ min: 37, max: 48, label: 'Высокий уровень перфекционизма' }
					]
				}
			}
		},
		{
			name: 'IPS',
			slug: 'ips',
			title: 'Шкала прокрастинации Айзенка',
			description: 'Irrational Procrastination Scale — оценка иррациональной прокрастинации',
			categoryId: catMap.get('procrastination'),
			sortOrder: 1,
			isActive: true,
			estimatedMinutes: 3,
			config: {
				questions: [
					{
						id: 1,
						text: 'Я откладываю дела настолько, что это вредит моей эффективности или производительности'
					},
					{
						id: 2,
						text: 'Моя жизнь была бы лучше, если бы я делал некоторые вещи раньше'
					},
					{
						id: 3,
						text: 'Когда мне нужно что-то сделать, я обычно откладываю это на последний момент'
					},
					{
						id: 4,
						text: 'Я откладываю так много дел, что моё здоровье и счастье страдают без необходимости'
					},
					{
						id: 5,
						text: 'Я склонен тратить деньги, которых у меня нет'
					},
					{
						id: 6,
						text: 'Я говорю себе «я сделаю это завтра»'
					},
					{
						id: 7,
						text: 'Я откладываю личное развитие, зная, что не должен этого делать'
					},
					{
						id: 8,
						text: 'Мне не удаётся делать то, что я люблю, из-за моей прокрастинации'
					},
					{
						id: 9,
						text: 'Я трачу деньги, которые мне на самом деле не нужно тратить'
					}
				],
				options: [
					{ value: 1, label: 'Очень редко или не соответствует мне' },
					{ value: 2, label: 'Редко' },
					{ value: 3, label: 'Иногда' },
					{ value: 4, label: 'Часто' },
					{ value: 5, label: 'Очень часто или полностью соответствует мне' }
				],
				scoring: {
					type: 'sum',
					ranges: [
						{ min: 9, max: 18, label: 'Низкая прокрастинация' },
						{ min: 19, max: 27, label: 'Умеренная прокрастинация' },
						{ min: 28, max: 36, label: 'Высокая прокрастинация' },
						{ min: 37, max: 45, label: 'Очень высокая прокрастинация' }
					]
				}
			}
		},
		{
			name: 'PSI',
			slug: 'psi',
			title: 'Опросник прокрастинации (студенческая версия)',
			description: 'Procrastination Scale for Students — оценка академической прокрастинации',
			categoryId: catMap.get('procrastination'),
			sortOrder: 2,
			isActive: true,
			estimatedMinutes: 10,
			config: {
				questions: [
					{ id: 1, text: 'Я часто берусь за выполнение задач, которые планировал сделать несколько дней назад' },
					{ id: 2, text: 'Я не выполняю задания до тех пор, пока их не нужно сдавать' },
					{ id: 3, text: 'Когда я заканчиваю читать книгу из библиотеки, я сразу же возвращаю её, вне зависимости от даты возврата' },
					{ id: 4, text: 'Когда пора вставать утром, я чаще всего сразу вылезаю из кровати' },
					{ id: 5, text: 'Написанное письмо может лежать несколько дней, прежде чем я его отправлю' },
					{ id: 6, text: 'Я обычно перезваниваю быстро' },
					{ id: 7, text: 'Даже важные дела с дедлайном я откладываю' },
					{ id: 8, text: 'Я обычно принимаю решения как можно скорее' },
					{ id: 9, text: 'Я обычно откладываю начало работы, которую должен сделать' },
					{ id: 10, text: 'Мне обычно приходится спешить, чтобы выполнить задание вовремя' },
					{ id: 11, text: 'Когда готовлюсь к выходу, я редко спохватываюсь о чём-то в последнюю минуту' },
					{ id: 12, text: 'Выходя на встречу, я редко опаздываю' },
					{ id: 13, text: 'Я предпочитаю закончить задание заранее, до того как оно станет срочным' },
					{ id: 14, text: 'Я часто завершаю задание раньше, чем это необходимо' },
					{ id: 15, text: 'Я всегда успеваю выполнить задания в срок' },
					{ id: 16, text: 'Я постоянно говорю: «Я сделаю это завтра»' },
					{ id: 17, text: 'Я обычно заботлюсь обо всех задачах, которые мне необходимо выполнить, прежде чем сяду отдыхать и расслабиться вечером' },
					{ id: 18, text: 'Приступая к заданию, я обычно отвлекаюсь на другие вещи' },
					{ id: 19, text: 'Я трачу больше времени на планирование задачи, чем на её реальное выполнение' },
					{ id: 20, text: 'Я часто опаздываю на встречи и мероприятия' }
				],
				options: [
					{ value: 1, label: 'Абсолютно не соответствует' },
					{ value: 2, label: 'Скорее не соответствует' },
					{ value: 3, label: 'Нейтрально' },
					{ value: 4, label: 'Скорее соответствует' },
					{ value: 5, label: 'Полностью соответствует' }
				],
				scoring: {
					type: 'sum',
					reverseItems: [3, 4, 6, 8, 11, 12, 13, 14, 15, 17],
					ranges: [
						{ min: 20, max: 40, label: 'Низкая прокрастинация' },
						{ min: 41, max: 60, label: 'Умеренная прокрастинация' },
						{ min: 61, max: 80, label: 'Высокая прокрастинация' },
						{ min: 81, max: 100, label: 'Очень высокая прокрастинация' }
					]
				}
			}
		},
		{
			name: 'BAT-4',
			slug: 'bat4',
			title: 'Краткая версия опросника выгорания (BAT-4)',
			description: 'Burnout Assessment Tool — краткая версия для скрининга выгорания',
			categoryId: catMap.get('burnout'),
			sortOrder: 1,
			isActive: true,
			estimatedMinutes: 2,
			config: {
				questions: [
					{ id: 1, text: 'На работе я чувствую себя психически истощённым(ой)' },
					{ id: 2, text: 'На работе мне трудно сохранять концентрацию' },
					{ id: 3, text: 'Я равнодушен(на) к своей работе' },
					{ id: 4, text: 'На работе я борюсь с тем, чтобы контролировать свои эмоции' }
				],
				options: [
					{ value: 1, label: 'Никогда' },
					{ value: 2, label: 'Редко' },
					{ value: 3, label: 'Иногда' },
					{ value: 4, label: 'Часто' },
					{ value: 5, label: 'Всегда' }
				],
				scoring: {
					type: 'average',
					ranges: [
						{ min: 1, max: 1.84, label: 'Очень низкий риск выгорания' },
						{ min: 1.85, max: 2.49, label: 'Низкий риск выгорания' },
						{ min: 2.5, max: 3.49, label: 'Средний риск выгорания' },
						{ min: 3.5, max: 4.14, label: 'Высокий риск выгорания' },
						{ min: 4.15, max: 5, label: 'Очень высокий риск выгорания' }
					]
				}
			}
		},
		{
			name: 'BAT-12',
			slug: 'bat12',
			title: 'Опросник выгорания (BAT-12)',
			description: 'Burnout Assessment Tool — средняя версия для оценки выгорания',
			categoryId: catMap.get('burnout'),
			sortOrder: 2,
			isActive: true,
			estimatedMinutes: 5,
			config: {
				questions: [
					{ id: 1, text: 'На работе я чувствую себя психически истощённым(ой)' },
					{ id: 2, text: 'После рабочего дня мне трудно восстановить силы' },
					{ id: 3, text: 'На работе я чувствую себя физически истощённым(ой)' },
					{ id: 4, text: 'На работе мне трудно думать быстро' },
					{ id: 5, text: 'На работе мне трудно сохранять концентрацию' },
					{ id: 6, text: 'Я делаю ошибки в работе, потому что думаю о других вещах' },
					{ id: 7, text: 'Мне трудно испытывать энтузиазм по отношению к работе' },
					{ id: 8, text: 'Я равнодушен(на) к своей работе' },
					{ id: 9, text: 'Я циничен(на) по отношению к своей работе' },
					{ id: 10, text: 'На работе я раздражаюсь, когда дела идут не так, как я хочу' },
					{ id: 11, text: 'На работе я борюсь с тем, чтобы контролировать свои эмоции' },
					{ id: 12, text: 'На работе я остро реагирую в определённых ситуациях' }
				],
				options: [
					{ value: 1, label: 'Никогда' },
					{ value: 2, label: 'Редко' },
					{ value: 3, label: 'Иногда' },
					{ value: 4, label: 'Часто' },
					{ value: 5, label: 'Всегда' }
				],
				scoring: {
					type: 'average',
					ranges: [
						{ min: 1, max: 1.84, label: 'Очень низкий риск выгорания' },
						{ min: 1.85, max: 2.49, label: 'Низкий риск выгорания' },
						{ min: 2.5, max: 3.49, label: 'Средний риск выгорания' },
						{ min: 3.5, max: 4.14, label: 'Высокий риск выгорания' },
						{ min: 4.15, max: 5, label: 'Очень высокий риск выгорания' }
					]
				}
			}
		}
	];

	for (const survey of surveys) {
		await db
			.insert(schema.survey)
			.values({
				id: crypto.randomUUID(),
				...survey,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})
			.onConflictDoNothing();
	}
}

async function seedPageContent() {
	console.log('Seeding page content...');

	const now = new Date().toISOString();

	const pages = [
		{
			pageSlug: 'sos',
			sectionKey: 'blocks',
			content: [
				{
					id: 'sos-hero-001',
					type: 'page-hero',
					sortOrder: 0,
					isActive: true,
					config: {
						title: 'Экстренная помощь',
						subtitle:
							'Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или попали в угрожающую жизни ситуацию — срочно обратитесь за помощью за помощью в эти организации.',
						maxWidth: 'lg',
						titleLineHeight: 'relaxed'
					}
				},
				{
					id: 'sos-contacts-001',
					type: 'card-grid',
					sortOrder: 10,
					isActive: true,
					config: {
						cols: '3',
						gap: 'md',
						cards: [
							{
								type: 'contact-card',
								title: 'Единый круглосуточный телефон доверия для взрослых и детей',
								phone: '+7 (800) 100-49-94',
								link: 'tel:+78001004994'
							},
							{
								type: 'contact-card',
								title: 'Бесплатная кризисная линия доверия по России, круглосуточно',
								phone: '+7 (800) 333-44-34',
								link: 'tel:+78003334434'
							},
							{
								type: 'contact-card',
								title:
									'Всероссийская служба детского телефона доверия, круглосуточно, анонимно',
								phone: '+7 (800) 200-01-22',
								link: 'tel:+78002000122'
							},
							{
								type: 'contact-card',
								title: 'Российский Красный Крест, горячая линия',
								phone: '+7 (800) 250-18-59',
								link: 'tel:+78002501859'
							},
							{
								type: 'contact-card',
								title:
									'Всероссийский бесплатный телефон доверия для женщин, подвергшихся домашнему насилию, по будням 7:00–21:00',
								phone: '+7 (800) 700-06-00',
								link: 'tel:+78007000600'
							},
							{
								type: 'contact-card',
								title:
									'Горячая линия социально-психологической помощи детям и семьям мигрантов, находящимся в трудной жизненной ситуации',
								phone: '+7 (499) 201-59-47',
								link: 'tel:+74992015947'
							}
						]
					}
				}
			]
		},
		{
			pageSlug: 'online-therapy',
			sectionKey: 'blocks',
			content: [
				{
					id: 'online-therapy-hero-001',
					type: 'page-hero',
					sortOrder: 0,
					isActive: true,
					config: {
						title: 'Как мы будем работать',
						subtitle:
							'Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями, чувствами и поведением для достижения желаемых изменений.',
						subtitleSecondary:
							'Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.',
						maxWidth: 'sm',
						titleLineHeight: 'tight'
					}
				},
				{
					id: 'online-therapy-blocks-001',
					type: 'text-block-section',
					sortOrder: 10,
					isActive: true,
					config: {
						blocks: [
							{
								title: 'С чего начать',
								data: [
									'Прочитайте эту памятку, затем напишите мне. Отвечу на вопросы, если они есть, выберем время, проведём первую встречу.'
								]
							},
							{
								title: 'Где проходит сессия',
								data: [
									'Онлайн через Яндекс Телемост. Пришлю ссылку перед встречей. Работает в браузере, не обязательно устанавливать приложение.'
								]
							},
							{
								title: 'Что происходит на сессии',
								data: [
									'На первой встрече мы познакомимся, я расскажу подробнее о формате работы, и мы обсудим вашу ситуацию.',
									'Волнение перед первой встречей — это нормально.',
									'Терапия — совместная работа.'
								]
							},
							{
								title: 'Продолжительность сессии',
								data: ['50 минут, включая обратную связь.']
							},
							{
								title: 'Частота встреч',
								data: ['Обычно мы встречаемся раз в неделю.']
							},
							{
								title: 'Оплата и стоимость',
								data: [
									'5000₽ за сессию.',
									'**100% предоплата не позднее чем за 24 часа до сессии**'
								]
							},
							{
								title: 'Конфиденциальность',
								data: [
									'Храню в тайне информацию, которую вы рассказываете. Исключение — угроза жизни.'
								]
							}
						]
					}
				}
			]
		},
		{
			pageSlug: 'for-doctors',
			sectionKey: 'blocks',
			content: [
				{
					id: 'for-doctors-hero-001',
					type: 'page-hero',
					sortOrder: 0,
					isActive: true,
					config: {
						title: 'Эффективное взаимодействие психолога с врачом',
						subtitle:
							'Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения',
						maxWidth: 'lg',
						titleLineHeight: 'relaxed',
						subtitleRowStart: '9'
					}
				},
				{
					id: 'for-doctors-about-001',
					type: 'image-text',
					sortOrder: 10,
					isActive: true,
					config: {
						image: {
							src: '/1.webp',
							srcSmall: '/1_small.webp',
							alt: 'Андрей',
							imgClass: 'h-[320px] w-[285px] lg:h-[720px] lg:w-[505px]'
						},
						layout: 'image-left',
						paragraphs: [
							'Меня зовут Андрей Калмыков, я психолог, работаю в подходах КПТ и ACT.',
							'Веду индивидуальную терапию для взрослых, преимущественно с депрессивной и тревожной симптоматикой.',
							'Эффективная помощь людям с психическими расстройствами — это всегда командная работа врача и психолога.'
						]
					}
				},
				{
					id: 'for-doctors-benefits-001',
					type: 'card-grid',
					sortOrder: 20,
					isActive: true,
					config: {
						cols: '24',
						gap: 'md',
						cards: [
							{
								type: 'icon-card',
								highlight: 'снижение преждевременного прекращения терапии',
								text: 'Совместная работа помогает клиенту чувствовать себя увереннее.',
								gridClass: 'col-span-1 md:col-span-24',
								showIcon: false
							},
							{
								type: 'icon-card',
								highlight: 'рост удовлетворённости лечением',
								text: 'Психолог вовлекает клиента в процесс.',
								gridClass: 'col-span-1 md:col-span-10',
								showIcon: false
							},
							{
								type: 'icon-card',
								highlight: 'улучшение коммуникации',
								text: 'Психолог организует обмен информацией.',
								gridClass: 'col-span-1 md:col-span-14',
								showIcon: false
							}
						]
					}
				}
			]
		},
		{
			pageSlug: 'home',
			sectionKey: 'blocks',
			content: [
				{
					id: 'home-hero-001',
					type: 'home-hero',
					sortOrder: 0,
					isActive: true,
					config: {}
				},
				{
					id: 'home-issues-001',
					type: 'issues-list',
					sortOrder: 10,
					isActive: true,
					config: {
						subtitle: 'c чем ко мне обращаются',
						items: [
							{
								theme: 'эмоциональные трудности',
								points: [
									'Тревога, дискомфорт и отсутствие сил',
									'Депрессивные состояния',
									'Проживание стрессовых ситуаций'
								]
							},
							{
								theme: 'работа и самореализация',
								points: ['Выгорание', 'Прокрастинация', 'Синдром самозванца']
							}
						]
					}
				},
				{
					id: 'home-consultation-001',
					type: 'consultation-info',
					sortOrder: 30,
					isActive: true,
					config: {
						price: '5000 рублей за сессию',
						format: 'Встречи проходят онлайн',
						duration: 'Одна сессия — 50 минут'
					}
				},
				{
					id: 'home-education-001',
					type: 'education',
					sortOrder: 40,
					isActive: true,
					config: {
						isOpen: false
					}
				},
				{
					id: 'home-faq-001',
					type: 'faq',
					sortOrder: 50,
					isActive: true,
					config: {}
				}
			]
		}
	];

	for (const page of pages) {
		await db
			.insert(schema.pageContent)
			.values({
				id: crypto.randomUUID(),
				pageSlug: page.pageSlug,
				sectionKey: page.sectionKey,
				content: page.content,
				sortOrder: 0,
				isActive: true,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing();
	}
}

async function main() {
	console.log('Starting database seed...');

	await seedSurveyCategories();
	await seedSurveys();
	await seedPageContent();

	console.log('Seed completed successfully!');
	process.exit(0);
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
