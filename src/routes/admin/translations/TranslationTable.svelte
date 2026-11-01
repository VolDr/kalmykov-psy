<script lang="ts">
	import type { TranslationEntry, TranslationItem } from '#lib/data/translation.js';

	let { items, entries }: { items: TranslationItem[]; entries: Record<string, TranslationEntry> } =
		$props();
</script>

<div class="overflow-x-auto rounded-lg border">
	<table class="w-full text-left text-sm">
		<thead class="bg-gray-50 text-xs text-gray-500 uppercase">
			<tr>
				<th class="px-3 py-2">№</th>
				<th class="px-3 py-2">Оригинал</th>
				<th class="px-3 py-2">Перевод</th>
				<th class="px-3 py-2">Комментарий</th>
			</tr>
		</thead>
		<tbody class="divide-y align-top">
			{#each items as item (item.key)}
				{@const entry = entries[item.key]}
				<tr>
					<td class="px-3 py-2 whitespace-nowrap text-gray-500">{item.short}</td>
					<td class="w-1/3 px-3 py-2 text-gray-600">{item.source}</td>
					<td class="w-1/3 px-3 py-2 whitespace-pre-wrap">
						{#if entry?.translation}{entry.translation}{:else}<span class="text-gray-300">—</span
							>{/if}
					</td>
					<td class="px-3 py-2 whitespace-pre-wrap text-gray-600">{entry?.comment ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
