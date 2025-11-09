<script lang="ts">

	import type { NextStepsInfo } from '$lib/data/surveys/types';

	type Props = {
		nextSteps: NextStepsInfo;
	};

	let { nextSteps }: Props = $props();
</script>

<div class="space-y-6">
	{#if nextSteps.advice}
		<div class="border-2 border-[#F2F0EF] bg-[#F2F0EF] shadow-sm">
			<div class="p-6 md:p-8 space-y-4">
				<h3 class="flex items-center gap-2 text-[#191919] text-base md:text-lg font-semibold">
					<span class="icon-[lucide--alert-circle] w-5 h-5"></span>
					Важная информация
				</h3>
				<p class="text-sm md:text-base text-[#191919] opacity-80 leading-relaxed">
					{nextSteps.advice}
				</p>
			</div>
		</div>
	{/if}

	{#if nextSteps.criticalActions && nextSteps.criticalActions.length > 0}
		<div class="border-2 border-[#F2F0EF] shadow-sm">
			<div class="p-6 md:p-8 space-y-4">
				<h3 class="flex items-center gap-2 text-[#191919] text-base md:text-lg font-semibold">
					<span class="icon-[lucide--check-circle] w-5 h-5 text-emerald-600"></span>
					Критически важные действия
				</h3>
				<ul class="space-y-3">
					{#each nextSteps.criticalActions as action, index}
						<li class="flex items-start gap-3">
							<span
								class="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold rounded"
							>
								{index + 1}
							</span>
							<span
								class="text-sm md:text-base text-[#191919] opacity-80 leading-relaxed pt-0.5"
							>
								{action}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if nextSteps.management}
		<div class="border-2 border-[#F2F0EF] shadow-sm">
			<div class="p-6 md:p-8 space-y-4">
				<h3 class="text-[#191919] text-base md:text-lg font-semibold">
					{nextSteps.management.title}
				</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="border-b border-gray-300">
							<tr>
								<th
									class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"
								>
									Баллы
								</th>
								<th
									class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"
								>
									Тяжесть
								</th>
								<th
									class="px-4 py-3 text-sm font-semibold text-gray-500 uppercase"
								>
									Действия
								</th>
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
