import { db } from '../..';
import * as schema from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Type definitions for page content structures
export interface SeoContent {
	title: string;
	description: string;
	ogImage?: string;
}

export interface HeroContent {
	title: string;
	titleMobile?: string;
	subtitle?: string;
	subtitleSecondary?: string;
	backgroundImage?: string;
	gridClass?: string;
}

export interface TextBlockContent {
	text: string; // Markdown supported
	gridClass?: string;
}

export interface ImageContent {
	src: string;
	srcMobile?: string;
	alt?: string;
	width?: number;
	height?: number;
	widthMobile?: number;
	heightMobile?: number;
	gridClass?: string;
}

export interface ListItemContent {
	text: string;
	icon?: string;
	gridClass?: string;
}

export interface CardContent {
	theme?: string;
	highlight?: string;
	text?: string;
	icon?: string;
	points?: string[];
	gridClass?: string;
}

export interface SectionContent {
	title?: string;
	subtitle?: string;
	containerClass?: string;
	gridClass?: string;
	items?: CardContent[];
}

export interface ContactContent {
	title: string;
	phone?: string;
	link: string;
}

export interface EducationItemContent {
	title: string;
	details: string;
	diploma?: string;
	completed: boolean;
}

export interface EducationGroupContent {
	category: string;
	items: EducationItemContent[];
}

export interface OnlineTherapyBlockContent {
	title: string;
	data: string[];
}

interface PageContentDto {
	pageSlug: string;
	sectionKey: string;
	content: any;
	sortOrder?: number;
	isActive?: boolean;
}

class PageContentService {
	async upsert(payload: PageContentDto) {
		const now = new Date().toISOString();

		// Check if exists
		const existing = await this.get(payload.pageSlug, payload.sectionKey);

		if (existing) {
			const [updated] = await db
				.update(schema.pageContent)
				.set({
					content: payload.content,
					sortOrder: payload.sortOrder ?? existing.sortOrder,
					isActive: payload.isActive ?? existing.isActive,
					updatedAt: now
				})
				.where(eq(schema.pageContent.id, existing.id))
				.returning();
			return updated;
		} else {
			const [created] = await db
				.insert(schema.pageContent)
				.values({
					id: crypto.randomUUID(),
					pageSlug: payload.pageSlug,
					sectionKey: payload.sectionKey,
					content: payload.content,
					sortOrder: payload.sortOrder ?? 0,
					isActive: payload.isActive ?? true,
					createdAt: now,
					updatedAt: now
				})
				.returning();
			return created;
		}
	}

	async get(pageSlug: string, sectionKey: string) {
		const [content] = await db
			.select()
			.from(schema.pageContent)
			.where(
				and(
					eq(schema.pageContent.pageSlug, pageSlug),
					eq(schema.pageContent.sectionKey, sectionKey)
				)
			)
			.limit(1);
		return content;
	}

	async getPageContent(pageSlug: string) {
		const contents = await db
			.select()
			.from(schema.pageContent)
			.where(and(eq(schema.pageContent.pageSlug, pageSlug), eq(schema.pageContent.isActive, true)))
			.orderBy(asc(schema.pageContent.sortOrder));

		// Convert to a map for easier access
		const contentMap: Record<string, any> = {};
		for (const item of contents) {
			contentMap[item.sectionKey] = item.content;
		}
		return contentMap;
	}

	async getAllForPage(pageSlug: string) {
		const contents = await db
			.select()
			.from(schema.pageContent)
			.where(eq(schema.pageContent.pageSlug, pageSlug))
			.orderBy(asc(schema.pageContent.sortOrder));
		return contents;
	}

	async delete(pageSlug: string, sectionKey: string) {
		const [deleted] = await db
			.delete(schema.pageContent)
			.where(
				and(
					eq(schema.pageContent.pageSlug, pageSlug),
					eq(schema.pageContent.sectionKey, sectionKey)
				)
			)
			.returning();
		return deleted;
	}

