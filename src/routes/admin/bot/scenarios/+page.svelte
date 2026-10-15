<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const triggerLabels: Record<string, string> = {
		start_param: 'Диплинк /start=',
		command: 'Команда',
		text: 'Текст'
	};

	let triggerType = $state('start_param');

	const triggerPlaceholders: Record<string, string> = {
		start_param: 'например, focus_lm',
		command: 'например, /start',
		text: 'например, хочу гайд'
	};
</script>

<svelte:head>
	<title>Сценарии бота</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Сценарии</h1>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="mb-8 flex max-w-3xl flex-wrap items-end gap-2 rounded-xl border bg-white p-4"
	>
		<label class="block text-xs font-medium text-stone-500">
			Название
			<input
				type="text"
				name="name"
				placeholder="Выдача лид-магнита «Фокус»"
				class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm"
			/>
		</label>
		<label class="block text-xs font-medium text-stone-500">
			Триггер
			<select
				name="triggerType"
				bind:value={triggerType}
				class="mt-1 rounded-lg border px-3 py-2 text-sm"
			>
				<option value="start_param">{triggerLabels.start_param}</option>
				<option value="command">{triggerLabels.command}</option>
				<option value="text">{triggerLabels.text}</option>
			</select>
		</label>
		<label class="block text-xs font-medium text-stone-500">
			Значение
			<input
				type="text"
				name="triggerValue"
				placeholder={triggerPlaceholders[triggerType]}
				class="mt-1 w-48 rounded-lg border px-3 py-2 text-sm"
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

	{#if data.scenarios.length === 0}
		<p class="text-sm text-stone-400">
			Сценариев пока нет. Создайте первый: триггер → цепочка сообщений с задержками.
		</p>
	{:else}
		<div class="overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs text-stone-500 uppercase">
					<tr>
						<th class="px-4 py-2 font-medium">Название</th>
						<th class="px-4 py-2 font-medium">Триггер</th>
						<th class="px-4 py-2 font-medium">Шагов</th>
						<th class="px-4 py-2 font-medium">В очереди</th>
						<th class="px-4 py-2 font-medium">Статус</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.scenarios as scenario (scenario.id)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">
								<a href="/admin/bot/scenarios/{scenario.id}" class="text-blue-600 hover:underline">
									{scenario.name}
								</a>
							</td>
							<td class="px-4 py-2 text-stone-600">
								{#if scenario.triggerType}
									{triggerLabels[scenario.triggerType]}: <code>{scenario.triggerValue}</code>
								{:else}
									—
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-600">{scenario.stepsCount}</td>
							<td class="px-4 py-2 text-stone-600">{scenario.pendingCount}</td>
							<td class="px-4 py-2">
								{#if scenario.enabled}
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
										>включён</span
									>
								{:else}
									<span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
										>выключен</span
									>
								{/if}
							</td>
							<td class="px-4 py-2 text-right">
								<div class="flex justify-end gap-2">
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="id" value={scenario.id} />
										<button type="submit" class="text-sm text-blue-600 hover:underline">
											{scenario.enabled ? 'Выключить' : 'Включить'}
										</button>
									</form>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={scenario.id} />
										<button type="submit" class="text-sm text-red-500 hover:underline"
											>Удалить</button
										>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
