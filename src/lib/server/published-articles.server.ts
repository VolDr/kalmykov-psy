import articleA01 from '../../../content/articles/vygoranie-priznaki-i-vosstanovlenie.md?raw';
import articleA02 from '../../../content/articles/vygoranie-ili-depressiya.md?raw';
import articleA03 from '../../../content/articles/otpusk-ne-pomogaet-pri-vygoranii.md?raw';
import articleA04 from '../../../content/articles/prokrastinatsiya-prichiny-i-chto-delat.md?raw';
import articleA05 from '../../../content/articles/ne-mogu-sosredotochitsya.md?raw';
import articleA06 from '../../../content/articles/pochemu-otkladyvayu-son.md?raw';
import articleA07 from '../../../content/articles/kak-upravlyat-emotsiyami.md?raw';
import articleA08 from '../../../content/articles/kak-perestat-vse-kontrolirovat.md?raw';
import articleA09 from '../../../content/articles/kak-ponyat-svoi-tsennosti.md?raw';
import articleA10 from '../../../content/articles/krizis-30-let.md?raw';
import articleA11 from '../../../content/articles/kak-ponyat-chto-psihoterapiya-rabotaet.md?raw';
import articleA12 from '../../../content/articles/vygoranie-i-otnosheniya.md?raw';

type ArticleMetadata = {
	id: string;
	title: string;
	description: string;
	descriptionMeta: string;
	uri: string;
};

export type PublishedArticle = ArticleMetadata & {
	seoTitle: string;
	content: { markdown: string };
	createdAt: string;
	updatedAt: string;
	imageUrl: null;
	viewCount: number;
	category: string;
	cluster: string;
	clusterSlug: string;
	readingMinutes: number;
};

export type PublishedArticleSummary = Omit<PublishedArticle, 'content'>;

const articleSources = [
	articleA01,
	articleA02,
	articleA03,
	articleA04,
	articleA05,
	articleA06,
	articleA07,
	articleA08,
	articleA09,
	articleA10,
	articleA11,
	articleA12
];

const categories: Record<string, string> = {
	A01: 'Выгорание',
	A02: 'Выгорание',
	A03: 'Выгорание',
	A04: 'Прокрастинация',
	A05: 'Внимание',
	A06: 'Сон',
	A07: 'Эмоции',
	A08: 'Контроль',
	A09: 'Ценности',
	A10: 'Самоопределение',
	A11: 'Психотерапия',
	A12: 'Отношения'
};

const clusters: Record<string, string> = {
	A01: 'Выгорание и восстановление',
	A02: 'Выгорание и восстановление',
	A03: 'Выгорание и восстановление',
	A04: 'Прокрастинация, внимание и сон',
	A05: 'Прокрастинация, внимание и сон',
	A06: 'Прокрастинация, внимание и сон',
	A07: 'Саморегуляция и жизненные ориентиры',
	A08: 'Саморегуляция и жизненные ориентиры',
	A09: 'Саморегуляция и жизненные ориентиры',
	A10: 'Саморегуляция и жизненные ориентиры',
	A11: 'О психотерапии',
	A12: 'Выгорание и восстановление'
};

const clusterSlugs: Record<string, string> = {
	A01: 'burnout',
	A02: 'burnout',
	A03: 'burnout',
	A04: 'focus',
	A05: 'focus',
	A06: 'focus',
	A07: 'life-decisions',
	A08: 'life-decisions',
	A09: 'life-decisions',
	A10: 'life-decisions',
	A11: 'therapy',
	A12: 'burnout'
};

const seoTitles: Record<string, string> = {
	A01: 'Выгорание: признаки, стадии и как восстановиться',
	A02: 'Выгорание или депрессия: как различить',
	A03: 'Почему отпуск не помогает при выгорании',
	A04: 'Прокрастинация: почему мы откладываем дела и что делать',
	A05: 'Не могу сосредоточиться: причины и что делать',
	A06: 'Почему я откладываю сон и как выйти из этого круга',
	A07: 'Как управлять эмоциями без подавления',
	A08: 'Как перестать всё контролировать: первые шаги',
	A09: 'Как понять свои ценности и принимать решения',
	A10: 'Кризис 30 лет: что происходит и что делать',
	A11: 'Как понять, работает ли психотерапия',
	A12: 'Как рабочее выгорание влияет на отношения'
};

