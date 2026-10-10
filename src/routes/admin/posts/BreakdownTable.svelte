<script lang="ts">
	import type { Breakdown } from './types';

	let { data }: { data: Breakdown } = $props();
	const number = new Intl.NumberFormat('ru-RU');
	const maxValue = $derived(Math.max(1, ...data.rows.map((row) => Math.max(row.avg, row.med))));
</script>

<div class="overflow-hidden rounded-lg border bg-white">
	<div class="border-b px-4 py-3">
		<h4 class="text-sm font-semibold">{data.title}</h4>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[620px] text-sm">
			<thead class="text-xs text-muted-foreground">
				<tr>
					<th class="px-4 py-2 text-left font-medium">Паттерн</th>
					<th class="px-3 py-2 text-right font-medium">n</th>
					<th class="px-3 py-2 text-right font-medium">Среднее</th>
					<th class="px-3 py-2 text-right font-medium">Медиана</th>
					<th class="w-32 px-4 py-2"><span class="sr-only">Сравнение</span></th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each data.rows as row, index (`${row.label ?? row.pattern}-${index}`)}
					<tr class:font-medium={row.hi}>
						<td class="px-4 py-3">{row.label ?? row.pattern}</td>
						<td class="px-3 py-3 text-right font-mono text-muted-foreground">{row.n}</td>
						<td class="px-3 py-3 text-right font-mono">{number.format(row.avg)}</td>
						<td class="px-3 py-3 text-right font-mono font-semibold">{number.format(row.med)}</td>
						<td class="px-4 py-3">
							<div class="relative h-1.5 rounded-full bg-muted">
								<div
									class="absolute inset-y-0 left-0 rounded-full bg-primary/55"
									style:width={`${(row.avg / maxValue) * 100}%`}
								></div>
								<div
									class="absolute top-[-3px] h-3 w-0.5 bg-foreground"
									style:left={`${(row.med / maxValue) * 100}%`}
								></div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if data.note}
		<p class="border-t px-4 py-3 text-xs leading-5 text-muted-foreground">{data.note}</p>
	{/if}
</div>
