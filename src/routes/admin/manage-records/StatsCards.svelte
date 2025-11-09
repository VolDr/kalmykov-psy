<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import dayjs from 'dayjs';

	let { activities }: { activities: any[] } = $props();

	const stats = $derived.by(() => {
		const today = dayjs().startOf('day');
		const weekStart = dayjs().startOf('week');

		const todayCount = activities.filter((a) =>
			dayjs(a.scheduledDate).isSame(today, 'day')
		).length;

		const weekCount = activities.filter((a) => dayjs(a.scheduledDate).isAfter(weekStart)).length;

		return [
			{
				title: 'Всего сессий',
				value: activities.length,
				color: 'blue',
				icon: '📊'
			},
			{
				title: 'Сегодня',
				value: todayCount,
				color: 'green',
				icon: '📅'
			},
			{
				title: 'На этой неделе',
				value: weekCount,
				color: 'violet',
				icon: '📆'
			}
		];
	});
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	{#each stats as stat}
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-bold uppercase text-muted-foreground">
						{stat.title}
					</p>
					<p class="text-2xl font-bold mt-1">
						{stat.value}
					</p>
				</div>
		
			</div>
		</Card>
	{/each}
</div>
