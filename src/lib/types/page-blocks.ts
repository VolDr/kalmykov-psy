/**
 * Page Block Types for Visual Page Constructor
 *
 * These types define the structure for building dynamic pages
 * using reusable block components.
 */

// Base block interface
export interface BaseBlock {
	id: string;
	type: BlockType;
	sortOrder: number;
	isActive: boolean;
}

// All available block types
export type BlockType =
	// Universal blocks
	| 'page-hero'
	| 'image-text'
	| 'section-container'
	| 'card-grid'
	| 'text-block-section'
	| 'list-card'
	| 'icon-card'
	| 'contact-card'
	// Unique/specialized blocks
	| 'home-hero'
	| 'education'
	| 'faq'
	| 'consultation-info'
	| 'about-section'
	| 'issues-list'
	| 'about-intro-dual';

// Universal Block Configurations

export interface PageHeroBlock extends BaseBlock {
	type: 'page-hero';
	config: {
		title: string;
		subtitle: string;
		subtitleSecondary?: string;
		maxWidth?: 'sm' | 'md' | 'lg';
		titleLineHeight?: 'tight' | 'relaxed';
		subtitleRowStart?: '8' | '9';
	};
}

export interface ImageTextBlock extends BaseBlock {
	type: 'image-text';
	config: {
		image: {
			src: string;
			srcSmall?: string;
			alt: string;
			imgClass?: string;
		};
		layout: 'image-left' | 'image-right';
		paragraphs: string[];
		withReveal?: boolean;
	};
}

export interface SectionContainerBlock extends BaseBlock {
	type: 'section-container';
	config: {
		title?: string;
		subtitle?: string;
		maxWidth?: 'sm' | 'md' | 'lg';
		gap?: 'sm' | 'md' | 'lg';
		titleAlign?: 'left' | 'center';
		className?: string;
		children: PageBlock[]; // Nested blocks
	};
}

export interface CardGridBlock extends BaseBlock {
	type: 'card-grid';
	config: {
		cols: '1' | '2' | '3' | '24';
		gap?: 'sm' | 'md' | 'lg';
		responsive?: boolean;
		className?: string;
		cards: (ListCardConfig | IconCardConfig | ContactCardConfig | LinkCardConfig)[];
	};
}

export interface TextBlockSectionBlock extends BaseBlock {
	type: 'text-block-section';
	config: {
		blocks: Array<{
			title: string;
			data: string[];
		}>;
	};
}

// Card Configurations (used inside CardGridBlock)
export interface ListCardConfig {
	type: 'list-card';
	title: string;
	points: string[];
	gridClass?: string;
	minHeight?: string;
	withReveal?: boolean;
	justify?: 'between' | 'start';
}

export interface IconCardConfig {
	type: 'icon-card';
	icon?: string;
	highlight: string;
	text: string;
	gridClass?: string;
	minHeight?: string;
	withReveal?: boolean;
	showIcon?: boolean;
}

export interface ContactCardConfig {
	type: 'contact-card';
	title: string;
	phone: string;
	link: string;
	minHeight?: string;
}

export interface LinkCardConfig {
	type: 'link-card';
	title: string;
	description: string;
	link: string;
	cta?: string;
}

// Unique/Specialized Block Configurations

export interface HomeHeroBlock extends BaseBlock {
	type: 'home-hero';
	config: {
		// Uses fixed structure, but can override texts if needed in future
		titleLine1?: string;
		titleLine2?: string;
		subtitle?: string;
		subtitleSecondary?: string;
	};
}

export interface EducationBlock extends BaseBlock {
	type: 'education';
	config: {
		isOpen?: boolean;
		withReveal?: boolean;
		// Data comes from education.ts or can be overridden
	};
}

export interface FaqBlock extends BaseBlock {
	type: 'faq';
	config: {
		// Data comes from faq.ts or can be overridden
		items?: Array<{
			question: string;
			answer: string;
		}>;
	};
}

export interface ConsultationInfoBlock extends BaseBlock {
	type: 'consultation-info';
	config: {
		price: string;
		format: string;
		duration: string;
	};
}

export interface AboutSectionBlock extends BaseBlock {
	type: 'about-section';
	config: {
		title?: string;
		items: Array<{
			icon: string;
			highlight: string;
			text: string;
			gridClass?: string;
		}>;
		withReveal?: boolean;
	};
}

export interface IssuesListBlock extends BaseBlock {
	type: 'issues-list';
	config: {
		introText?: string;
		subtitle?: string;
		items: Array<{
			theme: string;
			icon?: string;
			points: string[];
			gridClass?: string;
		}>;
		withReveal?: boolean;
	};
}

export interface AboutIntroDualBlock extends BaseBlock {
	type: 'about-intro-dual';
	config: {
		leftImage: {
			src: string;
			srcSmall?: string;
			alt: string;
			width?: number;
			height?: number;
			imgClass?: string;
		};
		leftTexts: string[];
		rightTexts: string[];
		rightImage: {
			src: string;
			srcSmall?: string;
			alt: string;
			width?: number;
			height?: number;
			imgClass?: string;
		};
		withReveal?: boolean;
	};
}

// Union type for all blocks
export type PageBlock =
	| PageHeroBlock
	| ImageTextBlock
	| SectionContainerBlock
	| CardGridBlock
	| TextBlockSectionBlock
	| HomeHeroBlock
	| EducationBlock
	| FaqBlock
	| ConsultationInfoBlock
	| AboutSectionBlock
	| IssuesListBlock
	| AboutIntroDualBlock;