	async getAllPages() {
		const result = await db
			.selectDistinct({ pageSlug: schema.pageContent.pageSlug })
			.from(schema.pageContent)
			.orderBy(asc(schema.pageContent.pageSlug));
		return result.map((r) => r.pageSlug);
	}
}

class SiteSettingsService {
	async get(key: string) {
		const [setting] = await db
			.select()
			.from(schema.siteSettings)
			.where(eq(schema.siteSettings.key, key))
			.limit(1);
		return setting?.value;
	}

	async set(key: string, value: any, description?: string) {
		const now = new Date().toISOString();

		const existing = await this.get(key);
		if (existing !== undefined) {
			const [updated] = await db
				.update(schema.siteSettings)
				.set({
					value,
					description,
					updatedAt: now
				})
				.where(eq(schema.siteSettings.key, key))
				.returning();
			return updated;
		} else {
			const [created] = await db
				.insert(schema.siteSettings)
				.values({
					id: crypto.randomUUID(),
					key,
					value,
					description,
					updatedAt: now
				})
				.returning();
			return created;
		}
	}

	async getAll() {
		const settings = await db.select().from(schema.siteSettings);
		const settingsMap: Record<string, any> = {};
		for (const s of settings) {
			settingsMap[s.key] = s.value;
		}
		return settingsMap;
	}

	async getAllRaw() {
		return await db.select().from(schema.siteSettings);
	}
}

export const pageContentService = new PageContentService();
export const siteSettingsService = new SiteSettingsService();

function serializeDate(date: string | Date | null | undefined): string | undefined {
	if (!date) return undefined;
	return typeof date === 'string' ? date : date.toISOString();
}

export function serializePageContent(content: any) {
	if (!content) return null;
	return {
		...content,
		createdAt: serializeDate(content.createdAt),
		updatedAt: serializeDate(content.updatedAt)
	};
}

export function serializeSiteSetting(setting: any) {
	if (!setting) return null;
	return {
		...setting,
		updatedAt: serializeDate(setting.updatedAt)
	};
}

