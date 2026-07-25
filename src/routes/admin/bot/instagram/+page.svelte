<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const triggerLabels: Record<string, string> = {
		comment: 'Комментарий',
		dm: 'Директ'
	};

	function actionSummary(rule: (typeof data.rules)[number]): string {
		const parts: string[] = [];
		if (rule.triggerType === 'comment' && rule.commentReplyText) parts.push('ответ на коммент');
		if (rule.dmText)
			parts.push(rule.triggerType === 'comment' ? 'сообщение в директ' : 'ответ в директе');
		return parts.length > 0 ? parts.join(' + ') : 'не настроено';
	}
</script>

<svelte:head>
	<title>Instagram-автоответы</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-2 text-2xl font-semibold">Instagram</h1>
	<p class="mb-6 max-w-2xl text-sm text-stone-500">
		Автоответы по ключевым словам: публичный ответ на комментарий, сообщение в директ автору
		комментария, ответ на входящее в директе. На один комментарий/сообщение срабатывает первое
		подходящее правило.
	</p>

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
				placeholder="Гайд по слову «фокус»"
				class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm"
			/>
		</label>
		<label class="block text-xs font-medium text-stone-500">
			Триггер
			<select name="triggerType" class="mt-1 rounded-lg border px-3 py-2 text-sm">
				<option value="comment">{triggerLabels.comment}</option>
				<option value="dm">{triggerLabels.dm}</option>
			</select>
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

	{#if data.rules.length === 0}
		<p class="text-sm text-stone-400">
			Правил пока нет. Создайте первое: ключевое слово → автоответ на комментарий или в директ.
		</p>
	{:else}
		<div class="overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs text-stone-500 uppercase">
					<tr>
						<th class="px-4 py-2 font-medium">Название</th>
						<th class="px-4 py-2 font-medium">Триггер</th>
						<th class="px-4 py-2 font-medium">Ключевые слова</th>
						<th class="px-4 py-2 font-medium">Действие</th>
						<th class="px-4 py-2 font-medium">Сработало</th>
						<th class="px-4 py-2 font-medium">Статус</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rules as rule (rule.id)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">
								<a href="/admin/bot/instagram/{rule.id}" class="text-blue-600 hover:underline">
									{rule.name}
								</a>
							</td>
							<td class="px-4 py-2 text-stone-600">{triggerLabels[rule.triggerType]}</td>
							<td class="px-4 py-2 text-stone-600">
								{#if rule.keywords.length > 0}
									<code>{rule.keywords.join(', ')}</code>
								{:else}
									—
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-600">{actionSummary(rule)}</td>
							<td class="px-4 py-2 text-stone-600">{rule.hits}</td>
							<td class="px-4 py-2">
								{#if rule.enabled}
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
										>включено</span
									>
								{:else}
									<span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
										>выключено</span
									>
								{/if}
							</td>
							<td class="px-4 py-2 text-right">
								<div class="flex justify-end gap-2">
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="id" value={rule.id} />
										<button type="submit" class="text-sm text-blue-600 hover:underline">
											{rule.enabled ? 'Выключить' : 'Включить'}
										</button>
									</form>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={rule.id} />
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
