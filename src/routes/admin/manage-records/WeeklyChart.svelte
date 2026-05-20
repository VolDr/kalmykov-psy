<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import dayjs from 'dayjs';

	let { activities }: { activities: any[] } = $props();

	const weeks = $derived.by(() => {
		return Array.from({ length: 8 }, (_, i) => {
			const weekStart = dayjs()
				.subtract(7 - i, 'weeks')
				.startOf('week');
			const weekEnd = weekStart.endOf('week');

			const weekActivities = activities.filter((a) => {
				const date = dayjs(a.scheduledDate);
				return date.isAfter(weekStart) && date.isBefore(weekEnd);
			});

			return {
				week: weekStart.format('DD.MM'),
				sessions: weekActivities.length
			};
		});
	});

	const maxSessions = $derived(Math.max(...weeks.map((w) => w.sessions), 1));
	const hasData = $derived(weeks.some((w) => w.sessions > 0));
</script>

<Card class="p-6">
	<h4 class="mb-4 text-lg font-semibold">Статистика по неделям</h4>

	{#if !hasData}
		<p class="py-8 text-center text-muted-foreground">Нет данных для отображения</p>
	{:else}
		<div class="space-y-3">
			{#each weeks as week}
				<div>
					<div class="mb-1 flex items-center justify-between">
						<span class="text-sm text-muted-foreground">{week.week}</span>
						<span class="text-sm font-medium">{week.sessions} сессий</span>
					</div>
					<div class="h-2 w-full rounded-full bg-gray-200">
						<div
							class="h-2 rounded-full bg-primary-light transition-all"
							style:width="{(week.sessions / maxSessions) * 100}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
