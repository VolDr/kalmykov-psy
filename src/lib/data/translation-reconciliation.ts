import { TRANSLATION_MAX_LENGTH, type TranslationEntry, type TranslationItem } from './translation';

export interface ReconciliationProfile {
	name: string;
	avatar: string;
}
export type TranslationVariant = Record<string, string>;
export interface ReconciliationParticipant {
	slot: number;
	profile: ReconciliationProfile;
	entries: Record<string, TranslationEntry>;
}
/** Комментарий участника к пункту. Время добавления задаёт порядок, но не показывается. */
export interface ReviewComment {
	id: string;
	slot: number;
	itemKey: string;
	body: string;
}
export type ReviewCommentRequest =
	| { op: 'add'; id: string; itemKey: string; body: string }
	| { op: 'delete'; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function parseReviewCommentRequest(
	raw: unknown,
	itemKeys: Set<string>
): { ok: true; request: ReviewCommentRequest } | { ok: false; error: string } {
	if (!raw || typeof raw !== 'object') return { ok: false, error: 'Некорректный запрос' };
	const { op, id, itemKey, body } = raw as Record<string, unknown>;
	if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, error: 'Некорректный запрос' };
	if (op === 'delete') return { ok: true, request: { op, id } };
	if (op !== 'add') return { ok: false, error: 'Некорректный запрос' };
	if (typeof itemKey !== 'string' || !itemKeys.has(itemKey))
		return { ok: false, error: 'Пункт не найден' };
	if (typeof body !== 'string' || !body.trim()) return { ok: false, error: 'Напишите комментарий' };
	if (body.length > TRANSLATION_MAX_LENGTH)
		return { ok: false, error: `Комментарий длиннее ${TRANSLATION_MAX_LENGTH} символов` };
	return { ok: true, request: { op, id, itemKey, body: body.trim() } };
}

/** Тексты комментариев участника к пункту в порядке добавления. */
export const commentsOf = (comments: ReviewComment[], slot: number, itemKey: string) =>
	comments.filter((c) => c.slot === slot && c.itemKey === itemKey).map((c) => c.body);

export interface ReviewerReconciliation {
	id: number;
	title: string;
	variantA: TranslationVariant;
	variantB: TranslationVariant;
	profile: ReconciliationProfile;
	slot: number;
	participants: ReconciliationParticipant[];
	comments: ReviewComment[];
}
export interface AdminReconciliation {
	id: number;
	title: string;
	finalDocId: number;
	items: TranslationItem[];
	variantA: TranslationVariant;
	variantB: TranslationVariant;
	participants: {
		slot: number;
		docId: number;
		token: string;
		profile: ReconciliationProfile;
		entries: Record<string, TranslationEntry>;
	}[];
	finalEntries: Record<string, TranslationEntry>;
	comments: ReviewComment[];
}
export const isReviewChoice = (value: string) => value === '' || value === 'a' || value === 'b';
export const choiceLabel = (value: string) =>
	value === 'a' ? 'Вариант 1' : value === 'b' ? 'Вариант 2' : 'Не выбран';

export const escapeMarkdownCell = (text: string) => text
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
const decodeMarkdownCell = (text: string) => text.replace(/<br\s*\/?>/gi, '\n')
	.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

export function validateVariant(raw: unknown, items: TranslationItem[]): TranslationVariant {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw))
		throw new Error('Ожидается перевод с ключами пунктов');
	const entries = Object.entries(raw);
	const keys = new Set(items.map((item) => item.key));
	for (const [key, value] of entries) {
		if (!keys.has(key)) throw new Error(`Неизвестный пункт: ${key}`);
		if (typeof value !== 'string' || !value.trim() || value.length > TRANSLATION_MAX_LENGTH)
			throw new Error(`Пункт ${key}: нужен непустой перевод до ${TRANSLATION_MAX_LENGTH} символов`);
	}
	const missing = items.filter((item) => !Object.hasOwn(raw, item.key)).map((item) => item.label);
	if (missing.length) throw new Error(`Не хватает переводов: ${missing.join(', ')}`);
	return Object.fromEntries(entries) as TranslationVariant;
}

