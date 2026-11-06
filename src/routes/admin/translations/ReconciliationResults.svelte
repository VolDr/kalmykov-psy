<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { groupReviewItems } from '#lib/data/translation-review-groups.js';
	import { exportReconciledMarkdown } from '#lib/data/translation-reconciliation-export.js';
	import { createTranslationSaver } from '#lib/client/translation-saver.svelte.js';
	import {
		emptyTranslationEntry,
		TRANSLATION_MAX_LENGTH,
		type TranslationEntry,
		type TranslationField
	} from '#lib/data/translation.js';
	import {
		reconciliationText,
		type AdminReconciliation,
		commentsOf
	} from '#lib/data/translation-reconciliation.js';
	import { reviewChoiceLabel, reviewOptionOrder } from '#lib/data/translation-review-order.js';
	import BackTranslationPanel from './BackTranslationPanel.svelte';
	import ExpertPanel from './ExpertPanel.svelte';
	import { buildExpertItems, type ExpertResult } from '#lib/data/translation-expert.js';
	import type { PageData } from './$types';
	let {
		review,
		sourceId,
		backTranslation = null,
		origin = '',
		experts = []
	}: {
		review: AdminReconciliation;
		sourceId: number;
		backTranslation?: PageData['backTranslation'];
		origin?: string;
		experts?: ExpertResult[];
	} = $props();
	let final = $state<Record<string, TranslationEntry>>(untrack(() => ({ ...review.finalEntries })));
	let navigationProblem = $state('');
	const saver = untrack(() =>
		createTranslationSaver(
			`/admin/translations/review/${review.id}/save?sourceId=${sourceId}`,
			`translate-final:${review.id}`,
			review.finalEntries
		)
	);
	const first = $derived(review.participants[0]);
	const second = $derived(review.participants[1]);
	const rows = $derived(
		review.items.map((item) => ({
			item,
			options: reviewOptionOrder(review.id, item.key).map((key) =>
				key === 'a' ? review.variantA[item.key] : review.variantB[item.key]
			),
			...reconciliationText(
				item.key,
				review.variantA,
				review.variantB,
				first?.entries ?? {},
				second?.entries ?? {},
				final
			)
		}))
	);
	// Строки идут по шкалам опросника, как на странице участников.
	const sections = $derived.by(() => {
		const byKey = Object.fromEntries(rows.map((row) => [row.item.key, row]));
		let number = 0;
		return groupReviewItems(review.items).map(({ scale, items }) => ({
			scale,
			number: scale ? ++number : 0,
			rows: items.flatMap(({ item }) => byKey[item.key] ?? [])
		}));
	});
	const ready = $derived(rows.filter((row) => row.text.trim()).length);
	// Что эксперт получил бы сейчас — для подсчёта изменённых пунктов повторной оценки
	const expertItems = $derived.by(() => {
		const texts = new Map(rows.map((row) => [row.item.key, row.text]));
		return buildExpertItems(review.items, (key) => texts.get(key) ?? '');
	});
	const finalReady = $derived(
		ready === review.items.length && ready > 0 && saver.unsyncedCount === 0
	);
	const statuses = {
		manual: 'Утверждён вручную',
		agreed: 'Выбор совпал',
		disagreed: 'Выбраны разные варианты',
		pending: 'Ждём оба ответа'
	};
	onMount(() => {
		const keys = new Set(review.items.map((item) => item.key));
		for (const change of saver.restore((key) => keys.has(key)))
			apply(change.key, change.field, change.value);
		return () => saver.dispose();
	});
	$effect(() => {
		const incoming = review.finalEntries;
		untrack(() => {
			for (const change of saver.synchronizeEntries(incoming))
				apply(change.key, change.field, change.value);
		});
	});
	$effect(() => {
		if (!saver.atRisk) navigationProblem = '';
	});
	beforeNavigate((navigation) => {
		if (!saver.atRisk) return;
		navigation.cancel();
		navigationProblem =
			'Дождитесь сохранения: браузер не смог записать резервную копию. Переход отменён, чтобы не потерять текст.';
		void saver.flush();
	});
	function apply(key: string, field: TranslationField, value: string) {
		final[key] = { ...(final[key] ?? emptyTranslationEntry()), [field]: value };
	}
	function change(key: string, field: TranslationField, value: string) {
		apply(key, field, value);
		saver.queue(key, field, value);
	}
	function resolveConflict(id: string, choice: 'local' | 'server') {
		const value = saver.resolveConflict(id, choice);
		if (value) apply(value.key, value.field, value.value);
	}
	function download() {
		if (ready !== review.items.length || saver.unsyncedCount) return;
		const text = exportReconciledMarkdown(review, final);
		const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `soglasovanny-perevod-${review.id}.md`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<svelte:window
	ononline={() => saver.flush()}
	onpagehide={() => saver.flushOnLeave()}
	onbeforeunload={(event) => {
		if (saver.atRisk) event.preventDefault();
	}}
/>
<svelte:document
	onvisibilitychange={() => document.visibilityState === 'hidden' && saver.flush()}
/>

<section class="space-y-4" aria-label="Результаты согласования">
	{#if navigationProblem}<p role="alert" class="text-sm text-destructive">
			{navigationProblem}
		</p>{/if}
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h3 class="text-lg font-semibold">Общий перевод</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Готово {ready} из {review.items.length}. Совпавший выбор подставляется автоматически.
				Разногласия можно разрешить вручную.
			</p>
		</div>
		<button
			type="button"
			onclick={download}
			disabled={ready !== review.items.length || saver.unsyncedCount > 0}
			class="min-h-11 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
			>Скачать итог .md</button
		>
	</div>
	<p role="status" class="text-sm text-muted-foreground">
		{saver.status === 'saved'
			? 'Ручные правки сохранены'
			: saver.status === 'error'
				? `${saver.error || 'Проверьте конфликты'}. ${saver.storedLocally ? 'Черновики сохранены в браузере.' : 'Не закрывайте страницу.'}`
				: 'Сохраняем ручные правки…'}
	</p>
	{#each saver.conflicts as conflict (conflict.operationId)}
		<section
			class="space-y-3 rounded-xl border border-destructive/30 bg-card p-4"
			aria-label="Конфликт итогового текста"
		>
			<p role="alert" class="font-medium">
				{review.items.find((item) => item.key === conflict.key)?.label}: итог изменён в другой
				вкладке
			</p>
			<p class="text-sm whitespace-pre-wrap">Сохранено: {conflict.serverValue || '(пусто)'}</p>
			<p class="text-sm whitespace-pre-wrap">Ваш черновик: {conflict.localValue || '(пусто)'}</p>
			<div class="flex flex-wrap gap-3">
				<button
					type="button"
					onclick={() => resolveConflict(conflict.operationId, 'server')}
					class="min-h-11 rounded-lg border border-border px-3 text-sm">Оставить сохранённый</button
				><button
					type="button"
					onclick={() => resolveConflict(conflict.operationId, 'local')}
					class="min-h-11 rounded-lg border border-border px-3 text-sm">Сохранить мой</button
				>
			</div>
		</section>
	{/each}
	<div class="overflow-x-auto rounded-xl border border-border">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="bg-muted/40"
				><tr
					><th class="p-3">Пункт</th><th class="p-3">{first?.profile.name ?? 'Участник 1'}</th><th
						class="p-3">{second?.profile.name ?? 'Участник 2'}</th
					><th class="p-3">Итог</th></tr
				></thead
			>{#each sections as section, sectionIndex (section.scale?.id ?? `general-${sectionIndex}`)}<tbody
					class="divide-y divide-border border-t border-border"
				>
					{#if section.scale}
						<tr class="bg-primary/5"
							><th colspan="4" scope="colgroup" class="p-3 font-normal"
								><span class="block font-semibold text-foreground"
									>Шкала {section.number}. {section.scale.title}</span
								><span class="mt-1 block text-xs text-muted-foreground"
									>Пункты {section.scale.itemKeys.join(', ')}. {section.scale.definition}</span
								></th
							></tr
						>
					{/if}
					{#each section.rows as row (row.item.key)}
						<tr class="align-top"
							><th class="p-3 font-medium">{row.item.label}</th><td class="max-w-64 p-3"
								><p>
									{reviewChoiceLabel(
										review.id,
										row.item.key,
										first?.entries[row.item.key]?.translation ?? ''
									)}
								</p>
								{#each first ? commentsOf(review.comments, first.slot, row.item.key) : [] as text, index (index)}<p
										class="mt-1 text-xs whitespace-pre-wrap text-muted-foreground"
									>
										{text}
									</p>{/each}</td
							><td class="max-w-64 p-3"
								><p>
									{reviewChoiceLabel(
										review.id,
										row.item.key,
										second?.entries[row.item.key]?.translation ?? ''
									)}
								</p>
								{#each second ? commentsOf(review.comments, second.slot, row.item.key) : [] as text, index (index)}<p
										class="mt-1 text-xs whitespace-pre-wrap text-muted-foreground"
									>
										{text}
									</p>{/each}</td
							><td class="max-w-md p-3"
								><p class="mb-2 text-xs text-muted-foreground">{statuses[row.status]}</p>
								<p class="leading-relaxed whitespace-pre-wrap">
									{row.text || 'Итог пока не выбран'}
								</p>
								<details class="mt-3">
									<summary class="min-h-11 cursor-pointer py-2 font-medium">Уточнить итог</summary>
									<div class="mt-2 space-y-3">
										<dl class="space-y-3 rounded-lg bg-muted/40 p-3">
											<div>
												<dt class="font-medium">Вариант 1</dt>
												<dd class="mt-1 whitespace-pre-wrap">{row.options[0]}</dd>
											</div>
											<div>
												<dt class="font-medium">Вариант 2</dt>
												<dd class="mt-1 whitespace-pre-wrap">{row.options[1]}</dd>
											</div>
										</dl>
										<div class="flex flex-wrap gap-2">
											<button
												type="button"
												onclick={() => change(row.item.key, 'translation', row.options[0])}
												class="min-h-11 rounded-lg border border-border px-3"
												>Взять вариант 1</button
											><button
												type="button"
												onclick={() => change(row.item.key, 'translation', row.options[1])}
												class="min-h-11 rounded-lg border border-border px-3"
												>Взять вариант 2</button
											>
										</div>
										<label class="block"
											>Итоговая формулировка<textarea
												value={final[row.item.key]?.translation ?? ''}
												placeholder={row.text || 'Свой общий вариант'}
												maxlength={TRANSLATION_MAX_LENGTH}
												oninput={(event) =>
													change(row.item.key, 'translation', event.currentTarget.value)}
												rows="4"
												class="mt-1 block w-full rounded-lg border border-border bg-card p-3 text-sm"
											></textarea></label
										><label class="block"
											>Комментарий к итогу<textarea
												value={final[row.item.key]?.comment ?? ''}
												maxlength={TRANSLATION_MAX_LENGTH}
												oninput={(event) =>
													change(row.item.key, 'comment', event.currentTarget.value)}
												rows="2"
												class="mt-1 block w-full rounded-lg border border-border bg-card p-3 text-sm"
											></textarea></label
										>
										<p class="text-xs text-muted-foreground">
											Пустое поле возвращает автоматический итог по ответам участников.
										</p>
									</div>
								</details>
							</td></tr
						>
					{/each}
				</tbody>{/each}
		</table>
	</div>
</section>

<BackTranslationPanel
	back={backTranslation}
	{sourceId}
	reviewId={review.id}
	{origin}
	ready={finalReady}
/>
<ExpertPanel
	{experts}
	currentItems={expertItems}
	{sourceId}
	reviewId={review.id}
	{origin}
	ready={finalReady}
/>
