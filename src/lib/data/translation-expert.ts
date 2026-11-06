import {
	TRANSLATION_MAX_LENGTH,
	type TranslationChange,
	type TranslationEntry,
	type TranslationItem
} from './translation';
import type { ReconciliationProfile, ReviewComment } from './translation-reconciliation';

export interface ExpertDiscussion {
	id: number;
	slot: number;
	profiles: Record<number, ReconciliationProfile>;
	comments: ReviewComment[];
}

/**
 * Экспертная оценка сведённого перевода. Ответы хранятся в обычных translation_entries
 * и сохраняются тем же клиентом с версиями: каждое поле оценки — своя пара (ключ, поле).
 *   ясность     → ключ пункта, поле translation: 'clear' | 'unclear' | ''
 *   комментарий → ключ пункта, поле comment
 *   правка      → `${ключ}/rewrite`, поле translation
 *   релевантность → `${ключ}/relevance`, поле translation: '1'…'4' | ''
 */
export type ExpertField = 'clarity' | 'comment' | 'rewrite' | 'relevance';
export type ExpertClarity = '' | 'clear' | 'unclear';

export interface ExpertAnswer {
	clarity: ExpertClarity;
	rewrite: string;
	relevance: string;
	comment: string;
}

export interface ExpertResult {
	/** Ссылка (одна оценка) */
	id: number;
	/** Эксперт: общий для его первой и повторных ссылок */
	personId: number;
	docId: number;
	token: string;
	name: string;
	createdAt: string;
	items: TranslationItem[];
	entries: Record<string, TranslationEntry>;
	adminToken?: string | null;
	comments?: ReviewComment[];
}

export const EXPERT_FORMAT_KEY = 'format';

/** Legacy free-text fields are shown only through the discussion, including deletions. */
export function expertPublicEntries(entries: Record<string, TranslationEntry>): Record<string, TranslationEntry> {
	return Object.fromEntries(Object.entries(entries).filter(([key]) => !key.endsWith('/rewrite')).map(([key, entry]) => [key, { ...entry, comment: '', commentVersion: 0 }]));
}

export const expertBriefing = `Я адаптирую на русский язык опросник экспериенциального избегания из 30 пунктов, по пять на каждый из шести компонентов.

Ниже переведённая версия опросника и определения шести компонентов избегания. У каждого пункта указано, к какому компоненту он относится.

**Ясность.** По каждому пункту, по инструкции и по формату ответов отметьте, понятна ли формулировка. Если неясна, предложите в комментарии, как её переписать.

**Релевантность.** По каждому пункту оцените, насколько он относится к своему компоненту: 1 — не релевантен; 2 — не могу оценить релевантность; 3 — релевантен, но нужна небольшая правка; 4 — очень релевантен и лаконичен.

По любому пункту можно оставить комментарий.

Если какие-то пункты придётся поправить, я пришлю их на повторную оценку.`;

export const expertRepeatBriefing = `Это повторная оценка: здесь только пункты, которые были исправлены после ваших замечаний. Остальные ваши оценки сохранены и учитываются.

${expertBriefing.split('\n\n').slice(1, -1).join('\n\n')}`;

export const relevanceOptions = [
	{ value: '1', label: 'Не релевантен' },
	{ value: '2', label: 'Не могу оценить релевантность' },
	{ value: '3', label: 'Релевантен, но нужна небольшая правка' },
	{ value: '4', label: 'Очень релевантен и лаконичен' }
] as const;

/** Релевантность оценивается только у утверждений, не у инструкции и формата ответов. */
export const isRatedItem = (item: Pick<TranslationItem, 'key'>) => /^\d+$/.test(item.key);

export function expertStorage(itemKey: string, field: ExpertField) {
	if (field === 'rewrite') return { key: `${itemKey}/rewrite`, field: 'translation' as const };
	if (field === 'relevance') return { key: `${itemKey}/relevance`, field: 'translation' as const };
	return {
		key: itemKey,
		field: field === 'clarity' ? ('translation' as const) : ('comment' as const)
	};
}

