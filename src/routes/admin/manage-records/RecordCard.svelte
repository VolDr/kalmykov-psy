<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import dayjs from 'dayjs';
	import { cn } from '$lib/utils';

	let {
		activity
	}: {
		activity: any;
	} = $props();

	const isPast = $derived(dayjs(activity.scheduledDate).isBefore(dayjs().startOf('day')));
</script>

<Card class={cn('p-4', isPast && 'opacity-60')}>
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-start gap-3 flex-1">
			<Avatar class="h-10 w-10">
				<div class="flex h-full w-full items-center justify-center bg-[#cfc1a3] text-white">
					{activity.client?.name?.charAt(0).toUpperCase() ?? '?'}
				</div>
			</Avatar>

			<div class="flex-1 min-w-0">
				<p class="font-semibold text-sm truncate">
					{activity.client?.nick ?? activity.client?.name}
				</p>
				<p class="text-xs text-muted-foreground">
					{dayjs(activity.scheduledDate).format('HH:mm DD.MM.YYYY')}
				</p>

				{#if activity.client?.invocation}
					<p class="text-xs text-muted-foreground mt-2">
						<strong>Обращение:</strong>
						{activity.client.invocation}
					</p>
				{/if}

				{#if activity.client?.gender}
					<p class="text-xs text-muted-foreground">
						<strong>Пол:</strong>
						{activity.client.gender}
					</p>
				{/if}

				{#if activity.description}
					<p class="text-xs text-muted-foreground line-clamp-2 mt-1">
						<strong>Информация:</strong>
						{activity.description}
					</p>
				{/if}
			</div>
		</div>

		<div class="flex items-start gap-2">
			{#if isPast}
				<Badge variant="secondary" class="text-xs">Прошла</Badge>
			{/if}

			<div class="flex gap-1">
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					onclick={(e) => {
						e.stopPropagation();
						window.location.href = `/admin/profile/?clientId=${activity.clientId}`;
					}}
				>
					👤
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					onclick={(e) => {
						e.stopPropagation();
						window.location.href = `/admin/record?id=${activity.id}`;
					}}
				>
					✏️
				</Button>
			</div>
		</div>
	</div>
</Card>
