<script lang="ts">
	import { beforeNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import { SvelteSet, SvelteURL } from 'svelte/reactivity';
	import { createTranslationSaver } from '#lib/client/translation-saver.svelte.js';
	import {
		createReviewDraftStore,
		draftAfterSend,
		latestLegacyComments,
		type ReviewCommentDraft
	} from '#lib/client/review-comment-drafts.js';
	import {
		emptyTranslationEntry,
		type TranslationEntry,
		type TranslationField,
		type TranslationItem
	} from '#lib/data/translation.js';
	import type {
		ReconciliationParticipant,
		ReviewComment,
		ReviewerReconciliation
	} from '#lib/data/translation-reconciliation.js';
	import { reviewChoiceLabel } from '#lib/data/translation-review-order.js';
	import { groupReviewItems, reviewConstructFor } from '#lib/data/translation-review-groups.js';
	import ReconciliationItem from './ReconciliationItem.svelte';
	import TranslationNavigator from './TranslationNavigator.svelte';
	import ReviewScaleIntro from './ReviewScaleIntro.svelte';
	import ReviewCommentThread from './ReviewCommentThread.svelte';
	import ReviewCommentDeleteDialog from './ReviewCommentDeleteDialog.svelte';
	let {
		data,
		review,
		token
	}: {
		data: { title: string; items: TranslationItem[]; entries: Record<string, TranslationEntry> };
		review: ReviewerReconciliation;
		token: string;
	} = $props();
	let entries = $state<Record<string, TranslationEntry>>(untrack(() => ({ ...data.entries })));
	let remote = $state<ReconciliationParticipant[]>(untrack(() => review.participants));
	let comments = $state<ReviewComment[]>(untrack(() => review.comments));
	let current = $state(0);
	let refreshError = $state('');
	const participants = $derived(
		remote.map((p) => (p.slot === review.slot ? { ...p, entries } : p))
	);
	const profiles = $derived(Object.fromEntries(remote.map((p) => [p.slot, p.profile])));
	// Пункты идут по шкалам опросника; номер на странице — позиция в этом порядке.
	const sections = $derived.by(() => {
		let start = 0;
		let number = 0;
		return groupReviewItems(data.items).map((group) => {
			const section = { ...group, start, number: group.scale ? ++number : 0 };
			start += group.items.length;
			return section;
		});
	});
	const construct = $derived(reviewConstructFor(sections));
	const navItems = $derived(
		sections.flatMap(({ scale, items }) =>
			items.map(({ item }) => (scale ? { ...item, group: scale.title } : item))
		)
	);
	const doneCount = $derived(data.items.filter((item) => entries[item.key]?.translation).length);
	const baseUrl = untrack(() => page.url.pathname.replace(/\/$/, ''));
	const saver = untrack(() =>
		createTranslationSaver(`${baseUrl}/save`, `translate-unsynced:${token}`, data.entries)
	);
	let controller: AbortController | undefined;
	let etag = '';
	let stopped = false;

	// --- Комментарии ---
	const threads = $derived.by(() => {
		const result: Record<string, ReviewComment[]> = {};
		for (const comment of comments) (result[comment.itemKey] ??= []).push(comment);
		return result;
	});
	let drafts = $state<Record<string, string>>({});
	let sending = $state<Record<string, boolean>>({});
	let commentErrors = $state<Record<string, string>>({});
	// Один идентификатор на черновик: повтор после обрыва связи не создаст дубль
	const draftIds: Record<string, string> = {};
	// Черновики комментариев вместе с идентификаторами живут в localStorage, по ключу
	// на пункт: закрытая вкладка не теряет текст, вкладки не затирают черновики друг
	// друга, а правка пункта в другой вкладке приходит событием storage.
	const draftStore = untrack(() =>
		createReviewDraftStore(`translate-review-draft:${review.id}:${review.slot}:`)
	);
	const threadKeys = untrack(() => new Set(data.items.map((item) => item.key)));
	// Пункты, чей непустой черновик браузер не дал сохранить. Учёт по пунктам:
	// успешная запись одного пункта не отменяет риск потерять другой.
	const unstoredDrafts = new SvelteSet<string>();
	function persistDraft(itemKey: string) {
		const text = drafts[itemKey] ?? '';
		const saved = draftStore.save(itemKey, { text, id: draftIds[itemKey] });
		if (saved || !text.trim()) unstoredDrafts.delete(itemKey);
		else unstoredDrafts.add(itemKey);
	}
	function applyStoredDraft(itemKey: string, draft: ReviewCommentDraft | null) {
		// Идущую отправку не трогаем: её результат сам обновит черновик
		if (!threadKeys.has(itemKey) || sending[itemKey]) return;
		drafts[itemKey] = draft?.text ?? '';
		commentErrors[itemKey] = '';
		if (draft?.id) draftIds[itemKey] = draft.id;
		else delete draftIds[itemKey];
		// Текст пришёл из хранилища, значит он там есть
		unstoredDrafts.delete(itemKey);
	}
	function loadDrafts() {
		for (const [itemKey, draft] of Object.entries(draftStore.loadAll() ?? {}))
			applyStoredDraft(itemKey, draft);
	}
	function onstorage(event: StorageEvent) {
		const change = draftStore.fromEvent(event);
		if (change) applyStoredDraft(change.itemKey, change.draft);
	}
	// Изменения комментариев во время запроса /state: его ответ может быть устаревшим
	let commentMutations = 0;
	let pendingDelete = $state<ReviewComment | null>(null);
	let deleting = $state(false);
	let deleteError = $state('');
	const hasDrafts = $derived(Object.values(drafts).some((value) => value.trim()));
	// Черновик комментария под угрозой, только если браузер не дал его сохранить
	const draftsAtRisk = $derived(unstoredDrafts.size > 0);

	// «Новые» — комментарии второго участника, которые этот браузер ещё не показывал.
	// Пункт считается просмотренным, когда участник уходит с него дальше.
	const seenKey = untrack(() => `translate-review-seen:${review.id}:${review.slot}`);
	const seen = new SvelteSet<string>();
	let seenLoaded = $state(false);
	const unseen = $derived(
		new Set(
			seenLoaded
				? comments.filter((c) => c.slot !== review.slot && !seen.has(c.id)).map((c) => c.id)
				: []
		)
	);
	const newCommentFlags = $derived(
		Object.fromEntries(comments.filter((c) => unseen.has(c.id)).map((c) => [c.itemKey, true]))
	);
	let viewedKey: string | undefined;

	function markSeen(itemKey: string | undefined) {
		if (!itemKey || !seenLoaded) return;
		let changed = false;
		for (const comment of threads[itemKey] ?? [])
			if (comment.slot !== review.slot && !seen.has(comment.id)) {
				seen.add(comment.id);
				changed = true;
			}
		if (!changed) return;
		try {
			localStorage.setItem(seenKey, JSON.stringify([...seen]));
		} catch {
			/* Без localStorage отметки живут до закрытия вкладки. */
		}
	}
	$effect(() => {
		const key = navItems[current]?.key;
		if (key === viewedKey) return;
		untrack(() => markSeen(viewedKey));
		viewedKey = key;
	});

	async function commentRequest(body: Record<string, string>) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 20_000);
		try {
			const response = await fetch(`${baseUrl}/comments`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				signal: controller.signal
			});
			const result = await response.json().catch(() => null);
			if (response.status === 404) throw new Error('Ссылка больше не действует');
			if (!response.ok || !result?.ok)
				throw new Error(result?.error ?? `Ошибка сервера (${response.status})`);
			return result as { ok: true; comment?: ReviewComment };
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError')
				throw new Error('Сервер не ответил за 20 секунд', { cause: error });
			if (error instanceof TypeError) throw new Error('Нет связи с сервером', { cause: error });
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}
	function setDraft(itemKey: string, value: string) {
		drafts[itemKey] = value;
		commentErrors[itemKey] = '';
		if (!value) delete draftIds[itemKey];
		persistDraft(itemKey);
	}
	async function sendComment(itemKey: string) {
		const body = drafts[itemKey]?.trim();
		if (!body || sending[itemKey]) return;
		const id = (draftIds[itemKey] ??= crypto.randomUUID());
		persistDraft(itemKey);
		sending[itemKey] = true;
		commentErrors[itemKey] = '';
		commentMutations++;
		try {
			const { comment } = await commentRequest({ op: 'add', id, itemKey, body });
			if (comment && !comments.some((c) => c.id === comment.id)) comments = [...comments, comment];
			delete draftIds[itemKey];
			if (comment && comment.body !== body) {
				// Прошлая попытка дошла до сервера, а потом текст исправили: исправление
				// не теряем и предлагаем отправить его отдельным комментарием
				commentErrors[itemKey] =
					'Предыдущий вариант уже был сохранён. Отправьте ещё раз, чтобы добавить исправленный текст.';
			} else {
				// Пока шла отправка, текст могли дописать здесь или в другой вкладке
				// (её правки этой вкладкой на время отправки не применяются). Такой текст
				// остаётся новым черновиком, а не стирается вместе с отправленным.
				drafts[itemKey] = draftAfterSend(
					body,
					drafts[itemKey] ?? '',
					draftStore.load(itemKey)?.text ?? ''
				);
			}
			persistDraft(itemKey);
		} catch (error) {
			commentErrors[itemKey] = `${(error as Error).message}. Текст не потерян, попробуйте ещё раз.`;
		} finally {
			sending[itemKey] = false;
			// Ответ /state, пересёкшийся с отправкой, мог её не застать
			commentMutations++;
		}
	}
	async function confirmDelete() {
		const comment = pendingDelete;
		if (!comment || deleting) return;
		deleting = true;
		deleteError = '';
		commentMutations++;
		try {
			await commentRequest({ op: 'delete', id: comment.id });
			comments = comments.filter((c) => c.id !== comment.id);
			pendingDelete = null;
		} catch (error) {
			deleteError = (error as Error).message;
		} finally {
			deleting = false;
			// Иначе пересёкшийся ответ /state вернул бы удалённый комментарий
			commentMutations++;
		}
	}
	function cancelDelete() {
		pendingDelete = null;
		deleteError = '';
	}

	function apply(changes: { key: string; field: TranslationField; value: string }[]) {
		for (const { key, field, value } of changes)
			entries[key] = { ...(entries[key] ?? emptyTranslationEntry()), [field]: value };
	}
	function change(key: string, field: TranslationField, value: string) {
		apply([{ key, field, value }]);
		saver.queue(key, field, value);
	}
	function resolveConflict(id: string, choice: 'local' | 'server') {
		const change = saver.resolveConflict(id, choice);
		if (change) apply([change]);
	}
	async function refresh() {
		if (stopped || controller || document.visibilityState === 'hidden' || saver.linkGone) return;
		const pending = new AbortController();
		controller = pending;
		const mutationsAtStart = commentMutations;
		const timeout = setTimeout(() => pending.abort(), 15_000);
		try {
			const response = await fetch(`${baseUrl}/state`, {
				headers: etag ? { 'If-None-Match': etag } : {},
				signal: pending.signal,
				cache: 'no-store'
			});
			if (response.status === 304) {
				refreshError = '';
				return;
			}
			if (!response.ok) throw new Error('refresh failed');
			const state: { participants: ReconciliationParticipant[]; comments: ReviewComment[] } =
				await response.json();
			if (stopped) return;
			remote = state.participants;
			const own = state.participants.find((p) => p.slot === review.slot);
			if (own) apply(saver.synchronizeEntries(own.entries));
			// Ответ, начатый до своей отправки или удаления, не должен её откатить
			if (mutationsAtStart === commentMutations) {
				comments = state.comments;
				etag = response.headers.get('etag') ?? '';
			} else etag = '';
			refreshError = '';
		} catch {
			if (!stopped)
				refreshError = 'Не удалось обновить ответы второго участника. Повторим автоматически.';
		} finally {
			clearTimeout(timeout);
			controller = undefined;
		}
	}
	function go(index: number, focus = false) {
		if (index < 0 || index >= data.items.length) return;
		const section = document.getElementById(`review-item-${index + 1}`);
		section?.scrollIntoView({
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
			block: 'start'
		});
		if (focus)
			document.getElementById(`review-heading-${index + 1}`)?.focus({ preventScroll: true });
		const url = new SvelteURL(page.url.href);
		url.searchParams.delete('n');
		url.hash = `review-item-${index + 1}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, page.state);
	}
	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
		// В поле комментария Ctrl+Enter отправляет его, а не листает пункты
		if (event.target instanceof Element && event.target.closest('[data-comment-composer]')) return;
		event.preventDefault();
		void saver.flush();
		go(current + (event.shiftKey ? -1 : 1), true);
	}
	function onbeforeunload(event: BeforeUnloadEvent) {
		if (saver.atRisk || draftsAtRisk) event.preventDefault();
	}
	beforeNavigate(({ cancel }) => {
		saver.flushOnLeave();
		if (saver.atRisk || draftsAtRisk) cancel();
	});
	onMount(() => {
		stopped = false;
		const keys = new Set(data.items.map((item) => item.key));
		loadDrafts();
		// Комментарий из старой версии страницы (прежнее поле) забираем из очереди
		// сохранения. Очередь идёт от старых правок к новым, поэтому побеждает
		// последняя; пустая последняя правка значит, что текст стёрли.
		const legacy: { key: string; field: string; value: string }[] = [];
		apply(
			saver.restore(
				(key) => keys.has(key),
				(change) => change.field === 'comment' && legacy.push(change) > 0
			)
		);
		for (const [key, value] of Object.entries(latestLegacyComments(legacy)))
			if (value.trim() && !drafts[key]?.trim()) {
				drafts[key] = value;
				persistDraft(key);
			}
		try {
			const stored: unknown = JSON.parse(localStorage.getItem(seenKey) ?? '[]');
			if (Array.isArray(stored)) for (const id of stored) if (typeof id === 'string') seen.add(id);
		} catch {
			/* Нет доступа к localStorage: все комментарии второго участника считаются новыми. */
		}
		seenLoaded = true;
		let frame = 0;
		function trackScroll() {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				let active = 0;
				for (let index = 0; index < data.items.length; index++) {
					if (
						(document.getElementById(`review-item-${index + 1}`)?.getBoundingClientRect().top ??
							Infinity) <= 128
					)
						active = index;
				}
				if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
					active = data.items.length - 1;
				current = active;
			});
		}
		function deepLink() {
			const hash = /^#review-item-(\d+)$/.exec(location.hash);
			const index = Number(hash?.[1] ?? new URL(location.href).searchParams.get('n')) - 1;
			if (Number.isInteger(index) && index >= 0 && index < data.items.length)
				document.getElementById(`review-item-${index + 1}`)?.scrollIntoView();
			trackScroll();
		}
		window.addEventListener('scroll', trackScroll, { passive: true });
		window.addEventListener('resize', trackScroll);
		window.addEventListener('hashchange', deepLink);
		const resizeObserver = new ResizeObserver(trackScroll);
		resizeObserver.observe(document.body);
		deepLink();
		void refresh();
		const interval = setInterval(() => void refresh(), 8_000);
		return () => {
			stopped = true;
			controller?.abort();
			clearInterval(interval);
			cancelAnimationFrame(frame);
			resizeObserver.disconnect();
			window.removeEventListener('scroll', trackScroll);
			window.removeEventListener('resize', trackScroll);
			window.removeEventListener('hashchange', deepLink);
			saver.flushOnLeave();
			saver.dispose();
		};
	});
</script>

{#snippet jumpOptions(section: (typeof sections)[number])}
	{#each section.items as { item }, itemIndex (item.key)}<option value={section.start + itemIndex}
			>{item.label}</option
		>{/each}
{/snippet}

<svelte:head
	><title>{data.title}</title><meta name="robots" content="noindex, nofollow" /><meta
		name="referrer"
		content="no-referrer"
	/></svelte:head
>
<svelte:window
	{onkeydown}
	{onbeforeunload}
	{onstorage}
	ononline={() => {
		void saver.flush();
		void refresh();
	}}
	onpagehide={() => {
		saver.flushOnLeave();
		markSeen(viewedKey);
	}}
/>
<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') {
			void saver.flush();
			markSeen(viewedKey);
		} else void refresh();
	}}
/>

<div class="min-h-screen bg-background">
	<header class="bg-card">
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-8"
		>
			<h1 class="text-lg font-semibold text-navy">{data.title}</h1>
			<div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
				<p>Выбрано {doneCount} из {data.items.length}</p>
				<p role="status">
					{saver.status === 'error'
						? 'Есть несохранённые изменения'
						: saver.status !== 'saved'
							? 'Сохраняем…'
							: hasDrafts
								? 'Есть неотправленный комментарий'
								: 'Все изменения сохранены'}
				</p>
			</div>
		</div>
	</header>
	<div class="sticky top-0 z-10 bg-background/95 px-4 py-3 shadow-sm lg:hidden">
		<label for="review-jump" class="mr-3 text-sm">Перейти к пункту</label>
		<select
			id="review-jump"
			value={current}
			onchange={(event) => go(Number(event.currentTarget.value), true)}
			class="max-w-full rounded-md border-0 bg-card p-2 text-sm"
		>
			{#each sections as section, sectionIndex (section.scale?.id ?? `general-${sectionIndex}`)}
				{#if section.scale}
					<optgroup label={section.scale.title}>{@render jumpOptions(section)}</optgroup>
				{:else}
					{@render jumpOptions(section)}
				{/if}
			{/each}
		</select>
	</div>
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
		<main class="min-w-0">
			{#if saver.status === 'error'}
				<div
					class="sticky top-20 z-10 mb-6 rounded-xl border border-destructive/30 bg-background p-4 text-sm"
					role="alert"
				>
					<p>
						{saver.error || 'Не удалось сохранить изменения.'}
						{saver.storedLocally
							? 'Черновики сохранены в этом браузере.'
							: 'Не закрывайте страницу: несохранённые правки есть только в памяти вкладки.'}
					</p>
					{#if saver.linkGone}<p>
							Ссылка больше не действует. Свяжитесь с тем, кто её прислал.
						</p>{/if}
				</div>
			{/if}
			{#each saver.conflicts as conflict (conflict.operationId)}
				<section class="mb-6 space-y-3 rounded-xl bg-card p-5" aria-label="Конфликт сохранения">
					<h2 class="font-semibold">
						{data.items.find((i) => i.key === conflict.key)?.label}: {conflict.field ===
						'translation'
							? 'выбор'
							: 'комментарий'} уже изменён в другой вкладке
					</h2>
					<p class="whitespace-pre-wrap">
						Сохранено: {conflict.field === 'translation'
							? reviewChoiceLabel(review.id, conflict.key, conflict.serverValue)
							: conflict.serverValue || '(пусто)'}
					</p>
					<p class="whitespace-pre-wrap">
						Ваш черновик: {conflict.field === 'translation'
							? reviewChoiceLabel(review.id, conflict.key, conflict.localValue)
							: conflict.localValue || '(пусто)'}
					</p>
					<div class="flex flex-wrap gap-3">
						<button
							type="button"
							onclick={() => resolveConflict(conflict.operationId, 'server')}
							class="min-h-11 rounded-lg bg-background px-3 text-sm">Оставить сохранённый</button
						>
						<button
							type="button"
							onclick={() => resolveConflict(conflict.operationId, 'local')}
							class="min-h-11 rounded-lg bg-background px-3 text-sm">Сохранить мой черновик</button
						>
					</div>
				</section>
			{/each}
			{#if refreshError}<p class="mb-6 text-sm text-muted-foreground" role="status">
					{refreshError}
				</p>{/if}
			{#if construct}
				<section
					class="mb-12 space-y-3 rounded-xl bg-card p-5 select-text"
					aria-labelledby="review-construct"
				>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Что измеряет опросник
					</p>
					<h2 id="review-construct" class="text-xl font-semibold text-navy">{construct.title}</h2>
					<p class="leading-relaxed text-foreground">{construct.text}</p>
				</section>
			{/if}
			<div class="space-y-16">
				{#each sections as section, sectionIndex (section.scale?.id ?? `general-${sectionIndex}`)}
					<div class="space-y-14">
						{#if section.scale}
							<ReviewScaleIntro
								scale={section.scale}
								number={section.number}
								id={`review-scale-${section.scale.id}`}
							/>
						{/if}
						{#each section.items as { item }, itemIndex (item.key)}
							{@const position = section.start + itemIndex + 1}
							<section id={`review-item-${position}`} class="scroll-mt-28">
								<ReconciliationItem
									{item}
									a={review.variantA[item.key]}
									b={review.variantB[item.key]}
									choice={entries[item.key]?.translation ?? ''}
									{participants}
									ownSlot={review.slot}
									roundId={review.id}
									{position}
									total={data.items.length}
									heading={section.scale ? 'h3' : 'h2'}
									onchange={(field, value) => change(item.key, field, value)}
								>
									{#snippet discussion()}
										<ReviewCommentThread
											id={`review-comment-${position}`}
											itemLabel={item.label}
											comments={threads[item.key] ?? []}
											{profiles}
											ownSlot={review.slot}
											{unseen}
											draft={drafts[item.key] ?? ''}
											sending={sending[item.key] ?? false}
											error={commentErrors[item.key] ?? ''}
											ondraft={(value) => setDraft(item.key, value)}
											onsend={() => void sendComment(item.key)}
											ondelete={(comment) => (pendingDelete = comment)}
										/>
									{/snippet}
								</ReconciliationItem>
							</section>
						{/each}
					</div>
				{/each}
			</div>
		</main>
		<aside
			class="hidden max-h-[calc(100dvh-3rem)] overflow-y-auto lg:sticky lg:top-6 lg:block lg:self-start"
		>
			<TranslationNavigator
				items={navItems}
				{entries}
				{current}
				hasGuide={false}
				reviewMode
				continuous
				flags={newCommentFlags}
				flagLabel="новые комментарии"
				onselect={(index) => go(index, true)}
			/>
		</aside>
	</div>
</div>

<ReviewCommentDeleteDialog
	comment={pendingDelete}
	{deleting}
	error={deleteError}
	onconfirm={() => void confirmDelete()}
	oncancel={cancelDelete}
/>