/** Обратное отображение: какое поле оценки и какого пункта хранится под этой парой. */
export function expertFieldOf(
	key: string,
	field: TranslationChange['field']
): { itemKey: string; field: ExpertField } | null {
	const [itemKey, suffix, extra] = key.split('/');
	if (extra !== undefined || !itemKey) return null;
	if (suffix === undefined)
		return { itemKey, field: field === 'translation' ? 'clarity' : 'comment' };
	if (field !== 'translation') return null;
	if (suffix === 'rewrite') return { itemKey, field: 'rewrite' };
	if (suffix === 'relevance') return { itemKey, field: 'relevance' };
	return null;
}

export function expertStorageKeys(items: TranslationItem[]): Set<string> {
	const keys = new Set<string>();
	for (const item of items) {
		keys.add(item.key);
		keys.add(`${item.key}/rewrite`);
		if (isRatedItem(item)) keys.add(`${item.key}/relevance`);
	}
	return keys;
}

/** Текст ошибки или null, если правка допустима для этого документа. */
export function expertChangeError(
	change: Pick<TranslationChange, 'key' | 'field' | 'value'>,
	items: TranslationItem[]
): string | null {
	const target = expertFieldOf(change.key, change.field);
	const item = target && items.find((entry) => entry.key === target.itemKey);
	if (!target || !item) return 'Неизвестный пункт';
	if (change.value.length > TRANSLATION_MAX_LENGTH) return 'Текст слишком длинный';
	if (target.field === 'clarity' && !['', 'clear', 'unclear'].includes(change.value))
		return 'Неизвестная оценка ясности';
	if (target.field === 'relevance') {
		if (!isRatedItem(item)) return 'Релевантность не оценивается для этого пункта';
		if (!['', '1', '2', '3', '4'].includes(change.value)) return 'Оценка должна быть от 1 до 4';
	}
	return null;
}

export function expertAnswer(
	entries: Record<string, TranslationEntry>,
	itemKey: string
): ExpertAnswer {
	const clarity = entries[itemKey]?.translation ?? '';
	return {
		clarity: clarity === 'clear' || clarity === 'unclear' ? clarity : '',
		rewrite: entries[`${itemKey}/rewrite`]?.translation ?? '',
		relevance: entries[`${itemKey}/relevance`]?.translation ?? '',
		comment: entries[itemKey]?.comment ?? ''
	};
}

export const isExpertItemDone = (item: TranslationItem, answer: ExpertAnswer) =>
	Boolean(answer.clarity) && (!isRatedItem(item) || Boolean(answer.relevance));

/**
 * Пункты для эксперта из сведённого текста: инструкция, один блок «Формат ответов»
 * со всеми вариантами и утверждения. Порядок и ключи утверждений сохраняются,
 * поэтому разбивка по шкалам работает так же, как в согласовании.
 */
export function buildExpertItems(items: TranslationItem[], text: (key: string) => string) {
	const options = items.filter((item) => /^option\d+$/.test(item.key));
	const result: TranslationItem[] = [];
	let formatAdded = false;
	for (const item of items) {
		if (options.includes(item)) {
			if (formatAdded) continue;
			formatAdded = true;
			result.push({
				key: EXPERT_FORMAT_KEY,
				label: 'Формат ответов',
				short: 'Ф',
				group: 'Формат ответов',
				source: options.map((option, index) => `${index + 1} — ${text(option.key)}`).join('\n')
			});
			continue;
		}
		result.push({ ...item, source: text(item.key) });
	}
	// Варианты ответа в исходнике идут после утверждений; эксперту удобнее видеть
	// формат сразу после инструкции.
	const format = result.findIndex((item) => item.key === EXPERT_FORMAT_KEY);
	const instruction = result.findIndex((item) => item.key === 'instruction');
	if (format > -1 && instruction > -1 && format !== instruction + 1) {
		const [moved] = result.splice(format, 1);
		result.splice(instruction + 1, 0, moved);
	}
	return result;
}

export interface ExpertItemSummary {
	rated: number;
	/** Оценки 3 и 4 */
	relevant: number;
	/** Доля 3–4 среди выставленных оценок (I-CVI), null без оценок */
	cvi: number | null;
	mean: number | null;
	answered: number;
	unclear: number;
}

