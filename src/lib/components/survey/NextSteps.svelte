<script lang="ts">
	import type { NextStepsInfo } from '$lib/data/surveys/types';

	type Props = {
		nextSteps: NextStepsInfo;
	};

	let { nextSteps }: Props = $props();
</script>

<div class="space-y-6">
	{#if nextSteps.advice}
		<div class="border-2 border-[#f7f5f0] bg-[#f7f5f0] shadow-sm">
			<div class="space-y-4 p-6 md:p-8">
				<h3 class="flex items-center gap-2 text-base font-semibold text-[#191919] md:text-lg">
					<span class="icon-[lucide--alert-circle] h-5 w-5"></span>
					Важная информация
				</h3>
				<p class="text-sm leading-relaxed text-[#191919] opacity-80 md:text-base">
					{nextSteps.advice}
				</p>
			</div>
		</div>
	{/if}

	{#if nextSteps.criticalActions && nextSteps.criticalActions.length > 0}
		<div class="border-2 border-[#f7f5f0] shadow-sm">
			<div class="space-y-4 p-6 md:p-8">
				<h3 class="flex items-center gap-2 text-base font-semibold text-[#191919] md:text-lg">
					<span class="icon-[lucide--check-circle] h-5 w-5 text-emerald-600"></span>
					Критически важные действия
				</h3>
				<ul class="space-y-3">
					{#each nextSteps.criticalActions as action, index}
						<li class="flex items-start gap-3">
							<span
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-emerald-100 text-sm font-bold text-emerald-700"
							>
								{index + 1}
							</span>
							<span class="pt-0.5 text-sm leading-relaxed text-[#191919] opacity-80 md:text-base">
								{action}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if nextSteps.management}
		<div class="border-2 border-[#f7f5f0] shadow-sm">
			<div class="space-y-4 p-6 md:p-8">
				<h3 class="text-base font-semibold text-[#191919] md:text-lg">
					{nextSteps.management.title}
				</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="border-b border-gray-300">
							<tr>
								<th class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"> Баллы </th>
								<th class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"> Тяжесть </th>
								<th class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"> Действия </th>
							</tr>
						</thead>
						<tbody>
							{#each nextSteps.management.table as row}
								<tr class="border-b border-gray-200 last:border-b-0">
									<td class="px-4 py-4 text-sm font-medium text-black">{row.score}</td>
									<td class="px-4 py-4 text-sm text-black">{row.severity}</td>
									<td class="px-4 py-4 text-sm text-black">{row.action}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>