// Page layout configuration
export interface PageLayoutSettings {
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	containerClass?: string;
	withContainer?: boolean;
}

// Page configuration
export interface PageConfiguration {
	slug: string;
	name: string;
	seo: {
		title: string;
		description: string;
		ogImage?: string;
	};
	layout?: PageLayoutSettings;
	blocks: PageBlock[];
}

// Block metadata for UI
export interface BlockMetadata {
	type: BlockType;
	name: string;
	description: string;
	category: 'universal' | 'unique';
	icon: string;
}

export const blockMetadataRegistry: BlockMetadata[] = [
	// Universal blocks
	{
		type: 'page-hero',
		name: 'Hero секция',
		description: 'Заголовок страницы с фоновым изображением',
		category: 'universal',
		icon: 'layout-template'
	},
	{
		type: 'image-text',
		name: 'Изображение + текст',
		description: 'Блок с фото и текстом (слева/справа)',
		category: 'universal',
		icon: 'layout-sidebar'
	},
	{
		type: 'section-container',
		name: 'Контейнер секции',
		description: 'Обёртка с заголовком и настройками ширины',
		category: 'universal',
		icon: 'box'
	},
	{
		type: 'card-grid',
		name: 'Сетка карточек',
		description: 'Адаптивная сетка с карточками',
		category: 'universal',
		icon: 'grid-3x3'
	},
	{
		type: 'text-block-section',
		name: 'Текстовые блоки',
		description: 'Секция с заголовками и текстом (как на странице условий)',
		category: 'universal',
		icon: 'text'
	},
	// Unique blocks
	{
		type: 'home-hero',
		name: 'Hero главной страницы',
		description: 'Уникальный hero для главной (двухстрочный заголовок)',
		category: 'unique',
		icon: 'home'
	},
	{
		type: 'education',
		name: 'Образование',
		description: 'Раскрывающаяся секция образования с timeline',
		category: 'unique',
		icon: 'graduation-cap'
	},
	{
		type: 'faq',
		name: 'FAQ',
		description: 'Аккордеон с вопросами и ответами',
		category: 'unique',
		icon: 'circle-help'
	},
	{
		type: 'consultation-info',
		name: 'Информация о консультации',
		description: 'Блок с ценой, форматом и длительностью',
		category: 'unique',
		icon: 'info'
	},
	{
		type: 'about-section',
		name: 'Обо мне',
		description: 'Карточки с иконками и асимметричной сеткой',
		category: 'unique',
		icon: 'user'
	},
	{
		type: 'issues-list',
		name: 'Список запросов',
		description: 'Карточки с темами и списками пунктов',
		category: 'unique',
		icon: 'list-checks'
	},
	{
		type: 'about-intro-dual',
		name: 'Двойное введение',
		description: 'Два изображения с текстом (левое и правое)',
		category: 'unique',
		icon: 'layout-grid'
	}
];

// Helper to create empty block config
export function createEmptyBlock(type: BlockType): PageBlock {
	const id = crypto.randomUUID();
	const base = { id, type, sortOrder: 0, isActive: true };

	switch (type) {
		case 'page-hero':
			return {
				...base,
				type: 'page-hero',
				config: {
					title: 'Заголовок страницы',
					subtitle: 'Описание страницы'
				}
			} as PageHeroBlock;

		case 'image-text':
			return {
				...base,
				type: 'image-text',
				config: {
					image: { src: '/placeholder.webp', alt: 'Изображение' },
					layout: 'image-left',
					paragraphs: ['Текст параграфа']
				}
			} as ImageTextBlock;

		case 'section-container':
			return {
				...base,
				type: 'section-container',
				config: {
					title: 'Заголовок секции',
					children: []
				}
			} as SectionContainerBlock;

		case 'card-grid':
			return {
				...base,
				type: 'card-grid',
				config: {
					cols: '2',
					gap: 'md',
					cards: []
				}
			} as CardGridBlock;

		case 'text-block-section':
			return {
				...base,
				type: 'text-block-section',
				config: {
					blocks: [{ title: 'Заголовок', data: ['Текст'] }]
				}
			} as TextBlockSectionBlock;

		case 'home-hero':
			return {
				...base,
				type: 'home-hero',
				config: {}
			} as HomeHeroBlock;

		case 'education':
			return {
				...base,
				type: 'education',
				config: { isOpen: false, withReveal: true }
			} as EducationBlock;

		case 'faq':
			return {
				...base,
				type: 'faq',
				config: {}
			} as FaqBlock;

		case 'consultation-info':
			return {
				...base,
				type: 'consultation-info',
				config: {
					price: '5000 рублей за сессию',
					format: 'Встречи проходят онлайн',
					duration: 'Одна сессия — 50 минут'
				}
			} as ConsultationInfoBlock;

		case 'about-section':
			return {
				...base,
				type: 'about-section',
				config: {
					title: 'обо мне',
					items: []
				}
			} as AboutSectionBlock;

		case 'issues-list':
			return {
				...base,
				type: 'issues-list',
				config: {
					subtitle: 'c чем ко мне обращаются',
					items: []
				}
			} as IssuesListBlock;

		case 'about-intro-dual':
			return {
				...base,
				type: 'about-intro-dual',
				config: {
					leftImage: { src: '/1.webp', alt: 'Левое изображение' },
					leftTexts: ['Текст слева'],
					rightTexts: ['Текст справа'],
					rightImage: { src: '/2.webp', alt: 'Правое изображение' },
					withReveal: false
				}
			} as AboutIntroDualBlock;

		default:
			throw new Error(`Unknown block type: ${type}`);
	}
}