export function summarizeExpertItem(
	item: TranslationItem,
	experts: Pick<ExpertResult, 'entries'>[]
): ExpertItemSummary {
	const answers = experts.map((expert) => expertAnswer(expert.entries, item.key));
	const scores = answers.map((answer) => Number(answer.relevance)).filter((score) => score > 0);
	const relevant = scores.filter((score) => score >= 3).length;
	return {
		rated: scores.length,
		relevant,
		cvi: isRatedItem(item) && scores.length ? relevant / scores.length : null,
		mean: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
		answered: answers.filter((answer) => answer.clarity).length,
		unclear: answers.filter((answer) => answer.clarity === 'unclear').length
	};
}

/** Последняя формулировка каждого пункта среди ссылок (ссылки — по возрастанию id). */
export function latestExpertTexts(links: Pick<ExpertResult, 'items'>[]): Map<string, string> {
	const texts = new Map<string, string>();
	for (const link of links) for (const item of link.items) texts.set(item.key, item.source);
	return texts;
}

export interface ExpertRowAnswer {
	/** Последняя ссылка эксперта, в которой был этот пункт */
	link: ExpertResult;
	/** Эксперт оценивал текущую формулировку */
	current: boolean;
}

export interface ExpertResultRow {
	item: TranslationItem;
	/** По одному ответу на эксперта: из его последней ссылки с этим пунктом */
	answers: ExpertRowAnswer[];
	/** Ссылки, оценки из которых входят в статистику пункта */
	experts: ExpertResult[];
}

/**
 * Строки сводки — по последним формулировкам пунктов. Каждый эксперт учитывается
 * один раз: берётся его последняя оценка пункта, и только если она относится к
 * текущей формулировке. Повторная ссылка не превращает эксперта в двух.
 */
export function expertResultRows(
	experts: ExpertResult[],
	/** Текущие итоговые формулировки; пустые (итог ещё правят) не учитываются */
	current: TranslationItem[] = []
): ExpertResultRow[] {
	const links = [...experts].sort((a, b) => a.id - b.id);
	const latest = new Map<string, TranslationItem>();
	for (const link of links) for (const item of link.items) latest.set(item.key, item);
	for (const item of current) if (item.source.trim()) latest.set(item.key, item);
	// Порядок пунктов — как в итоге (или в первой ссылке), прочие ключи в конце.
	const order = [
		...new Set([
			...current.map((item) => item.key),
			...links.flatMap((link) => link.items.map((item) => item.key))
		])
	];
	const people = [...new Set(links.map((link) => link.personId))];
	return order.flatMap((key) => {
		const item = latest.get(key);
		if (!item || !links.some((link) => link.items.some((other) => other.key === key))) return [];
		const answers = people.flatMap((personId): ExpertRowAnswer[] => {
			const link = links
				.filter((entry) => entry.personId === personId)
				.findLast((entry) => entry.items.some((other) => other.key === key));
			if (!link) return [];
			const seen = link.items.find((other) => other.key === key);
			return [{ link, current: seen?.source === item.source }];
		});
		return [
			{
				item,
				answers,
				experts: answers.filter((answer) => answer.current).map((answer) => answer.link)
			}
		];
	});
}

const csvCell = (value: string) => {
	let beginning = value.trimStart();
	while (beginning && beginning.charCodeAt(0) < 32) beginning = beginning.slice(1).trimStart();
	const safe = /^[=+@-]/.test(beginning) ? `'${value}` : value;
	return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Одна строка на пункт и эксперта; разделитель «;» открывается в Excel без настройки. */
export function expertResultsCsv(experts: ExpertResult[]): string {
	const lines = [
		[
			'Пункт',
			'Формулировка',
			'Эксперт',
			'Ссылка',
			'Ясность',
			'Релевантность',
			'Комментарий'
		]
	];
	for (const expert of experts)
		for (const item of expert.items) {
			const answer = expertAnswer(expert.entries, item.key);
			lines.push([
				item.label,
				item.source,
				expert.name,
				expert.id === expert.personId ? 'первая оценка' : `повторная №${expert.id}`,
				answer.clarity === 'clear' ? 'Понятна' : answer.clarity === 'unclear' ? 'Неясна' : '',
				isRatedItem(item) ? answer.relevance : '',
				expert.comments ? expert.comments.filter((c) => c.itemKey === item.key).map((c) => `${c.slot === 1 ? 'Администратор' : expert.name}: ${c.body}`).join('\n') : answer.comment
			]);
		}
	return lines.map((line) => line.map(csvCell).join(';')).join('\r\n') + '\r\n';
}
