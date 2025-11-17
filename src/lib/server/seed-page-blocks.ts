/**
 * Seed script to migrate existing pages to block-based structure.
 * Run with: npx tsx src/lib/server/seed-page-blocks.ts
 */

import { pageContentService } from './page-content.server';
import type { PageBlock } from '$lib/types/page-blocks';

// Convert existing defaultPageContents to block structure
export async function seedPageBlocks() {
	console.log('Seeding page blocks...');

	// SOS Page
	await seedSosPage();

	// Online Therapy Page
	await seedOnlineTherapyPage();

	// For-Doctors Page
	await seedForDoctorsPage();

	// Home Page (complex, keep as-is for now, just add block structure marker)
	await seedHomePage();

	console.log('Done seeding page blocks!');
}

async function seedSosPage() {
	console.log('  - Seeding SOS page...');

	const blocks: PageBlock[] = [
		{
			id: crypto.randomUUID(),
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
			id: crypto.randomUUID(),
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
						title: 'Всероссийская служба детского телефона доверия, круглосуточно, анонимно',
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
	];

	await pageContentService.upsert({
		pageSlug: 'sos',
		sectionKey: 'blocks',
		content: blocks,
		sortOrder: 0,
		isActive: true
	});
}

async function seedOnlineTherapyPage() {
	console.log('  - Seeding Online Therapy page...');

	const textBlocks = [
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
			data: ['5000₽ за сессию.', '**100% предоплата не позднее чем за 24 часа до сессии**']
		},
		{
			title: 'Конфиденциальность',
			data: ['Храню в тайне информацию, которую вы рассказываете. Исключение — угроза жизни.']
		}
	];

	const blocks: PageBlock[] = [
		{
			id: crypto.randomUUID(),
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
			id: crypto.randomUUID(),
			type: 'text-block-section',
			sortOrder: 10,
			isActive: true,
			config: {
				blocks: textBlocks
			}
		}
	];

	await pageContentService.upsert({
		pageSlug: 'online-therapy',
		sectionKey: 'blocks',
		content: blocks,
		sortOrder: 0,
		isActive: true
	});
}

