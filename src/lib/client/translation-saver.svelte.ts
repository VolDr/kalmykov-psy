import {
	TRANSLATION_BATCH_BYTES,
	TRANSLATION_MAX_CHANGES,
	emptyTranslationEntry,
	type TranslationChange,
	type TranslationEntry,
	type TranslationField,
	type TranslationSaveResult
} from '#lib/data/translation.js';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';
export const TRANSLATION_TIMEOUT_MS = 20_000;
const RETRY_MS = 5000;
const MAX_WAIT_MS = 10_000;
const idOf = (change: Pick<TranslationChange, 'key' | 'field'>) =>
	`${change.key}\u0000${change.field}`;
const bytes = (changes: TranslationChange[]) => new Blob([JSON.stringify({ changes })]).size;

interface Draft extends TranslationChange {
	createdAt: number;
	dependsOn?: string;
	blocked?: string;
	conflict?: { value: string; version: number };
}

export interface TranslationConflict {
	operationId: string;
	key: string;
	field: TranslationField;
	localValue: string;
	serverValue: string;
}

function isDraft(value: unknown): value is Draft {
	const c = value as Draft | null;
	return (
		typeof c?.key === 'string' &&
		(c.field === 'translation' || c.field === 'comment') &&
		typeof c.value === 'string' &&
		typeof c.operationId === 'string' &&
		Number.isSafeInteger(c.expectedVersion) &&
		c.expectedVersion >= -1 &&
		Number.isFinite(c.createdAt)
	);
}

/** Одна очередь для обычной работы и pagehide. Отдельные ключи storage не затирают
 * операции соседних вкладок. Копии удаляются после квитанции или выбора пользователя. */
