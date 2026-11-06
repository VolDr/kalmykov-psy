/** Черновик нового комментария к пункту согласования. */
export interface ReviewCommentDraft {
	text: string;
	/** Идентификатор будущего комментария: повтор отправки не создаёт дубль */
	id?: string;
}

/**
 * Черновики комментариев в localStorage, по ключу на пункт. Вкладки не
 * перезаписывают черновики друг друга, а событие storage сообщает об изменении
 * конкретного пункта в другой вкладке.
 */
export function createReviewDraftStore(
	prefix: string,
	storage: () => Storage = () => localStorage
) {
	function parse(raw: string | null): ReviewCommentDraft | null {
		if (!raw) return null;
		try {
			const value = JSON.parse(raw) as { text?: unknown; id?: unknown };
			if (typeof value?.text !== 'string' || !value.text.trim()) return null;
			return typeof value.id === 'string'
				? { text: value.text, id: value.id }
				: { text: value.text };
		} catch {
			return null;
		}
	}
	return {
		/** Сохраняет или удаляет черновик пункта. false — браузер не дал записать. */
		save(itemKey: string, draft: ReviewCommentDraft): boolean {
			try {
				if (draft.text.trim())
					storage().setItem(prefix + itemKey, JSON.stringify({ text: draft.text, id: draft.id }));
				else storage().removeItem(prefix + itemKey);
				return true;
			} catch {
				return false;
			}
		},
		/** Текущий сохранённый черновик пункта, в том числе записанный другой вкладкой. */
		load(itemKey: string): ReviewCommentDraft | null {
			try {
				return parse(storage().getItem(prefix + itemKey));
			} catch {
				return null;
			}
		},
		/** Все сохранённые черновики этой ссылки; null — хранилище недоступно. */
		loadAll(): Record<string, ReviewCommentDraft> | null {
			const result: Record<string, ReviewCommentDraft> = {};
			try {
				const store = storage();
				for (let index = 0; index < store.length; index++) {
					const key = store.key(index);
					if (!key?.startsWith(prefix)) continue;
					const draft = parse(store.getItem(key));
					if (draft) result[key.slice(prefix.length)] = draft;
				}
				return result;
			} catch {
				return null;
			}
		},
		/** Изменение из другой вкладки: пункт и его новый черновик (null — удалён). */
		fromEvent(event: Pick<StorageEvent, 'key' | 'newValue'>) {
			if (!event.key?.startsWith(prefix)) return null;
			return { itemKey: event.key.slice(prefix.length), draft: parse(event.newValue) };
		}
	};
}

/**
 * Последний текст каждого комментария из очереди старой версии страницы.
 * Очередь упорядочена от старых правок к новым; пустая последняя правка
 * означает, что текст стёрли, и черновика нет.
 */
export function latestLegacyComments(
	changes: { key: string; field: string; value: string }[]
): Record<string, string> {
	const latest: Record<string, string> = {};
	for (const { key, field, value } of changes) if (field === 'comment') latest[key] = value;
	for (const key of Object.keys(latest)) if (!latest[key].trim()) delete latest[key];
	return latest;
}

/**
 * Что остаётся черновиком после успешной отправки `sent`. Пока запрос шёл, текст
 * могли дописать в этой вкладке (`local`) или в другой (`stored`): такой текст
 * сохраняется, а совпадающий с отправленным стирается.
 */
export function draftAfterSend(sent: string, local: string, stored: string): string {
	if (local.trim() !== sent) return local;
	if (stored.trim() && stored.trim() !== sent) return stored;
	return '';
}
