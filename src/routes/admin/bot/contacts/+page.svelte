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

	/** Источник для людей: cp_<id> кнопки поста → подпись поста */
	function sourceLabel(key: string | null) {
		if (!key) return null;
		return data.postSources[key] ?? key;
	}

	/** Где человек сейчас относительно шлагбаума подписки */
	function gateState(c: { gateShownAt: string | null; gatePassedAt: string | null }) {
		if (c.gatePassedAt) return { label: 'подписался', class: 'text-emerald-700' };
		if (c.gateShownAt) return { label: 'не подписался', class: 'text-amber-700' };
		return { label: 'без шлагбаума', class: 'text-stone-400' };
	}
</script>

<svelte:head>
	<title>Контакты бота</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Контакты Telegram-бота</h1>

	{#if data.funnel.length > 0}
		<section class="mb-6 rounded-xl border bg-white p-4">
			<h2 class="mb-3 text-sm font-semibold text-stone-600">Воронка бота за 30 дней</h2>
			<table class="text-sm">
				<thead>
					<tr class="text-left text-xs uppercase text-stone-400">
						<th class="pb-2 pr-6 font-medium">Источник</th>
						<th class="pb-2 pr-6 text-right font-medium">Дошли до бота</th>
						<th class="pb-2 pr-6 text-right font-medium">Упёрлись в подписку</th>
						<th class="pb-2 pr-6 text-right font-medium">Подписались</th>
						<th class="pb-2 text-right font-medium">С ClientID</th>
					</tr>
				</thead>
				<tbody>
					{#each data.funnel as row (row.sourceKey ?? '—')}
						<tr class="border-t">
							<td class="py-2 pr-6 font-medium" title={row.sourceKey ?? undefined}>
								{sourceLabel(row.sourceKey) ?? 'без метки'}
							</td>
							<td class="py-2 pr-6 text-right tabular-nums">{row.started}</td>
							<td class="py-2 pr-6 text-right tabular-nums text-amber-700">{row.gateShown}</td>
							<td class="py-2 pr-6 text-right tabular-nums text-emerald-700">
								{row.gatePassed}
								{#if row.gateShown > 0}
									<span class="ml-1 text-xs font-normal text-stone-400">
										{Math.round((row.gatePassed / row.gateShown) * 100)}%
									</span>
								{/if}
							</td>
							<td class="py-2 text-right tabular-nums text-stone-500">{row.withClientId}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-3 text-xs text-stone-400">
				«Упёрлись в подписку» минус «подписались» — те, кого шлагбаум отсёк. «С ClientID» —
				сколько контактов связаны с визитом на сайте и могут уехать в Директ офлайн-конверсией.
			</p>
		</section>
	{/if}

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
						<th class="px-4 py-2 font-medium">Источник</th>
						<th class="px-4 py-2 font-medium">Подписка</th>
						<th class="px-4 py-2 font-medium">id для /go/</th>
						<th class="px-4 py-2 font-medium">Этап</th>
						<th class="px-4 py-2 font-medium">Теги</th>
						<th class="px-4 py-2 font-medium">Последняя активность</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.contacts as contact (contact.id)}
						{@const gate = gateState(contact)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">
								{displayName(contact)}
								{#if contact.botBlocked}
									<span class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600"
										>заблокировал бота</span
									>
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-600" title={contact.sourceKey ?? undefined}>
								{sourceLabel(contact.sourceKey) ?? '—'}
							</td>
							<td class="px-4 py-2 {gate.class}">{gate.label}</td>
							<td class="px-4 py-2 font-mono text-xs text-stone-500">
								{contact.publicId}
								{#if contact.metrikaClientId}
									<span class="ml-1 text-emerald-600" title="ClientID Метрики привязан">●</span>
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