async function seedForDoctorsPage() {
	console.log('  - Seeding For-Doctors page...');

	const blocks: PageBlock[] = [
		{
			id: crypto.randomUUID(),
			type: 'page-hero',
			sortOrder: 0,
			isActive: true,
			config: {
				title: 'Эффективное взаимодействие психолога с врачом',
				subtitle: 'Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения',
				maxWidth: 'lg',
				titleLineHeight: 'relaxed',
				subtitleRowStart: '9'
			}
		},
		{
			id: crypto.randomUUID(),
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
			id: crypto.randomUUID(),
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
	];

	await pageContentService.upsert({
		pageSlug: 'for-doctors',
		sectionKey: 'blocks',
		content: blocks,
		sortOrder: 0,
		isActive: true
	});
}

async function seedHomePage() {
	console.log('  - Seeding Home page...');

	const blocks: PageBlock[] = [
		{
			id: crypto.randomUUID(),
			type: 'home-hero',
			sortOrder: 0,
			isActive: true,
			config: {}
		},
		{
			id: crypto.randomUUID(),
			type: 'about-intro-dual',
			sortOrder: 5,
			isActive: true,
			config: {
				leftImage: {
					src: '/1.webp',
					srcSmall: '/1_small.webp',
					alt: 'Андрей',
					width: 505,
					height: 720,
					imgClass: 'h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]'
				},
				leftTexts: [
					'Я Андрей — практикующий психолог.',
					'Имея за плечами годы работы в IT-сфере, я хорошо понимаю проблемы тех, кто балансирует между профессиональным ростом и личным благополучием.',
					'Моя работа — создать пространство, где вы сможете разглядеть привычные способы мышления, которые превращают профессиональную самоотдачу в истощение, а желание соответствовать — в тревогу.',
					'Через анализ связей между вашими мыслями, чувствами и поведением я помогаю увидеть, что ваше беспокойство — не просто помеха эффективности, а сигнал о том, что что-то в вашей жизни требует пересмотра.'
				],
				rightTexts: [
					'Я не даю универсальных алгоритмов счастья — что толку в советах, если ваше мышление продолжает работать по прежним шаблонам?',
					'Вместо этого я настраиваю инструменты помощи под особенности именно вашего восприятия и мышления, исследуя, как различные ситуации запускают цепочки реакций и какие функции выполняет ваше поведение.',
					'Моя задача — не просто снять симптом, а помочь вам научиться замечать те процессы, которые этот симптом создают и поддерживают.',
					'Психотерапия, которую я практикую, — это не избавление от трудностей, а искусство использовать их как указатели на то, что действительно важно для вас.'
				],
				rightImage: {
					src: '/2.webp',
					srcSmall: '/2_small.webp',
					alt: 'Психолог',
					width: 544,
					height: 720,
					imgClass: 'h-[320px] lg:h-[720px] w-[285px] lg:w-[544px]'
				},
				withReveal: false
			}
		},
		{
			id: crypto.randomUUID(),
			type: 'issues-list',
			sortOrder: 10,
			isActive: true,
			config: {
				subtitle: 'c чем ко мне обращаются',
				items: [
					{
						theme: 'эмоциональные трудности',
						icon: 'heart-pulse',
						points: [
							'Тревога, дискомфорт и отсутствие сил',
							'Депрессивные состояния и клиническая депрессия',
							'Проживание эмоционально сложных и стрессовых ситуаций'
						],
						gridClass: 'col-span-1'
					},
					{
						theme: 'работа и самореализация',
						icon: 'bar-chart-big',
						points: [
							'Эмоциональное и профессиональное выгорание',
							'Выстраивание планов на жизнь и карьеру',
							'Прокрастинация и проблемы с мотивацией',
							'Синдром самозванца'
						],
						gridClass: 'col-span-1'
					},
					{
						theme: 'отношения с собой',
						icon: 'shield',
						points: [
							'Низкая самооценка и неуверенность в себе',
							'Помощь в понимании своих эмоций и желаний',
							'Проблемы с личными границами'
						],
						gridClass: 'col-span-1'
					},
					{
						theme: 'отношения с другими',
						icon: 'users',
						points: [
							'Одиночество и трудности в общении',
							'Выстраивание отношений с партнёром и семьёй',
							'Социальная тревога'
						],
						gridClass: 'col-span-1'
					}
				],
				withReveal: false
			}
		},
		{
			id: crypto.randomUUID(),
			type: 'about-section',
			sortOrder: 20,
			isActive: true,
			config: {
				items: [
					{
						icon: 'briefcase',
						highlight: 'опыт в IT',
						text: 'Знаю специфику цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.',
						gridClass: 'col-span-1 md:col-span-14'
					},
					{
						icon: 'flask',
						highlight: 'научный подход',
						text: 'Применяю методы с доказанной эффективностью (ACT и КПТ), которые фокусируются на реальных действиях, а не только на симптомах.',
						gridClass: 'col-span-1 md:col-span-10'
					},
					{
						icon: 'lightbulb',
						highlight: 'практика',
						text: 'Постоянно учусь у коллег на практических курсах, чтобы применять живые, современные подходы, а не застревать в теории.',
						gridClass: 'col-span-1 md:col-span-10'
					},
					{
						icon: 'trending-up',
						highlight: 'измеримый результат',
						text: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было вовремя корректировать курс.',
						gridClass: 'col-span-1 md:col-span-14'
					}
				],
				withReveal: false
			}
		},
		{
			id: crypto.randomUUID(),
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
			id: crypto.randomUUID(),
			type: 'education',
			sortOrder: 40,
			isActive: true,
			config: {
				isOpen: false,
				withReveal: false
			}
		},
		{
			id: crypto.randomUUID(),
			type: 'faq',
			sortOrder: 50,
			isActive: true,
			config: {}
		}
	];

	await pageContentService.upsert({
		pageSlug: 'home',
		sectionKey: 'blocks',
		content: blocks,
		sortOrder: 0,
		isActive: true
	});
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
	seedPageBlocks()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
