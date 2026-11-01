<script lang="ts">
	import type { TranslationItem } from '#lib/data/translation.js';

	interface LogEvent {
		id: number;
		kind: 'visit' | 'edit';
		ip: string;
		userAgent: string | null;
		itemKey: string | null;
		field: 'translation' | 'comment' | null;
		oldValue: string | null;
		newValue: string | null;
		createdAt: string;
		lastAt: string;
	}

	let { events, items }: { events: LogEvent[]; items: TranslationItem[] } = $props();

	const labels = $derived(new Map(items.map((item) => [item.key, item.label])));
	const fieldNames = { translation: 'перевод', comment: 'комментарий' } as const;

	const formatTime = (value: string) =>
		// Явный пояс: иначе сервер (SSR) и браузер покажут разное время
		new Date(value).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
</script>

{#if events.length === 0}
	<p class="text-sm text-gray-500">Заходов пока не было.</p>
{:else}
	<div class="overflow-x-auto rounded-lg border">
		<table class="w-full text-left text-sm">
			<thead class="bg-gray-50 text-xs text-gray-500 uppercase">
				<tr>
					<th class="px-3 py-2">Время (МСК)</th>
					<th class="px-3 py-2">IP</th>
					<th class="px-3 py-2">Событие</th>
					<th class="px-3 py-2">Было</th>
					<th class="px-3 py-2">Стало</th>
				</tr>
			</thead>
			<tbody class="divide-y align-top">
				{#each events as event (event.id)}
					<tr>
						<td class="px-3 py-2 whitespace-nowrap text-gray-500 tabular-nums">
							{formatTime(event.createdAt)}
							{#if event.kind === 'edit' && event.lastAt.slice(0, 19) !== event.createdAt.slice(0, 19)}
								<br />… {formatTime(event.lastAt)}
							{/if}
						</td>
						<td class="px-3 py-2 font-mono text-xs whitespace-nowrap" title={event.userAgent ?? ''}>
							{event.ip}
						</td>
						<td class="px-3 py-2 whitespace-nowrap">
							{#if event.kind === 'visit'}
								<span class="text-gray-500">Открыл страницу</span>
							{:else}
								{labels.get(event.itemKey ?? '') ?? event.itemKey}, {event.field
									? fieldNames[event.field]
									: ''}
							{/if}
						</td>
						<td class="max-w-xs px-3 py-2 whitespace-pre-wrap text-gray-400"
							>{event.oldValue ?? ''}</td
						>
						<td class="max-w-xs px-3 py-2 whitespace-pre-wrap">
							{#if event.kind === 'edit' && event.oldValue === event.newValue}
								<span class="text-gray-400">правил, но вернул как было</span>
							{:else}
								{event.newValue ?? ''}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
