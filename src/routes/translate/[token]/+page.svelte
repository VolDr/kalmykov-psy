<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { onMount, tick, untrack } from 'svelte';
	import { createTranslationSaver } from '#lib/client/translation-saver.svelte.js';
	import TranslationEditor from '#lib/components/translate/TranslationEditor.svelte';
	import TranslationNavigator from '#lib/components/translate/TranslationNavigator.svelte';
	import TranslationGuide from '#lib/components/translate/TranslationGuide.svelte';
	import {
		emptyTranslationEntry,
		type TranslationEntry,
		type TranslationField
	} from '#lib/data/translation.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const items = $derived(data.items);
	let entries = $state<Record<string, TranslationEntry>>(untrack(() => ({ ...data.entries })));
	// Шаги: «Как переводить» (если есть текст), затем пункты опросника. ?n= — номер шага.
	const offset = $derived(data.guide ? 1 : 0);
	const stepCount = $derived(items.length + offset);
	let current = $state(untrack(() => initialIndex()));
	const item = $derived(current >= offset ? items[current - offset] : undefined);
	const doneCount = $derived(items.filter((it) => entries[it.key]?.translation.trim()).length);

	const saver = createTranslationSaver(
		`${page.url.pathname.replace(/\/$/, '')}/save`,
		`translate-unsynced:${page.params.token}`,
		untrack(() => data.entries)
	);

	// Правки, не дошедшие до сервера в прошлый раз (не было сети, закрыли вкладку),
	// показываем в полях и досылаем
	onMount(() => {
		const keys = new Set(items.map((it) => it.key));
		for (const { key, field, value } of saver.restore((key) => keys.has(key))) {
			entries[key] = { ...(entries[key] ?? emptyTranslationEntry()), [field]: value };
		}
		return () => saver.dispose();
	});

	function initialIndex() {
		const n = Number(page.url.searchParams.get('n'));
		const steps = data.items.length + (data.guide ? 1 : 0);
		return Number.isInteger(n) && n >= 1 && n <= steps ? n - 1 : 0;
	}

	async function go(index: number, focusField = false) {
		if (index < 0 || index >= stepCount || index === current) return;
		current = index;
		// Меняется только ?n= на этой же странице (shallow routing)
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(`?n=${index + 1}`, {});
		if (focusField) {
			await tick();
			document.getElementById('tr-translation')?.focus();
		}
	}

	function change(field: TranslationField, value: string) {
		if (!item) return;
		const key = item.key;
		entries[key] = { ...(entries[key] ?? emptyTranslationEntry()), [field]: value };
		saver.queue(key, field, value);
	}

	function resolveConflict(operationId: string, choice: 'server' | 'local') {
		const change = saver.resolveConflict(operationId, choice);
		if (change)
			entries[change.key] = {
				...(entries[change.key] ?? emptyTranslationEntry()),
				[change.field]: change.value
			};
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
		event.preventDefault();
		void go(event.shiftKey ? current - 1 : current + 1, true);
	}

	// Копировать можно только из полей ввода (свой текст переводчика)
	function guardCopy(event: Event) {
		const target = event.target instanceof Element ? event.target : null;
		if (!target?.closest('textarea, [data-translation-copy]')) event.preventDefault();
	}

	function onbeforeunload(event: BeforeUnloadEvent) {
		// Если правки лежат в localStorage, они не потеряются — не мешаем закрыть
		if (saver.atRisk) event.preventDefault();
	}

	// Статус показываем только при проблеме со связью
	const problemText = $derived.by(() => {
		if (saver.status !== 'error') return '';
		if (saver.linkGone) {
			return saver.storedLocally
				? 'Ссылка больше не действует. Правки сохранены в этом браузере. Напишите тому, кто прислал ссылку.'
				: 'Ссылка больше не действует. Не закрывайте страницу: черновики есть только в памяти вкладки. Скопируйте текст и напишите тому, кто прислал ссылку.';
		}
		if (saver.unsyncedCount === 0) return `Не сохранено: ${saver.error}.`;
		if (saver.paused && !saver.conflicts.length)
			return `${saver.error}. ${
				saver.storedLocally
					? 'Черновик сохранён в этом браузере. Исправьте текст, чтобы повторить сохранение.'
					: 'Не закрывайте страницу. Исправьте текст, чтобы повторить сохранение.'
			}`;
		if (saver.paused)
			return saver.storedLocally
				? 'Часть правок требует вашего решения. Черновики сохранены в этом браузере.'
				: 'Часть правок требует вашего решения. Не закрывайте страницу: черновики есть только в памяти вкладки.';
		return saver.storedLocally
			? `${saver.error}. Правки сохранены в этом браузере и отправятся автоматически, когда связь появится.`
			: `${saver.error}. Не закрывайте страницу — повторим автоматически.`;
	});
