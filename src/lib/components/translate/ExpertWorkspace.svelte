<script lang="ts">
	import { beforeNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';
	import { createTranslationSaver } from '#lib/client/translation-saver.svelte.js';
	import { createExpertDiscussion } from '#lib/client/expert-discussion.svelte.js';
	import MarkdownLink from '#lib/components/MarkdownLink.svelte';
	import {
		emptyTranslationEntry,
		type TranslationEntry,
		type TranslationField,
		type TranslationItem
	} from '#lib/data/translation.js';
	import {
		expertAnswer,
		expertFieldOf,
		expertStorage,
		expertStorageKeys,
		isExpertItemDone,
		relevanceOptions,
		type ExpertField,
		type ExpertDiscussion
	} from '#lib/data/translation-expert.js';
	import { groupReviewItems, reviewConstructFor, meaqScales } from '#lib/data/translation-review-groups.js';
	import ReviewCommentThread from './ReviewCommentThread.svelte';
	import ReviewCommentDeleteDialog from './ReviewCommentDeleteDialog.svelte';
	import ExpertItem from './ExpertItem.svelte';
	import ReviewScaleIntro from './ReviewScaleIntro.svelte';
	import TranslationNavigator from './TranslationNavigator.svelte';

	let {
		data,
		token
	}: {
		data: {
			title: string;
			items: TranslationItem[];
			guide: string;
			entries: Record<string, TranslationEntry>;
			discussion?: ExpertDiscussion | null;
		};
		token: string;
	} = $props();

	let entries = $state<Record<string, TranslationEntry>>(untrack(() => ({ ...data.entries })));
	const readOnly = $derived(data.discussion?.slot === 1);
	let current = $state(0);
	const briefing = $derived(data.guide.split(/\r?\n\s*\r?\n/).filter((p) => p.trim()));
	const sections = $derived.by(() => {
		let start = 0;
		let number = 0;
		return groupReviewItems(data.items, undefined, true).map((group) => {
			const section = { ...group, start, number: group.scale ? ++number : 0 };
			start += group.items.length;
			return section;
		});
	});
	const ordered = $derived(
		sections.flatMap(({ scale, items }) => items.map(({ item }) => ({ item, scale })))
	);
	const construct = $derived(reviewConstructFor(sections));
	const navItems = $derived(
		ordered.map(({ item, scale }) => (scale ? { ...item, group: scale.title } : item))
	);
	const answers = $derived(
		Object.fromEntries(data.items.map((item) => [item.key, expertAnswer(entries, item.key)]))
	);
	// Навигатор отмечает «оценено» по полю translation и комментарий по полю comment.
	const navEntries = $derived(
		Object.fromEntries(
			data.items.map((item) => [
				item.key,
				{
					...emptyTranslationEntry(),
					translation: isExpertItemDone(item, answers[item.key]) ? 'done' : '',
					comment: chat.comments.filter((comment) => comment.itemKey === item.key).map((comment) => comment.body).join('\n')
				}
			])
		)
	);
	const doneCount = $derived(
		data.items.filter((item) => isExpertItemDone(item, answers[item.key])).length
	);
	const baseUrl = untrack(() => page.url.pathname.replace(/\/$/, ''));
	const saver = untrack(() =>
		createTranslationSaver(`${baseUrl}/save`, `translate-unsynced:${token}`, data.entries)
	);
	const chat = untrack(() => createExpertDiscussion(data.discussion ?? {
		id: 0, slot: 2, profiles: { 1: { name: 'Администратор', avatar: '' }, 2: { name: 'Эксперт', avatar: '' } }, comments: []
	}, baseUrl, new Set(data.items.map((item) => item.key)), (incoming) => {
		if (readOnly) entries = incoming;
		else apply(saver.synchronizeEntries(incoming));
	}));
	const unseen = new Set<string>();
	const hasCommentDraft = $derived(Object.values(chat.drafts).some((value) => value.trim()));
	const sendingComment = $derived(Object.values(chat.sending).some(Boolean));
	// «Сохранено» — только когда очередь пуста: нет ожидающих, отправляемых,
	// отклонённых правок и конфликтов.
	const saveState = $derived.by((): 'saved' | 'saving' | 'conflict' | 'error' => {
		if (saver.conflicts.length) return 'conflict';
		if (saver.status === 'error') return 'error';
		if (saver.status !== 'saved' || saver.unsyncedCount > 0) return 'saving';
		return 'saved';
	});

	function apply(changes: { key: string; field: TranslationField; value: string }[]) {
		for (const { key, field, value } of changes)
			entries[key] = { ...(entries[key] ?? emptyTranslationEntry()), [field]: value };
	}
	function change(itemKey: string, field: ExpertField, value: string) {
		if (readOnly) return;
		const target = expertStorage(itemKey, field);
		apply([{ ...target, value }]);
		saver.queue(target.key, target.field, value);
	}
	function resolveConflict(operationId: string, choice: 'server' | 'local') {
		const value = saver.resolveConflict(operationId, choice);
		if (value) apply([value]);
	}

	const fieldNames: Record<ExpertField, string> = {
		clarity: 'ясность',
		rewrite: 'предложенная формулировка',
		relevance: 'релевантность',
		comment: 'комментарий'
	};
	function conflictTitle(key: string, field: TranslationField) {
		const target = expertFieldOf(key, field);
		const item = data.items.find((entry) => entry.key === target?.itemKey);
		return `${item?.label ?? key}: ${target ? fieldNames[target.field] : 'ответ'}`;
	}
	function conflictValue(key: string, field: TranslationField, value: string) {
		const target = expertFieldOf(key, field);
		if (!value) return '(пусто)';
		if (target?.field === 'clarity') return value === 'clear' ? 'Понятна' : 'Неясна';
		if (target?.field === 'relevance')
			return `${value} — ${relevanceOptions.find((option) => option.value === value)?.label ?? ''}`;
		return value;
	}

	function go(index: number, focus = false) {
		if (index < 0 || index >= ordered.length) return;
		document.getElementById(`expert-item-${index + 1}`)?.scrollIntoView({
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
			block: 'start'
		});
		const key = ordered[index]?.item.key;
		if (focus && key)
			document.getElementById(`expert-${key}-heading`)?.focus({ preventScroll: true });
		const url = new SvelteURL(page.url.href);
		url.hash = `expert-item-${index + 1}`;
		// Меняется только якорь этой же страницы
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, page.state);
	}
	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
		if (event.target instanceof Element && event.target.closest('[data-comment-composer]')) return;
		event.preventDefault();
		void saver.flush();
		go(current + (event.shiftKey ? -1 : 1), true);
	}
	function onbeforeunload(event: BeforeUnloadEvent) {
		if (saver.atRisk || chat.atRisk) event.preventDefault();
	}
	beforeNavigate(({ cancel }) => {
		saver.flushOnLeave();
		if (saver.atRisk || chat.atRisk) cancel();
	});

	onMount(() => {
		const keys = expertStorageKeys(data.items);
		const stopDiscussion = chat.mount();
		const existingDrafts = { ...chat.drafts };
		const legacy: Record<string, { comment?: string; rewrite?: string }> = {};
		if (!readOnly) apply(saver.restore((key) => keys.has(key), (change) => {
			const target = expertFieldOf(change.key, change.field);
			if (!target || (target.field !== 'comment' && target.field !== 'rewrite')) return false;
			legacy[target.itemKey] = { ...legacy[target.itemKey], [target.field]: change.value };
			const recovered = legacy[target.itemKey];
			const text = [recovered.comment, recovered.rewrite ? `Предложенная формулировка: ${recovered.rewrite}` : ''].filter(Boolean).join('\n');
			const existing = existingDrafts[target.itemKey] ?? '';
			chat.setDraft(target.itemKey, existing.trim() === text.trim() ? existing : [existing, text].filter(Boolean).join('\n\n'));
			return chat.atRisk ? 'retain' : true;
		}));
		let frame = 0;
		function trackScroll() {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				let active = 0;
				for (let index = 0; index < ordered.length; index++) {
					const top = document
						.getElementById(`expert-item-${index + 1}`)
						?.getBoundingClientRect().top;
					// Текущий — последний пункт, начавшийся в верхней трети экрана
					if ((top ?? Infinity) <= Math.max(128, innerHeight / 3)) active = index;
				}
				if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
					active = ordered.length - 1;
				current = active;
			});
		}
		function deepLink() {
			const hash = /^#expert-item-(\d+)$/.exec(location.hash);
			const index = Number(hash?.[1]) - 1;
			if (Number.isInteger(index) && index >= 0 && index < ordered.length)
				document.getElementById(`expert-item-${index + 1}`)?.scrollIntoView();
			trackScroll();
		}
		window.addEventListener('scroll', trackScroll, { passive: true });
		window.addEventListener('resize', trackScroll);
		window.addEventListener('hashchange', deepLink);
		const resizeObserver = new ResizeObserver(trackScroll);
		resizeObserver.observe(document.body);
		deepLink();
		return () => {
			stopDiscussion();
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
	{#each section.items as { item }, itemIndex (item.key)}
		<option value={section.start + itemIndex}>{item.label}</option>
	{/each}
{/snippet}

<svelte:head>
	<title>{data.title}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<svelte:window
	{onkeydown}
	{onbeforeunload}
	ononline={() => saver.flush()}
	onpagehide={() => saver.flushOnLeave()}
/>
<svelte:document
	onvisibilitychange={() => document.visibilityState === 'hidden' && saver.flush()}
/>

<div class="min-h-screen bg-background">
	<header class="bg-card">
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-8"
		>
			<h1 class="text-lg font-semibold text-navy">{data.title}</h1>
			<div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
				<p class="tabular-nums">Оценено {doneCount} из {data.items.length}</p>
				<p role="status">
					{chat.atRisk ? 'Черновик комментария не сохранён в браузере' : sendingComment ? 'Отправляем комментарий…' : saveState === 'saved'
						? (hasCommentDraft ? 'Есть неотправленный комментарий' : 'Все изменения сохранены')
						: saveState === 'saving'
							? 'Сохраняем…'
							: 'Есть несохранённые изменения'}
				</p>
			</div>
		</div>
		<div class="h-1 bg-navy/5" aria-hidden="true">
			<div
				class="h-full bg-primary transition-[width] duration-300"
				style:width={`${(doneCount / Math.max(data.items.length, 1)) * 100}%`}
			></div>
		</div>
	</header>
	<div class="sticky top-0 z-10 bg-background/95 px-4 py-3 shadow-sm lg:hidden">
		<label for="expert-jump" class="mr-3 text-sm">Перейти к пункту</label>
		<select
			id="expert-jump"
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
							? 'Ответы сохранены в этом браузере и отправятся, когда связь появится.'
							: 'Не закрывайте страницу: несохранённые ответы есть только в памяти вкладки.'}
					</p>
					{#if saver.linkGone}
						<p>Ссылка больше не действует. Свяжитесь с тем, кто её прислал.</p>
					{/if}
				</div>
			{/if}
			{#each saver.conflicts as conflict (conflict.operationId)}
				<section class="mb-6 space-y-3 rounded-xl bg-card p-5" aria-label="Конфликт сохранения">
					<h2 class="font-semibold">
						{conflictTitle(conflict.key, conflict.field)} — ответ уже изменён в другой вкладке
					</h2>
					<p class="whitespace-pre-wrap">
						Сохранено: {conflictValue(conflict.key, conflict.field, conflict.serverValue)}
					</p>
					<p class="whitespace-pre-wrap">
						Ваш черновик: {conflictValue(conflict.key, conflict.field, conflict.localValue)}
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

			{#if briefing.length}
				<section class="mb-8 space-y-3 rounded-xl bg-card p-5" aria-labelledby="expert-briefing">
					<h2 id="expert-briefing" class="text-xl font-semibold text-navy">Брифинг</h2>
					<div class="space-y-3 leading-relaxed text-navy/85">
						{#each briefing as paragraph, index (index)}
							<p><MarkdownLink text={paragraph} /></p>
						{/each}
					</div>
					<p class="text-sm text-muted-foreground">
						Ответы сохраняются автоматически.
					</p>
					<ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy/85" aria-label="Шкалы опросника">
						{#each meaqScales as scale (scale.id)}<li><strong>{scale.title}</strong> — {scale.definition}</li>{/each}
					</ul>
				</section>
			{/if}
			{#if construct}
				<section class="mb-12 space-y-3 rounded-xl bg-card p-5" aria-labelledby="expert-construct">
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Что измеряет опросник
					</p>
					<h2 id="expert-construct" class="text-xl font-semibold text-navy">{construct.title}</h2>
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
								id={`expert-scale-${section.scale.id}`}
							/>
						{/if}
						{#each section.items as { item }, itemIndex (item.key)}
							{@const position = section.start + itemIndex + 1}
							<section id={`expert-item-${position}`} class="scroll-mt-28">
								<ExpertItem
									{item}
									scaleTitle={section.scale?.title ?? null}
									{position}
									total={data.items.length}
									answer={answers[item.key]}
									{readOnly}
									heading={section.scale ? 'h3' : 'h2'}
									onchange={(field, value) => change(item.key, field, value)}
								>
									{#snippet discussion()}
										<ReviewCommentThread id={`expert-comment-${item.key}`} itemLabel={item.label}
											comments={chat.comments.filter((comment) => comment.itemKey === item.key)} profiles={chat.profiles} ownSlot={chat.slot} {unseen}
											draft={chat.drafts[item.key] ?? ''} sending={chat.sending[item.key] ?? false} error={chat.errors[item.key] ?? ''}
											ondraft={(value) => chat.setDraft(item.key, value)} onsend={() => void chat.send(item.key)} ondelete={(comment) => chat.askDelete(comment)} />
									{/snippet}
								</ExpertItem>
							</section>
						{/each}
					</div>
				{/each}
			</div>

			{#if chat.refreshError}<p role="status" class="mt-6 text-sm text-muted-foreground">{chat.refreshError}</p>{/if}
		</main>
		<aside
			class="hidden max-h-[calc(100dvh-3rem)] overflow-y-auto lg:sticky lg:top-6 lg:block lg:self-start"
		>
			<TranslationNavigator
				items={navItems}
				entries={navEntries}
				{current}
				hasGuide={false}
				continuous
				doneLabel="оценено"
				onselect={(index) => go(index, true)}
			/>
		</aside>
	</div>
</div>

<ReviewCommentDeleteDialog comment={chat.pendingDelete} deleting={chat.deleting} error={chat.deleteError} onconfirm={() => void chat.confirmDelete()} oncancel={() => chat.cancelDelete()} />
