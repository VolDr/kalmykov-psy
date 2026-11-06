<script lang="ts">
	import { groupReviewItems } from '#lib/data/translation-review-groups.js';
	import type { TranslationItem } from '#lib/data/translation.js';
	import {
		expertAnswer,
		expertResultRows,
		expertResultsCsv,
		isRatedItem,
		summarizeExpertItem,
		type ExpertResult
	} from '#lib/data/translation-expert.js';

	let {
		experts,
		currentItems = []
	}: { experts: ExpertResult[]; currentItems?: TranslationItem[] } = $props();

	const rows = $derived(expertResultRows(experts, currentItems));
	const sections = $derived.by(() => {
		const byKey = new Map(rows.map((row) => [row.item.key, row]));
		return groupReviewItems(
			rows.map((row) => row.item),
			undefined,
			true
		).map(({ scale, items }) => {
			const sectionRows = items.flatMap(({ item }) => byKey.get(item.key) ?? []);
			const cvis = sectionRows
				.map((row) => summarizeExpertItem(row.item, row.experts).cvi)
				.filter((cvi): cvi is number => cvi !== null);
			return {
				scale,
				rows: sectionRows,
				// S-CVI/Ave: среднее I-CVI пунктов шкалы
				scvi: cvis.length ? cvis.reduce((sum, cvi) => sum + cvi, 0) / cvis.length : null
			};
		});
	});
	const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);

	function download() {
		const url = URL.createObjectURL(
			new Blob(['﻿' + expertResultsCsv(experts)], { type: 'text/csv;charset=utf-8' })
		);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'ekspertnaya-otsenka.csv';
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h4 class="font-semibold">Ответы экспертов</h4>
			<p class="mt-1 text-xs text-muted-foreground">
				I-CVI — доля оценок 3–4 среди выставленных оценок релевантности, S-CVI — среднее I-CVI по
				шкале. Каждый эксперт учитывается один раз — по его последней оценке пункта. Если пункт
				исправили, а эксперт ещё не оценил новую формулировку, его прежний ответ показан, но в
				расчёт не входит.
			</p>
		</div>
		<button
			type="button"
			onclick={download}
			class="min-h-11 rounded-lg border border-border px-3 py-2 text-sm">Скачать .csv</button
		>
	</div>
	<div class="overflow-x-auto rounded-lg border border-border">
		<table class="w-full text-left text-sm">
			<thead class="bg-muted/50 text-xs text-muted-foreground uppercase">
				<tr>
					<th class="px-3 py-2">Эксперт</th>
					<th class="px-3 py-2">Ясность</th>
					<th class="px-3 py-2">Релевантность</th>
					<th class="px-3 py-2">Обсуждение</th>
				</tr>
			</thead>
			{#each sections as section, sectionIndex (section.scale?.id ?? `general-${sectionIndex}`)}
				<tbody class="divide-y divide-border align-top">
					{#if section.scale}
						<tr class="bg-primary/5">
							<th colspan="4" class="px-3 py-2 font-semibold">
								{section.scale.title}
								<span class="ml-2 font-normal text-muted-foreground"
									>S-CVI {percent(section.scvi)}</span
								>
							</th>
						</tr>
					{/if}
					{#each section.rows as row (row.item.key)}
						{@const summary = summarizeExpertItem(row.item, row.experts)}
						<tr class="bg-muted/30">
							<td colspan="4" class="px-3 py-2">
								<p class="font-medium">
									{row.item.label}
									<span class="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
										{#if isRatedItem(row.item)}
											I-CVI {percent(summary.cvi)} · среднее {summary.mean?.toFixed(1) ?? '—'} ·
										{/if}
										неясна у {summary.unclear} из {summary.answered}
									</span>
								</p>
								<p class="mt-1 whitespace-pre-line text-muted-foreground">{row.item.source}</p>
							</td>
						</tr>
						{#each row.answers as { link, current } (link.personId)}
							{@const answer = expertAnswer(link.entries, row.item.key)}
							<tr class={current ? undefined : 'opacity-60'}>
								<td class="px-3 py-2 whitespace-nowrap">
									{link.name}
									{#if !current}<span class="block text-xs text-muted-foreground"
											>прежняя формулировка, ждёт повторной оценки</span
										>{:else if link.id !== link.personId}<span
											class="block text-xs text-muted-foreground">повторная оценка</span
										>{/if}
								</td>
								<td class="px-3 py-2 whitespace-nowrap">
									{answer.clarity === 'clear'
										? 'Понятна'
										: answer.clarity === 'unclear'
											? 'Неясна'
											: '—'}
								</td>
								<td class="px-3 py-2 tabular-nums">
									{isRatedItem(row.item) ? answer.relevance || '—' : ''}
								</td>
								<td class="space-y-2 px-3 py-2 whitespace-pre-wrap text-muted-foreground">
									{#each link.comments?.filter((comment) => comment.itemKey === row.item.key) ?? [] as comment (comment.id)}
										<p><span class="font-medium">{comment.slot === 1 ? 'Администратор' : link.name}:</span> {comment.body}</p>
									{/each}
								</td>
							</tr>
						{/each}
					{/each}
				</tbody>
			{/each}
		</table>
	</div>
</div>
