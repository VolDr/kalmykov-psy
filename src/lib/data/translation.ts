/** Пункт документа для перевода (оригинал хранится в translation_docs.items). */
export interface TranslationItem {
	key: string;
	/** Полная подпись: «Пункт 5», «Инструкция», «Вариант ответа 2» */
	label: string;
	/** Короткая подпись для навигатора: «5», «И», «О2» */
	short: string;
	/** Заголовок группы в навигаторе */
	group: string;
	source: string;
}

export type TranslationField = 'translation' | 'comment';

export interface TranslationEntry {
	translation: string;
	comment: string;
	translationVersion: number;
	commentVersion: number;
}

export interface TranslationChange {
	key: string;
	field: TranslationField;
	value: string;
	expectedVersion: number;
	operationId: string;
}

export interface TranslationSaveResult {
	key: string;
	field: TranslationField;
	operationId: string;
	status: 'saved' | 'conflict';
	value: string;
	version: number;
}

export const emptyTranslationEntry = (): TranslationEntry => ({
	translation: '',
	comment: '',
	translationVersion: 0,
	commentVersion: 0
});

export const TRANSLATION_MAX_LENGTH = 5000;
/** Правок в одном запросе; клиент шлёт больше — частями. */
export const TRANSLATION_MAX_CHANGES = 10;
// Ниже общего keepalive-бюджета браузера и серверного лимита 128 КиБ.
export const TRANSLATION_BATCH_BYTES = 48_000;

/** Проверяет тело запроса автосохранения; ключи сверяются с пунктами документа. */
export function parseTranslationChanges(
	raw: unknown,
	itemKeys: ReadonlySet<string>
): { ok: true; changes: TranslationChange[] } | { ok: false; error: string } {
	const list = (raw as { changes?: unknown } | null)?.changes;
	if (!Array.isArray(list) || list.length === 0 || list.length > TRANSLATION_MAX_CHANGES) {
		return { ok: false, error: 'Некорректный запрос' };
	}
	const changes: TranslationChange[] = [];
	const fields = new Set<string>();
	const operations = new Set<string>();
	for (const item of list) {
		const { key, field, value, expectedVersion, operationId } = (item ?? {}) as Record<
			string,
			unknown
		>;
		if (typeof key !== 'string' || !itemKeys.has(key)) {
			return { ok: false, error: 'Неизвестный пункт' };
		}
		if (field !== 'translation' && field !== 'comment') {
			return { ok: false, error: 'Неизвестное поле' };
		}
		if (typeof value !== 'string' || value.length > TRANSLATION_MAX_LENGTH) {
			return { ok: false, error: `Текст длиннее ${TRANSLATION_MAX_LENGTH} символов` };
		}
		if (
			typeof expectedVersion !== 'number' ||
			!Number.isSafeInteger(expectedVersion) ||
			expectedVersion < 0 ||
			typeof operationId !== 'string' ||
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId)
		) {
			return { ok: false, error: 'Обновите страницу: версия правки не указана' };
		}
		const id = `${key}\u0000${field}`;
		if (fields.has(id) || operations.has(operationId))
			return { ok: false, error: 'Повторяющиеся правки' };
		fields.add(id);
		operations.add(operationId);
		changes.push({ key, field, value, expectedVersion, operationId });
	}
	return { ok: true, changes };
}