</script>

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
	oncopy={guardCopy}
	oncut={guardCopy}
	ondragstart={(event) => event.preventDefault()}
	onvisibilitychange={() => document.visibilityState === 'hidden' && saver.flush()}
/>

<div class="min-h-screen bg-background select-none">
	<header class="border-b border-navy/10 bg-white/80">
		<div
			class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4"
		>
			<h1 class="text-lg font-semibold text-navy">{data.title}</h1>
			<p class="text-sm text-muted-foreground tabular-nums">
				Переведено {doneCount} из {items.length}
			</p>
		</div>
		<div class="h-1 bg-navy/5" aria-hidden="true">
			<div
				class="h-full bg-primary transition-[width] duration-300"
				style:width={`${(doneCount / Math.max(items.length, 1)) * 100}%`}
			></div>
		</div>
	</header>

	<div class="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
		<div class="space-y-8">
			{#each saver.conflicts as conflict (conflict.operationId)}
				<section
					data-translation-copy
					class="space-y-4 rounded-xl border border-navy/20 bg-card p-5 select-text"
					aria-label="Конфликт перевода"
				>
					<div role="alert">
						<h2 class="font-semibold text-navy">Текст уже изменён</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							{items.find((entry) => entry.key === conflict.key)?.label ?? conflict.key},
							{conflict.field === 'translation' ? 'перевод' : 'комментарий'}. Выберите, какой
							вариант оставить.
						</p>
					</div>
					<dl class="grid gap-4 text-sm sm:grid-cols-2">
						<div>
							<dt class="mb-1 font-medium">Сохранённый вариант</dt>
							<dd class="max-h-64 overflow-auto break-words whitespace-pre-wrap">
								{conflict.serverValue || '(пусто)'}
							</dd>
						</div>
						<div>
							<dt class="mb-1 font-medium">Ваш черновик</dt>
							<dd class="max-h-64 overflow-auto break-words whitespace-pre-wrap">
								{conflict.localValue || '(пусто)'}
							</dd>
						</div>
					</dl>
					<div class="flex flex-wrap gap-3">
						<button
							type="button"
							class="min-h-11 rounded-lg border border-navy/20 px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary"
							onclick={() => resolveConflict(conflict.operationId, 'server')}
							>Оставить сохранённый</button
						>
						<button
							type="button"
							class="min-h-11 rounded-lg border border-navy/20 px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary"
							onclick={() => resolveConflict(conflict.operationId, 'local')}
							>Сохранить мой черновик</button
						>
					</div>
				</section>
			{/each}
			{#if item}
				<TranslationEditor
					{item}
					position={current - offset + 1}
					total={items.length}
					hasPrev={current > 0}
					hasNext={current < stepCount - 1}
					translation={entries[item.key]?.translation ?? ''}
					comment={entries[item.key]?.comment ?? ''}
					onchange={change}
					onprev={() => go(current - 1)}
					onnext={() => go(current + 1)}
				/>
			{:else}
				<TranslationGuide text={data.guide} onstart={() => go(current + 1, true)} />
			{/if}
			{#if problemText}
				<p class="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
					{problemText}
				</p>
			{/if}
		</div>

		<aside class="lg:sticky lg:top-6 lg:self-start">
			<TranslationNavigator
				{items}
				{entries}
				{current}
				hasGuide={offset === 1}
				onselect={(index) => go(index)}
			/>
		</aside>
	</div>
</div>
