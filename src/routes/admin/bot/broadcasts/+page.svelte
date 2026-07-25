<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

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
	<title>Рассылки бота</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-2 text-2xl font-semibold">Рассылки</h1>
	<p class="mb-6 max-w-2xl text-sm text-stone-500">
		Рассылка — цепочка сообщений, которую запускаешь вручную по сегменту тегов (или по триггеру,
		если задать его в настройках). Сообщения можно докидывать и удалять на ходу — очередь
		подхватывает изменения.
	</p>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="mb-8 flex max-w-xl items-end gap-2 rounded-xl border bg-white p-4"
	>
		<label class="block grow text-xs font-medium text-stone-500">
			Название
			<input
				type="text"
				name="name"
				placeholder="Дайджест июль 2026"
				class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
			/>
		</label>
		<button
			type="submit"
			class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
		>
			Создать
		</button>
		{#if form?.createError}
			<p class="w-full text-sm text-red-500">{form.createError}</p>
		{/if}
	</form>

	{#if form?.error}
		<p class="mb-4 text-sm text-red-500">{form.error}</p>
	{/if}

	{#if data.broadcasts.length === 0}
		<p class="text-sm text-stone-400">Рассылок пока нет.</p>
	{:else}
		<div class="overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs uppercase text-stone-500">
					<tr>
						<th class="px-4 py-2 font-medium">Название</th>
						<th class="px-4 py-2 font-medium">Сообщений</th>
						<th class="px-4 py-2 font-medium">В очереди</th>
						<th class="px-4 py-2 font-medium">Последний запуск</th>
						<th class="px-4 py-2 font-medium">Статус</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.broadcasts as broadcast (broadcast.id)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">
								<a href="/admin/bot/scenarios/{broadcast.id}" class="text-blue-600 hover:underline">
									{broadcast.name}
								</a>
							</td>
							<td class="px-4 py-2 text-stone-600">{broadcast.stepsCount}</td>
							<td class="px-4 py-2 text-stone-600">{broadcast.pendingCount}</td>
							<td class="px-4 py-2 text-stone-500">{formatDate(broadcast.lastRunAt)}</td>
							<td class="px-4 py-2">
								{#if broadcast.enabled}
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">включена</span>
								{:else}
									<span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">выключена</span>
								{/if}
							</td>
							<td class="px-4 py-2 text-right">
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={broadcast.id} />
									<button type="submit" class="text-sm text-red-500 hover:underline">Удалить</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