// Default content templates for initial setup
export const defaultPageContents = {
	home: {
		seo: {
			title: 'Психолог Андрей Калмыков | Онлайн-консультации для выгорающих',
			description:
				'Психолог с опытом работы в IT. Помогаю техническим специалистам справиться с выгоранием, тревогой и найти баланс между работой и личной жизнью. Онлайн-консультации.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Психолог<br />Андрей Калмыков',
			titleMobile: ['Психолог', 'Андрей Калмыков'],
			subtitle:
				'Превращаю тревогу в инструмент самопознания, а выгорание — в повод к пересмотру приоритетов.',
			subtitleSecondary: 'Подбираю методы помощи индивидуально, учитывая ваши особенности.'
		},
		aboutIntro: {
			leftImage: { src: '/1.webp', srcMobile: '/1_small.webp', width: 505, height: 720 },
			leftTexts: [
				'Я Андрей — практикующий психолог, консультант в когнитивно-поведенческом подходе (КПТ). Работаю онлайн с людьми, переживающими тревогу и профессиональное выгорание.',
				'Имея за плечами годы работы в IT-сфере, я понимаю специфику работы в быстро меняющихся условиях. Хорошо знаком с проблемами, которые возникают у специалистов в интеллектуально-нагруженных профессиях: постоянное давление дедлайнов, синдром самозванца, сложности в коммуникации.',
				'Моя работа — создать пространство, где можно безопасно исследовать свои переживания и вместе найти способы обращения с ними. Не подавление, не борьба, а именно обращение — научиться жить в мире со своими эмоциями.',
				'Через анализ связей между вашими мыслями, чувствами и поведением я помогу развить навыки, которые позволят эффективнее справляться с текущими трудностями и станут основой для устойчивого эмоционального благополучия.'
			],
			rightTexts: [
				'Я не даю универсальных алгоритмов счастья или советов из серии «просто перестань думать о плохом». Каждый человек уникален, и то, что помогает одному, может оказаться бесполезным для другого.',
				'Вместо этого я настраиваю инструменты КПТ под вашу конкретную ситуацию. Вместе мы создадим индивидуальный набор техник, которые будут работать именно для вас.',
				'Моя задача — не просто снять симптом, а помочь вам понять механизмы своих переживаний. Когда вы поймете как работает ваша тревога или почему случается выгорание, вы сможете управлять этими процессами самостоятельно.',
				'Психотерапия, которую я практикую — это активная совместная работа. Я буду вашим проводником, но идти придется вам. И в этом процессе вы откроете в себе ресурсы, о которых даже не подозревали.'
			],
			rightImage: { src: '/2.webp', srcMobile: '/2_small.webp', width: 544, height: 720 },
			gridClass: 'grid-cols-1 md:grid-cols-12 gap-y-8.5 lg:gap-y-0 items-center lg:my-10'
		},
		issuesSection: {
			title:
				'Помогаю справляться с тревогой, выгоранием, прокрастинацией и найти путь к жизни, которую вам хочется жить',
			subtitle: 'c чем ко мне обращаются',
			gridClass: 'grid grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0',
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
			]
		},
		aboutSection: {
			title: 'обо мне',
			gridClass: 'grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24',
			items: [
				{
					icon: 'briefcase',
					highlight: 'опыт в IT',
					text: 'Знаю специфику цифровых профессий, говорю на одном языке с теми, кто работает в технологической сфере',
					gridClass: 'col-span-1 md:col-span-14'
				},
				{
					icon: 'flask',
					highlight: 'научный подход',
					text: 'Применяю методы с доказанной эффективностью, а не философские концепции или интуитивные догадки',
					gridClass: 'col-span-1 md:col-span-10'
				},
				{
					icon: 'lightbulb',
					highlight: 'практика',
					text: 'Постоянно учусь у коллег, обсуждаю сложные случаи и делюсь опытом на супервизиях и интервизиях',
					gridClass: 'col-span-1 md:col-span-10'
				},
				{
					icon: 'trending-up',
					highlight: 'измеримый результат',
					text: 'Использую систему трекинга для отслеживания динамики состояния клиентов, чтобы замечать прогресс в процессе работы',
					gridClass: 'col-span-1 md:col-span-14'
				}
			]
		},
		consultationInfo: {
			format: 'Встречи проходят онлайн',
			duration: 'Одна сессия — 50 минут',
			price: '5000 рублей за сессию'
		}
	},
	'online-therapy': {
		seo: {
			title: 'Процесс консультирования | Андрей Калмыков',
			description:
				'Условия и принципы работы с психологом. Правила сотрудничества для комфортного взаимодействия.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Как мы будем работать',
			subtitle:
				'Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями, чувствами и поведением для достижения желаемых изменений.',
			subtitleSecondary:
				'Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.'
		},
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
					'На первой встрече мы познакомимся, я расскажу подробнее о формате работы, и мы обсудим вашу ситуацию. Вам не нужно специально готовиться — просто расскажите о том с чем вы хотели бы работать. Если не знаете с чем — определимся вместе.',
					'Я внимательно веду беседу, задаю уточняющие вопросы, чтобы лучше понять ваш запрос, вы можете свободно выражать свои мысли и чувства.',
					'Волнение перед первой встречей — это нормально. Многие клиенты испытывают тревогу в начале работы, это естественная реакция на новый опыт.',
					'На следующих встречах мы уточняем цель и будем использовать разные способы работы, чтобы помочь вам достичь желаемых изменений.',
					'Во время разговора могут возникать разные эмоции: облегчение, замешательство, восторг, раздражение, слёзы, многословность, путаность в речи или отсутствие эмоций. Это нормально. Мы можем обсуждать как ваш запрос, так и ваши переживания.',
					'Терапия — совместная работа. Я отвечаю за ведение встречи, внимательность, предложение техник, наблюдение за вами и обсуждение моих наблюдений. Вы отвечаете за выбор запроса, выводы, решения и изменения в вашей жизни.'
				]
			},
			{
				title: 'Продолжительность сессии',
				data: ['50 минут, включая обратную связь.']
			},
			{
				title: 'Частота встреч',
				data: [
					'Обычно мы встречаемся раз в неделю, но можем вместе подобрать комфортную для вас частоту встреч.'
				]
			},
			{
				title: 'Запись на сессию',
				data: [
					'Просто напишите мне через [Telegram](https://t.me/psy_kalmykov) или [WhatsApp](https://api.whatsapp.com/send?phone=79065378241).'
				]
			},
			{
				title: 'Оплата и стоимость',
				data: [
					'5000₽ за сессию.',
					'**100% предоплата не позднее чем за 24 часа до сессии** по СБП: [+7 (906) 537-82-41](tel:+79065378241).',
					'После перевода, пожалуйста, отправьте мне сообщение с подтверждением. Отправлю вам чек после сессии.',
					'Об изменении цены предупрежу за месяц.'
				]
			},
			{
				title: 'Опоздания и переносы',
				data: [
					'При опоздании сессия сокращается на время опоздания.',
					'**Перенести или отменить сессию можно не позднее чем за 24 часа до начала, иначе сессия оплачивается.**',
					'Если я переношу сессию меньше чем за 24 часа, проведу дополнительную бесплатную сессию.'
				]
			},
			{
				title: 'Конфиденциальность',
				data: [
					'Во время сессии делаю заметки.',
					'Храню в тайне информацию, которую вы рассказываете. Исключение — угроза жизни.',
					'Периодически я **записываю сессии для обсуждения их с супервизором** — более опытным коллегой. Это помогает мне развиваться и лучше поддерживать вас.',
					'Запись удаляется сразу после обсуждения. Выбираю сессии для записи случайно, в начале сессии оповещу вас об этом.'
				]
			},
			{
				title: 'Нейтральность и принятие',
				data: [
					'На протяжении работы сохраняю нейтральность. Не осуждаю ваши мысли, чувства и действия. Вы можете свободно говорить обо всё, о чём посчитаете нужным и важным.'
				]
			},
			{
				title: 'Этические принципы',
				data: [
					'Работаю в соответствии с моими знаниями, навыками и опытом, с заботой о вашем благополучии. Если моих знаний недостаточно, порекомендую другого специалиста.',
					'Оказываю только психологические услуги и не получаю от вас услуг.',
					'Не общаюсь с вами вне сессий. Если случайно встретимся за пределами сессии, не буду здороваться первым, сохраняя вашу приватность.',
					'Я не интересуюсь вашей жизнью и окружением за пределами терапии. Не ищу и изучаю ваши соцсети.',
					'Не работаю с вашими близкими.'
				]
			},
			{
				title: 'Длительность работы',
				data: [
					'Заранее сложно оценить продолжительность работы.',
					'Длительность зависит от ваших потребностей, целей и особенностей личности, комфорта в нашей работе и времени, которое вы готовы уделять терапии.',
					'Составим план и оценим время достижения целей совместно.'
				]
			},
			{
				title: 'Отпуск',
				data: ['О своем отпуске предупрежу минимум за неделю.']
			},
			{
				title: 'Завершение работы',
				data: [
					'Можете закончить в любой момент, когда почувствуете в этом потребность.',
					'Рекомендую посвятить хотя бы одну встречу осмысленному завершению терапии и подведению итогов.',
					'Можно вернуться в терапию в любой момент, если будет открыта запись.',
					'Могу завершить работу с вами, если почувствую, что у меня не получится качественно вам помочь, либо при нарушении пунктов этого согласия.'
				]
			},
			{
				title: 'Обратная связь',
				data: [
					'Использую шкалы для отслеживания самочувствия и обратной связи. Мы вместе заполняем их каждую сессию.',
					'Приветствую любую обратную связь в свободной форме — это помогает нам сделать совместную работу максимально полезной для вас.'
				]
			}
		],
		bookingLink: 'https://t.me/m/hSP1SM5sYjcy'
	},
	'for-doctors': {
		seo: {
			title: 'Совместная работа психолога и психиатра | Андрей Калмыков',
			description:
				'Психолог Андрей Калмыков (КПТ, ACT). Совместная работа с врачами-психиатрами: повышение приверженности лечению, поддержка пациентов с депрессией и тревожными расстройствами, улучшение эффективности терапии.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Эффективное взаимодействие психолога с врачом',
			subtitle: 'Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения'
		},
		aboutText: [
			'Меня зовут Андрей Калмыков, я психолог, работаю в подходах КПТ и ACT.',
			'Веду индивидуальную терапию для взрослых, преимущественно с депрессивной и тревожной симптоматикой, хроническим стрессом и профессиональным выгоранием. Работаю в связке с психиатрами, обеспечивая пациенту согласованный план помощи.',
			'Эффективная помощь людям с психическими расстройствами — это всегда командная работа врача и психолога.',
			'Современные исследования и практика показывают, что интеграция психотерапии параллельно с фармакотерапией позволяет добиться более стойкой ремиссии, снизить риски обострений и повысить удовлетворенность пациентов от помощи.',
			'Партнерство с психологом освобождает врача от необходимости контролировать все аспекты поведения и мотивации пациента, помогая сфокусироваться на клинических задачах.'
		],
		problemsSection: {
			title: 'какие проблемы психологи помогают решить врачам',
			items: [
				{
					highlight: 'снижение преждевременного прекращения терапии',
					text: 'Совместная работа с с врачом, врачом-психиатром и психологическая поддержка помогают клиенту чувствовать себя увереннее, видеть смысл в лечении и продолжать его.',
					gridClass: 'col-span-1 md:col-span-24'
				},
				{
					highlight: 'рост удовлетворённости лечением',
					text: 'Психолог вовлекает клиента в процесс, информирует о ходе терапии, отвечает на вопросы и помогает принимать решения.',
					gridClass: 'col-span-1 md:col-span-10'
				},
				{
					highlight: 'улучшение коммуникации между всеми участниками процесса',
					text: 'Психолог организует обмен информацией между клиентом, врачом, врачом-психиатром и другими специалистами, согласует цели и этапы терапии.',
					gridClass: 'col-span-1 md:col-span-14'
				},
				{
					highlight: 'повышение эффективности медикаментозного лечения',
					text: 'Психолог отслеживает реакцию клиента, поддерживает мотивацию и комплаентность, что улучшает результаты фармакотерапии.',
					gridClass: 'col-span-1 md:col-span-14'
				},
				{
					highlight: 'разъяснение назначений и рекомендаций',
					text: 'Психолог помогает клиенту понять цели и логику терапии, объясняет, зачем назначаются те или иные методы.',
					gridClass: 'col-span-1 md:col-span-10'
				}
			]
		},
		requestsSection: {
			title: 'основные группы запросов с которыми я работаю в совместном формате с врачами',
			items: [
				{
					theme: 'неклинические и субклинические состояния',
					gridClass: 'md:col-span-1',
					points: [
						'усталость',
						'прокрастинация, самосаботаж',
						'перфекционизм, самокритика, страх ошибок',
						'проблемы с коммуникацией',
						'эмоциональное выгорание',
						'проблемы со сном, бессонница'
					]
				},
				{
					theme: 'депрессия и родственные состояния',
					gridClass: 'md:col-span-1',
					points: [
						'депрессивный эпизод',
						'рекуррентное депрессивное расстройство',
						'хронические расстройства настроения',
						'поддержка приверженности фармакотерапии'
					]
				},
				{
					theme: 'фобические тревожные расстройства',
					gridClass: 'md:col-span-1',
					points: [
						'социальные фобии',
						'агорафобия',
						'другие фобические тревожные расстройства',
						'навязчивые тревожные мысли, катастрофизация',
						'агорафобия'
					]
				},
				{
					theme: 'другие тревожные расстройства',
					gridClass: 'md:col-span-1',
					points: [
						'паническое расстройство',
						'генерализованное тревожное расстройство',
						'обсессивно-компульсивное расстройство'
					]
				}
			]
		},
		exclusions: [
			'расстройства пищевого поведения',
			'люди с расстройствами личности, если основной запрос связан с компенсацией РЛ',
			'биполярное аффективное расстройство',
			'РАС/СДВГ',
			'Шизофрения'
		],
		contact: {
			text: 'Вы можете рекомендовать меня как психолога вашим пациентам либо предложить мне другие форматы взаимодействия.',
			subtext: 'Я консультирую онлайн, мои контакты:',
			phone: '+7 906 534-82-41',
			phoneLink: 'https://api.whatsapp.com/send?phone=79065378241',
			telegram: 't.me/psy_kalmykov',
			telegramLink: 'https://t.me/psy_kalmykov',
			conditionsLink: 'https://kalmykov-psy.ru/online-therapy'
		}
	},
	sos: {
		seo: {
			title: 'Экстренная помощь | Андрей Калмыков',
			description:
				'Телефоны доверия и кризисные линии помощи. Куда обратиться в экстренной ситуации.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Экстренная помощь',
			subtitle:
				'Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или попали в угрожающую жизни ситуацию — срочно обратитесь за помощью за помощью в эти организации.'
		},
		contacts: [
			{
				title: 'Единый круглосуточный телефон доверия для взрослых и детей',
				phone: '+7 (800) 100-49-94',
				link: 'tel:+78001004994'
			},
			{
				title: 'Бесплатная кризисная линия доверия по России, круглосуточно',
				phone: '+7 (800) 333-44-34',
				link: 'tel:+78003334434'
			},
			{
				title: 'Всероссийская служба детского телефона доверия, круглосуточно, анонимно',
				phone: '+7 (800) 200-01-22',
				link: 'tel:+78002000122'
			},
			{
				title: 'Российский Красный Крест, горячая линия',
				phone: '+7 (800) 250-18-59',
				link: 'tel:+78002501859'
			},
			{
				title:
					'Всероссийский бесплатный телефон доверия для женщин, подвергшихся домашнему насилию, по будням 7:00–21:00',
				phone: '+7 (800) 700-06-00',
				link: 'tel:+78007000600'
			},
			{
				title:
					'Горячая линия социально-психологической помощи детям и семьям мигрантов, находящимся в трудной жизненной ситуации',
				phone: '+7 (499) 201-59-47',
				link: 'tel:+74992015947'
			}
		]
	},
	articles: {
		seo: {
			title: 'Статьи о психологии | Андрей Калмыков',
			description:
				'Полезные статьи о психологии, когнитивно-поведенческой терапии, тревоге и выгорании. Практические советы и научный подход.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Статьи',
			subtitle:
				'Полезные материалы о психологии, когнитивно-поведенческой терапии и психическом здоровье.'
		}
	},
	surveys: {
		seo: {
			title: 'Психологические опросники | Андрей Калмыков',
			description:
				'Научно обоснованные психологические опросники для самодиагностики: тревога, депрессия, выгорание, прокрастинация.',
			ogImage: '/header.webp'
		},
		hero: {
			title: 'Опросники',
			subtitle:
				'Научно обоснованные инструменты для самодиагностики. Результаты помогут лучше понять своё состояние.'
		}
	}
};

// Helper to get content with defaults
export function getPageContentWithDefaults(
	pageSlug: keyof typeof defaultPageContents,
	dbContent: Record<string, any>
) {
	const defaults = defaultPageContents[pageSlug] || {};
	const result: Record<string, any> = {};

	// Merge DB content over defaults
	for (const key of Object.keys(defaults)) {
		result[key] = dbContent[key] !== undefined ? dbContent[key] : (defaults as any)[key];
	}

	// Include any additional DB content not in defaults
	for (const key of Object.keys(dbContent)) {
		if (result[key] === undefined) {
			result[key] = dbContent[key];
		}
	}

	return result;
}