export function createTranslationSaver(
	url: string,
	storageKey: string,
	initialEntries: Record<string, TranslationEntry> = {},
	delayMs = 1000
) {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const drafts = new Map<string, Draft>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const pending = new Map<string, Draft>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const versions = new Map<string, number>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const unpersisted = new Set<string>();
	// Старую резервную копию сохраняем, пока замена не записалась в браузер/на сервер.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const fallbackIds = new Map<string, string[]>();
	for (const [key, entry] of Object.entries(initialEntries)) {
		versions.set(idOf({ key, field: 'translation' }), entry.translationVersion);
		versions.set(idOf({ key, field: 'comment' }), entry.commentVersion);
	}
	const state = $state({
		status: 'saved' as SaveStatus,
		error: '',
		storedLocally: true,
		unsyncedCount: 0,
		linkGone: false,
		conflicts: [] as TranslationConflict[],
		paused: false
	});
	let timer: ReturnType<typeof setTimeout> | undefined;
	let active: Draft[] | null = null;
	let inFlight = false;
	let disposed = false;
	let firstQueuedAt = 0;
	let failures = 0;
	let batchLimit = TRANSLATION_MAX_CHANGES;
	const prefix = `${storageKey}:draft:`;

	function clearFallbacks(operationId: string) {
		for (const id of fallbackIds.get(operationId) ?? []) {
			try {
				localStorage.removeItem(prefix + id);
			} catch {
				/* Версия защитит старую копию. */
			}
		}
		fallbackIds.delete(operationId);
	}

	function refresh() {
		state.unsyncedCount = drafts.size;
		state.storedLocally = unpersisted.size === 0;
		state.conflicts = [...drafts.values()]
			.filter((draft) => draft.conflict)
			.map((draft) => ({
				operationId: draft.operationId,
				key: draft.key,
				field: draft.field,
				localValue: draft.value,
				serverValue: draft.conflict!.value
			}));
		state.paused = [...drafts.values()].some((draft) => draft.blocked);
	}

	function persist(draft: Draft) {
		try {
			localStorage.setItem(prefix + draft.operationId, JSON.stringify(draft));
			unpersisted.delete(draft.operationId);
			clearFallbacks(draft.operationId);
		} catch {
			unpersisted.add(draft.operationId);
		}
		refresh();
	}

	function remove(draft: Draft) {
		drafts.delete(draft.operationId);
		pending.delete(draft.operationId);
		unpersisted.delete(draft.operationId);
		clearFallbacks(draft.operationId);
		try {
			localStorage.removeItem(prefix + draft.operationId);
		} catch {
			/* Квитанция защитит повтор. */
		}
		refresh();
	}

	function schedule(ms: number) {
		clearTimeout(timer);
		if (!disposed) timer = setTimeout(() => void flush(), ms);
	}

	function queue(key: string, field: TranslationField, value: string) {
		if (disposed) return;
		const previous = [...drafts.values()].filter((d) => d.key === key && d.field === field).at(-1);
		const previousActive = previous && active?.some((d) => d.operationId === previous.operationId);
		const draft: Draft = {
			key,
			field,
			value,
			operationId: crypto.randomUUID(),
			createdAt: Date.now(),
			expectedVersion: previous?.expectedVersion ?? versions.get(idOf({ key, field })) ?? 0,
			dependsOn: previousActive ? previous.operationId : previous?.dependsOn,
			// При конфликте редактируем черновик, но отправляем лишь после выбора.
			...(previous?.conflict ? { conflict: previous.conflict, blocked: previous.blocked } : {})
		};
		drafts.set(draft.operationId, draft);
		persist(draft); // Сначала новая копия, затем удаление заменённой.
		if (previous && !previousActive) {
			if (!unpersisted.has(draft.operationId)) remove(previous);
			else {
				fallbackIds.set(draft.operationId, [
					previous.operationId,
					...(fallbackIds.get(previous.operationId) ?? [])
				]);
				fallbackIds.delete(previous.operationId);
				drafts.delete(previous.operationId);
				pending.delete(previous.operationId);
				unpersisted.delete(previous.operationId);
				refresh();
			}
		}
		if (!draft.blocked) pending.set(draft.operationId, draft);
		if (!firstQueuedAt) firstQueuedAt = Date.now();
		if (!inFlight && !state.paused) state.status = 'pending';
		schedule(Math.min(delayMs, Math.max(0, firstQueuedAt + MAX_WAIT_MS - Date.now())));
	}

	async function send(batch: Draft[]) {
		const changes = batch.map(({ key, field, value, expectedVersion, operationId }) => ({
			key,
			field,
			value,
			expectedVersion,
			operationId
		}));
		const body = JSON.stringify({ changes });
		const controller = new AbortController();
		let timeout: ReturnType<typeof setTimeout> | undefined;
		try {
			return await Promise.race([
				(async () => {
					const response = await fetch(url, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body,
						signal: controller.signal,
						keepalive: true
					});
					return { response, result: await response.json().catch(() => null) };
				})(),
				new Promise<never>((_, reject) => {
					timeout = setTimeout(() => {
						const error = new Error('Сервер не ответил за 20 секунд');
						reject(error);
						controller.abort(error);
					}, TRANSLATION_TIMEOUT_MS);
				})
			]);
		} finally {
			clearTimeout(timeout);
		}
	}

	function block(draft: Draft, message: string, conflict?: Draft['conflict']) {
		draft.blocked = message;
		draft.conflict = conflict;
		pending.delete(draft.operationId);
		persist(draft);
	}

	function rejectDraft(draft: Draft, message: string, conflict?: Draft['conflict']) {
		const children = [...drafts.values()].filter((d) => d.dependsOn === draft.operationId);
		if (!children.length) {
			block(draft, message, conflict);
			return;
		}
		for (const child of children) {
			delete child.dependsOn;
			if (conflict) block(child, message, conflict);
			else persist(child); // 400/413 гарантируют, что исходная версия не изменилась.
		}
		if (children.every((child) => !unpersisted.has(child.operationId))) remove(draft);
		else block(draft, message, conflict);
	}

	function accept(draft: Draft, result: TranslationSaveResult) {
		versions.set(idOf(draft), Math.max(versions.get(idOf(draft)) ?? 0, result.version));
		// Следующий набор получает принятую версию. Чужую последующую правку
		// это не перекрывает: следующая попытка получит 409.
		for (const child of drafts.values()) {
			if (child.dependsOn !== draft.operationId) continue;
			child.expectedVersion = result.version;
			delete child.dependsOn;
			persist(child);
		}
		remove(draft);
	}

	async function flush() {
		clearTimeout(timer);
		if (disposed || inFlight) return;
		if (!active) {
			const batch: Draft[] = [];
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- временный набор полей пачки
			const fields = new Set<string>();
			for (const draft of pending.values()) {
				if (
					draft.blocked ||
					(draft.dependsOn && drafts.has(draft.dependsOn)) ||
					fields.has(idOf(draft))
				)
					continue;
				const candidate = [...batch, draft];
				if (bytes(candidate) > TRANSLATION_BATCH_BYTES) {
					if (batch.length) break;
					block(draft, 'Правка слишком велика. Сократите текст.');
					continue;
				}
				batch.push(draft);
				fields.add(idOf(draft));
				if (batch.length >= batchLimit) break;
			}
			if (!batch.length) {
				state.status = drafts.size ? 'error' : 'saved';
				if (drafts.size)
					state.error =
						[...drafts.values()].find((d) => d.blocked)?.blocked ?? 'Выберите вариант перевода';
				return;
			}
			active = batch;
			for (const draft of batch) pending.delete(draft.operationId);
		}
		const batch = active;
		inFlight = true;
		state.status = 'saving';
		firstQueuedAt = 0;
		let retry = false;
		try {
			const { response, result } = await send(batch);
			if (response.status === 400 || response.status === 413) {
				if (response.status === 413 && batch.length > 1) {
					batchLimit = Math.max(1, Math.floor(batch.length / 2));
					for (const draft of batch) pending.set(draft.operationId, draft);
				} else {
					for (const draft of batch)
						rejectDraft(
							draft,
							result?.error ?? 'Сервер отклонил правку. Измените текст или обновите страницу.'
						);
				}
				active = null;
			} else {
				if (response.status === 404) {
					state.linkGone = true;
					throw new Error('Ссылка больше не действует');
				}
				if (!response.ok && response.status !== 409)
					throw new Error(result?.error ?? `Ошибка сервера (${response.status})`);
				const results: TranslationSaveResult[] = result?.results;
				if (
					!Array.isArray(results) ||
					results.length !== batch.length ||
					batch.some(
						(draft) =>
							results.filter(
								(r) =>
									r.operationId === draft.operationId &&
									r.key === draft.key &&
									r.field === draft.field &&
									(r.status === 'saved' || r.status === 'conflict') &&
									typeof r.value === 'string' &&
									Number.isSafeInteger(r.version) &&
									r.version >= 0
							).length !== 1
					)
				) {
					throw new Error('Сервер не подтвердил сохранение');
				}
				for (const draft of batch) {
					const receipt = results.find((r) => r.operationId === draft.operationId)!;
					if (receipt.status === 'saved') accept(draft, receipt);
					else
						rejectDraft(draft, 'Этот текст уже изменён. Выберите вариант.', {
							value: receipt.value,
							version: receipt.version
						});
				}
				active = null;
			}
			failures = 0;
			state.linkGone = false;
			state.error = '';
		} catch (error) {
			// Неоднозначный результат повторяем с теми же идентификаторами, даже
			// если пользователь уже набрал следующий текст.
			state.error = error instanceof TypeError ? 'Нет связи с сервером' : (error as Error).message;
			retry = true;
			failures++;
		} finally {
			inFlight = false;
		}
		refresh();
		if (state.paused && !state.error)
			state.error = [...drafts.values()].find((draft) => draft.blocked)?.blocked ?? '';
		state.status = retry || state.paused ? 'error' : drafts.size ? 'pending' : 'saved';
		if (retry) {
			if (!state.linkGone)
				schedule(
					Math.min(60_000, RETRY_MS * 2 ** Math.min(failures - 1, 4)) +
						Math.floor(Math.random() * 1000)
				);
		} else if (pending.size) schedule(0);
	}

	function restore(isKnownKey: (key: string) => boolean): TranslationChange[] {
		const restored: Draft[] = [];
		let legacyMigrated = false;
		try {
			const storageKeys = Array.from({ length: localStorage.length }, (_, i) =>
				localStorage.key(i)
			);
			for (const key of storageKeys) {
				if (!key?.startsWith(prefix)) continue;
				try {
					const draft: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
					if (isDraft(draft) && isKnownKey(draft.key)) restored.push(draft);
				} catch {
					/* Повреждённую запись оставляем для ручного восстановления. */
				}
			}
			// Старый формат не содержит исходной версии: требуется явное решение.
			const legacy: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
			legacyMigrated =
				Array.isArray(legacy) &&
				legacy.every(
					(value) =>
						typeof value?.key === 'string' &&
						isKnownKey(value.key) &&
						(value.field === 'translation' || value.field === 'comment') &&
						typeof value.value === 'string'
				);
			if (Array.isArray(legacy))
				for (const value of legacy) {
					if (
						typeof value?.key !== 'string' ||
						!isKnownKey(value.key) ||
						(value.field !== 'translation' && value.field !== 'comment') ||
						typeof value.value !== 'string'
					)
						continue;
					restored.push({
						key: value.key,
						field: value.field,
						value: value.value,
						expectedVersion: -1,
						operationId: crypto.randomUUID(),
						createdAt: Date.now(),
						blocked: 'Выберите вариант восстановленного текста'
					});
				}
		} catch {
			state.storedLocally = false;
		}
		restored.sort((a, b) => a.createdAt - b.createdAt);
		for (const draft of restored) {
			drafts.set(draft.operationId, draft);
			if (
				draft.conflict ||
				draft.expectedVersion < 0 ||
				(draft.dependsOn && !restored.some((d) => d.operationId === draft.dependsOn))
			) {
				const entry = initialEntries[draft.key] ?? emptyTranslationEntry();
				draft.blocked = 'Выберите вариант восстановленного текста';
				draft.conflict = {
					value: entry[draft.field],
					version: entry[draft.field === 'translation' ? 'translationVersion' : 'commentVersion']
				};
			}
			persist(draft);
			if (!draft.blocked) pending.set(draft.operationId, draft);
		}
		if (legacyMigrated && !unpersisted.size) {
			try {
				localStorage.removeItem(storageKey);
			} catch {
				/* Повтор безопасен. */
			}
		}
		refresh();
		if (restored.length) schedule(0);
		return restored;
	}

	function resolveConflict(operationId: string, choice: 'server' | 'local') {
		const draft = drafts.get(operationId);
		if (!draft?.conflict) return;
		const { value, version } = draft.conflict;
		versions.set(idOf(draft), version);
		const replacement: Draft = {
			key: draft.key,
			field: draft.field,
			value: draft.value,
			expectedVersion: version,
			operationId: crypto.randomUUID(),
			createdAt: Date.now()
		};
		const children = [...drafts.values()].filter((d) => d.dependsOn === operationId);
		if (children.length) replacement.value = children.at(-1)!.value;
		if (choice === 'local') {
			drafts.set(replacement.operationId, replacement);
			persist(replacement);
			pending.set(replacement.operationId, replacement);
		}
		for (const child of children) remove(child);
		remove(draft);
		state.error = '';
		schedule(0);
		return {
			key: draft.key,
			field: draft.field,
			value: choice === 'local' ? replacement.value : value
		};
	}

	return {
		get status() {
			return state.status;
		},
		get error() {
			return state.error;
		},
		get atRisk() {
			return state.unsyncedCount > 0 && !state.storedLocally;
		},
		get storedLocally() {
			return state.storedLocally;
		},
		get linkGone() {
			return state.linkGone;
		},
		get unsyncedCount() {
			return state.unsyncedCount;
		},
		get conflicts() {
			return state.conflicts;
		},
		get paused() {
			return state.paused;
		},
		queue,
		flush,
		restore,
		resolveConflict,
		flushOnLeave: () => {
			void flush();
		},
		dispose: () => {
			disposed = true;
			clearTimeout(timer);
		}
	};
}
