<script lang="ts">
	let { data } = $props();

	function displayName(c: { username: string | null; firstName: string | null; lastName: string | null }) {
		const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
		if (full && c.username) return `${full} (@${c.username})`;
		if (full) return full;
		if (c.username) return `@${c.username}`;
		return 'Без имени';
	}

	function formatDate(iso: string | null) {
		if (!iso) return '—';
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Контакты бота</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Контакты Telegram-бота</h1>

	<form method="GET" class="mb-6 flex gap-2">
		<input
			type="text"
			name="search"
			value={data.search}
			placeholder="Поиск по имени/username"
			class="w-full max-w-sm rounded-lg border px-3 py-2 text-sm"
		/>
		<button type="submit" class="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-stone-50">
			Найти
		</button>
	</form>

	{#if data.limitReached}
		<p class="mb-4 text-sm text-amber-600">
			Показаны первые {data.contacts.length} контактов — уточните поиск, чтобы увидеть остальные.
		</p>
	{/if}

	{#if data.contacts.length === 0}
		<p class="text-sm text-stone-400">Контактов пока нет — они появятся после первого сообщения боту.</p>
	{:else}
		<div class="overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs uppercase text-stone-500">
					<tr>
						<th class="px-4 py-2 font-medium">Контакт</th>
						<th class="px-4 py-2 font-medium">Этап</th>
						<th class="px-4 py-2 font-medium">Теги</th>
						<th class="px-4 py-2 font-medium">Последняя активность</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.contacts as contact (contact.id)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">
								{displayName(contact)}
								{#if contact.botBlocked}
									<span class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600"
										>заблокировал бота</span
									>
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-600">{contact.stage}</td>
							<td class="px-4 py-2 text-stone-600">
								{#if contact.tags.length}
									{contact.tags.join(', ')}
								{:else}
									—
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-500">{formatDate(contact.lastInteractionAt)}</td>
							<td class="px-4 py-2 text-right">
								<a
									href="/admin/bot/contacts/{contact.id}"
									class="text-sm text-blue-600 hover:underline">Открыть</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