/** Формат приложенного опросника: вводный абзац, шкала «Балл | Ответ» и
 * таблица «№ | Утверждение». Номера сопоставляются по ключу, а не по порядку. */
export function parseSecondTranslation(text: string, items: TranslationItem[]): TranslationVariant {
	if (new Blob([text]).size > 512_000) throw new Error('Файл перевода больше 500 КБ');
	const trimmed = text.replace(/^\uFEFF/, '').trim();
	if (trimmed.startsWith('{')) {
		try {
			return validateVariant(JSON.parse(trimmed), items);
		} catch (error) {
			if (error instanceof SyntaxError) throw new Error('Некорректный JSON');
			throw error;
		}
	}
	const result: TranslationVariant = Object.create(null);
	const paragraphs: string[] = [];
	let table: 'items' | 'options' | 'keyed' | 'comments' | null = null;
	let seenTable = false;
	let paragraph: string[] = [];
	const finishParagraph = () => {
		if (paragraph.length) paragraphs.push(paragraph.join('\n'));
		paragraph = [];
	};
	for (const line of trimmed.split(/\r?\n/)) {
		const value = line.trim();
		if (/^#{1,6}\s+Комментарии согласования\s*$/i.test(value)) {
			finishParagraph(); table = 'comments'; seenTable = true; continue;
		}
		if (value.startsWith('|')) {
			finishParagraph();
			seenTable = true;
			const cells = value
				.replace(/^\|/, '')
				.replace(/\|$/, '')
				.split(/(?<!\\)\|/)
				.map((cell) => cell.trim().replace(/\\\|/g, '|'));
			if (table === 'comments') {
				if (cells.length !== 4) throw new Error('В таблице комментариев должны быть четыре колонки');
				continue;
			}
			if (cells.length !== 2) throw new Error('В таблице должны быть две колонки');
			if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
			if (/^(ключ|key)$/i.test(cells[0]) && /^(перевод|translation)$/i.test(cells[1])) {
				table = 'keyed'; continue;
			}
			if (/^(№|номер|key)$/i.test(cells[0])) {
				table = 'items';
				continue;
			}
			if (/^(балл|score)$/i.test(cells[0])) {
				table = 'options';
				continue;
			}
			if (!table || (table !== 'keyed' && !/^\d+$/.test(cells[0])))
				throw new Error(`Не удалось разобрать строку: ${value}`);
			const key = table === 'keyed' ? cells[0] : table === 'options' ? `option${Number(cells[0])}` : String(Number(cells[0]));
			if (Object.hasOwn(result, key)) throw new Error(`Пункт ${key} встречается дважды`);
			result[key] = decodeMarkdownCell(cells[1]);
		} else if (!seenTable && value && !/^#{1,6}\s/.test(value)) paragraph.push(line.trim());
		else if (!value || /^#{1,6}\s/.test(value)) finishParagraph();
		else if (seenTable) throw new Error('Текст после таблицы не импортирован. Перенесите его в нужный пункт или в таблицу «Комментарии согласования».');
	}
	finishParagraph();
	if (paragraphs.length) result.instruction = paragraphs.join('\n\n');
	return validateVariant(result, items);
}

export function reconciliationText(
	key: string,
	a: TranslationVariant,
	b: TranslationVariant,
	first: Record<string, TranslationEntry>,
	second: Record<string, TranslationEntry>,
	final: Record<string, TranslationEntry>
): { text: string; status: 'manual' | 'agreed' | 'disagreed' | 'pending' } {
	if (final[key]?.translation.trim()) return { text: final[key].translation, status: 'manual' };
	const one = first[key]?.translation ?? '';
	const two = second[key]?.translation ?? '';
	if (!one || !two) return { text: '', status: 'pending' };
	if (one !== two && a[key] !== b[key]) return { text: '', status: 'disagreed' };
	return { text: one === 'a' ? a[key] : b[key], status: 'agreed' };
}