const relatedArticleUris: Record<string, string[]> = {
	'vygoranie-priznaki-i-vosstanovlenie': [
		'vygoranie-ili-depressiya',
		'otpusk-ne-pomogaet-pri-vygoranii',
		'vygoranie-i-otnosheniya'
	],
	'vygoranie-ili-depressiya': [
		'vygoranie-priznaki-i-vosstanovlenie',
		'otpusk-ne-pomogaet-pri-vygoranii'
	],
	'otpusk-ne-pomogaet-pri-vygoranii': [
		'vygoranie-priznaki-i-vosstanovlenie',
		'vygoranie-ili-depressiya',
		'vygoranie-i-otnosheniya'
	],
	'prokrastinatsiya-prichiny-i-chto-delat': [
		'ne-mogu-sosredotochitsya',
		'pochemu-otkladyvayu-son',
		'kak-ponyat-svoi-tsennosti'
	],
	'ne-mogu-sosredotochitsya': ['prokrastinatsiya-prichiny-i-chto-delat', 'pochemu-otkladyvayu-son'],
	'pochemu-otkladyvayu-son': ['ne-mogu-sosredotochitsya', 'prokrastinatsiya-prichiny-i-chto-delat'],
	'kak-upravlyat-emotsiyami': ['kak-perestat-vse-kontrolirovat', 'kak-ponyat-svoi-tsennosti'],
	'kak-perestat-vse-kontrolirovat': ['kak-upravlyat-emotsiyami', 'kak-ponyat-svoi-tsennosti'],
	'kak-ponyat-svoi-tsennosti': [
		'kak-upravlyat-emotsiyami',
		'kak-perestat-vse-kontrolirovat',
		'krizis-30-let'
	],
	'krizis-30-let': ['kak-ponyat-svoi-tsennosti', 'kak-ponyat-chto-psihoterapiya-rabotaet'],
	'kak-ponyat-chto-psihoterapiya-rabotaet': ['krizis-30-let', 'vygoranie-ili-depressiya'],
	'vygoranie-i-otnosheniya': [
		'vygoranie-priznaki-i-vosstanovlenie',
		'otpusk-ne-pomogaet-pri-vygoranii'
	]
};

function parseScalar(value: string): unknown {
	const trimmed = value.trim();
	if (trimmed.startsWith('"') || trimmed.startsWith('[')) return JSON.parse(trimmed);
	return trimmed;
}

function parseArticle(source: string, index: number): PublishedArticle {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) throw new Error(`Некорректный frontmatter у статьи ${index + 1}`);

	const metadata: Record<string, unknown> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const separator = line.indexOf(':');
		if (separator < 1) continue;
		metadata[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
	}

	for (const field of ['id', 'title', 'description', 'descriptionMeta', 'uri']) {
		if (typeof metadata[field] !== 'string' || metadata[field].trim() === '') {
			throw new Error(`У статьи ${index + 1} отсутствует поле ${field}`);
		}
	}

	const typedMetadata = metadata as ArticleMetadata;
	const markdown = match[2].trim();
	const wordCount = markdown.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
	const publishedAt = '2026-09-08T12:00:00+03:00';

	return {
		...typedMetadata,
		seoTitle: seoTitles[typedMetadata.id] ?? typedMetadata.title,
		content: { markdown },
		createdAt: publishedAt,
		updatedAt: publishedAt,
		imageUrl: null,
		viewCount: 0,
		category: categories[typedMetadata.id] ?? 'Психология',
		cluster: clusters[typedMetadata.id] ?? 'Психология',
		clusterSlug: clusterSlugs[typedMetadata.id] ?? 'psychology',
		readingMinutes: Math.max(3, Math.ceil(wordCount / 180))
	};
}

const articles = articleSources.map(parseArticle);
const articlesByUri = new Map(articles.map((article) => [article.uri, article]));
const articleSummaries = articles.map(({ content: _content, ...article }) => article);

export const publishedArticleService = {
	async getAll(): Promise<PublishedArticleSummary[]> {
		return articleSummaries;
	},

	async getByUri(uri: string): Promise<PublishedArticle | undefined> {
		return articlesByUri.get(uri);
	},

	async getRelated(uri: string): Promise<PublishedArticleSummary[]> {
		return (relatedArticleUris[uri] ?? [])
			.map((relatedUri) => articleSummaries.find((article) => article.uri === relatedUri))
			.filter((article): article is PublishedArticleSummary => article !== undefined);
	}
};
