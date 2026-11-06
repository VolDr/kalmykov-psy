import { createReviewDraftStore, draftAfterSend } from './review-comment-drafts';
import { SvelteSet } from 'svelte/reactivity';
import type { ExpertDiscussion } from '#lib/data/translation-expert.js';
import type { ReviewComment } from '#lib/data/translation-reconciliation.js';
import type { TranslationEntry } from '#lib/data/translation.js';

/** One discussion connection for the entire expert page, shared by all item threads. */
export function createExpertDiscussion(initial: ExpertDiscussion, baseUrl: string, keys: Set<string>, onEntries: (entries: Record<string, TranslationEntry>) => void) {
	let discussion = $state(initial);
	const drafts = $state<Record<string, string>>({});
	const sending = $state<Record<string, boolean>>({});
	const errors = $state<Record<string, string>>({});
	let pendingDelete = $state<ReviewComment | null>(null);
	let deleting = $state(false);
	let deleteError = $state('');
	let refreshError = $state('');
	let atRisk = $state(false);
	const ids: Record<string, string> = {};
	const failed = new SvelteSet<string>();
	const store = createReviewDraftStore(`translate-expert-draft:${initial.id}:${initial.slot}:`);
	let mutations = 0;
	let stopped = false;
	let etag = '';
	let pending: AbortController | undefined;
	function persist(key: string) {
		if (store.save(key, { text: drafts[key] ?? '', id: ids[key] }) || !drafts[key]?.trim()) failed.delete(key);
		else failed.add(key);
		atRisk = failed.size > 0;
	}
	function setDraft(key: string, value: string) {
		if (!keys.has(key)) return;
		drafts[key] = value;
		errors[key] = '';
		if (!value) delete ids[key];
		persist(key);
	}
	async function request(body: Record<string, string>) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 20_000);
		try {
			const response = await fetch(`${baseUrl}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal, keepalive: true });
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok) throw new Error(result?.error ?? (response.status === 404 ? 'Ссылка больше не действует' : 'Не удалось сохранить комментарий'));
			return result as { comment?: ReviewComment };
		} finally { clearTimeout(timeout); }
	}
	async function send(key: string) {
		const body = drafts[key]?.trim();
		if (!body || sending[key] || !keys.has(key)) return;
		const id = ids[key] ??= crypto.randomUUID();
		persist(key);
		sending[key] = true;
		errors[key] = '';
		mutations++;
		try {
			const { comment } = await request({ op: 'add', id, itemKey: key, body });
			if (!comment) throw new Error('Сервер не подтвердил комментарий');
			if (!discussion.comments.some((entry) => entry.id === comment.id)) discussion.comments = [...discussion.comments, comment];
			delete ids[key];
			if (comment.body !== body) errors[key] = 'Предыдущий текст уже сохранён. Отправьте исправленный текст отдельным комментарием.';
			else drafts[key] = draftAfterSend(body, drafts[key] ?? '', store.load(key)?.text ?? '');
			persist(key);
		} catch (error) {
			errors[key] = `${error instanceof Error ? error.message : 'Ошибка отправки'}. Черновик оставлен, попробуйте ещё раз.`;
		} finally { sending[key] = false; mutations++; }
	}
	async function confirmDelete() {
		const comment = pendingDelete;
		if (!comment || deleting || comment.slot !== discussion.slot) return;
		deleting = true;
		deleteError = '';
		mutations++;
		try {
			await request({ op: 'delete', id: comment.id });
			discussion.comments = discussion.comments.filter((entry) => entry.id !== comment.id);
			pendingDelete = null;
		} catch (error) { deleteError = error instanceof Error ? error.message : 'Ошибка удаления'; }
		finally { deleting = false; mutations++; }
	}
	async function refresh() {
		if (stopped || pending || document.visibilityState === 'hidden') return;
		const controller = new AbortController();
		pending = controller;
		const generation = mutations;
		const timeout = setTimeout(() => controller.abort(), 15_000);
		try {
			const response = await fetch(`${baseUrl}/state`, { headers: etag ? { 'If-None-Match': etag } : {}, signal: controller.signal, cache: 'no-store' });
			if (response.status === 304) { refreshError = ''; return; }
			if (!response.ok) throw new Error('refresh');
			const state: { discussion: ExpertDiscussion; entries: Record<string, TranslationEntry> } = await response.json();
			if (stopped) return;
			onEntries(state.entries);
			if (generation === mutations) { discussion = state.discussion; etag = response.headers.get('etag') ?? ''; }
			else etag = '';
			refreshError = '';
		} catch { if (!stopped) refreshError = 'Не удалось обновить обсуждение. Повторим автоматически.'; }
		finally { clearTimeout(timeout); pending = undefined; }
	}
	function mount() {
		stopped = false;
		for (const [key, draft] of Object.entries(store.loadAll() ?? {})) {
			if (!keys.has(key)) continue;
			drafts[key] = draft.text;
			if (draft.id) ids[key] = draft.id;
		}
		function storage(event: StorageEvent) {
			const change = store.fromEvent(event);
			if (!change || !keys.has(change.itemKey) || sending[change.itemKey]) return;
			drafts[change.itemKey] = change.draft?.text ?? '';
			if (change.draft?.id) ids[change.itemKey] = change.draft.id;
			else delete ids[change.itemKey];
			failed.delete(change.itemKey);
			atRisk = failed.size > 0;
		}
		const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
		window.addEventListener('storage', storage);
		window.addEventListener('online', refresh);
		document.addEventListener('visibilitychange', visible);
		void refresh();
		const interval = setInterval(() => void refresh(), 8_000);
		return () => {
			stopped = true; pending?.abort(); clearInterval(interval);
			window.removeEventListener('storage', storage);
			window.removeEventListener('online', refresh);
			document.removeEventListener('visibilitychange', visible);
		};
	}
	return {
		get comments() { return discussion.comments; }, get profiles() { return discussion.profiles; }, get slot() { return discussion.slot; },
		drafts, sending, errors, setDraft, send, mount, refresh,
		get atRisk() { return atRisk; }, get refreshError() { return refreshError; },
		get pendingDelete() { return pendingDelete; }, get deleting() { return deleting; }, get deleteError() { return deleteError; },
		askDelete(comment: ReviewComment) { if (comment.slot === discussion.slot) { pendingDelete = comment; deleteError = ''; } },
		cancelDelete() { if (!deleting) { pendingDelete = null; deleteError = ''; } }, confirmDelete
	};
}
