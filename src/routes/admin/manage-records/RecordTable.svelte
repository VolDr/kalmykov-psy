<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import RecordCard from './RecordCard.svelte';
	import dayjs from 'dayjs';
	import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';

	dayjs.extend(isSameOrAfter);

	let {
		currentDate,
		activities,
		showProfileButton = true,
		showName = true
	}: {
		currentDate: Date | undefined;
		activities: any[];
		showProfileButton?: boolean;
		showName?: boolean;
	} = $props();

	const filteredActivities = $derived.by(() => {
		// Показываем все записи, если дата не выбрана
		if (!currentDate) return activities;

		// Фильтруем: от выбранной даты и на месяц вперед
		const selectedDate = dayjs(currentDate).startOf('day');
		const endDate = selectedDate.add(1, 'month').endOf('day');

		return activities.filter((activity) => {
			const activityDate = dayjs(activity.scheduledDate);
			return activityDate.isSameOrAfter(selectedDate) && activityDate.isBefore(endDate);
		});
	});
</script>

<!-- Desktop Table View -->
<div class="mx-auto hidden max-w-[1000px] md:block">
	<div class="rounded-md border">
		<Table>
			<TableHeader>
				<TableRow>
					{#if showName}
						<TableHead class="w-32">Имя</TableHead>
					{/if}
					<TableHead class="w-24">Дата</TableHead>
					<TableHead class="w-40">Обращение</TableHead>
					<TableHead class="w-20">Пол</TableHead>
					<TableHead class="w-64">Информация</TableHead>
					<TableHead class="w-20"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each filteredActivities as activity}
					{@const isPast = dayjs(activity.scheduledDate).isBefore(dayjs().startOf('day'))}

					<TableRow class={cn(isPast && 'opacity-60')}>
						{#if showName}
							<TableCell>{activity.client?.nick ?? activity.client?.name}</TableCell>
						{/if}
						<TableCell>
							{dayjs(activity.scheduledDate).format('HH:mm DD.MM')}
						</TableCell>
						<TableCell>
							<ScrollArea class="max-w-[200px]">
								{activity.client?.invocation ?? ''}
							</ScrollArea>
						</TableCell>
						<TableCell>
							<ScrollArea class="max-w-[100px]">
								{activity.client?.gender ?? ''}
							</ScrollArea>
						</TableCell>
						<TableCell>
							<ScrollArea class="max-w-[300px]">
								{activity.description ?? ''}
							</ScrollArea>
						</TableCell>
						<TableCell>
							<div class="flex gap-1">
								{#if showProfileButton}
									<Button
										variant="ghost"
										size="sm"
										class="h-8 w-8 p-0"
										onclick={(e) => {
											e.stopPropagation();
											goto(`/admin/profile/?clientId=${activity.clientId}`);
										}}
									>
										👤
									</Button>
								{/if}
								<Button
									variant="ghost"
									size="sm"
									class="h-8 w-8 p-0"
									onclick={() => goto(`/admin/record?id=${activity.id}`)}
								>
									✏️
								</Button>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>

<!-- Mobile Card View -->
<div class="space-y-4 md:hidden">
	{#each filteredActivities as activity}
		<RecordCard {activity} />
	{/each}
</div>
