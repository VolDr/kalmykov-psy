<script lang="ts">
	import { enhance } from '$app/forms';
	import { cn } from '$lib/utils';

	let { data, form } = $props();

	let selectedScenarioId = $state<number>();
	const currentScenarioId = $derived(selectedScenarioId ?? data.scenarios[0]?.id);
	let relinking = $state(false);

	// Кнопка — прямая ссылка в бота, подписку проверяет только шлагбаум цепочки
	function gateHint(scenarioId: number | undefined) {
		const mode = scenarioId === undefined ? undefined : data.gates[scenarioId];
		if (mode === 'unsubscribed') return null;
		if (mode === 'all') {
			return {
				warn: false,
				text: 'Шлагбаум без условия «не подписан» — «Я подписался» нажимают и подписчики'
			};
		}
		return { warn: true, text: 'Нет шлагбаума — материал получат и без подписки на канал' };
	}

	const currentHint = $derived(gateHint(currentScenarioId));

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function postLabel(post: { chatId: string; messageId: number }) {
		if (post.chatId.startsWith('@')) {
			return `t.me/${post.chatId.slice(1)}/${post.messageId}`;
		}
		return `t.me/c/${post.chatId.replace('-100', '')}/${post.messageId}`;
	}
</script>

<svelte:head>
	<title>Кнопки на постах — бот</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-2 text-2xl font-semibold">Кнопки на постах канала</h1>
	<p class="mb-6 max-w-2xl text-sm text-stone-500">
		Бот вешает на существующий пост канала кнопку-ссылку: по нажатию сразу открывается чат с ботом и
		запускается выбранная цепочка. Подписку проверяет шлагбаум в цепочке — поставьте его первым
		шагом с условием «не подписан», тогда подписчики получат материал сразу, а остальных бот
		попросит подписаться. Бот должен быть админом канала.
	</p>

	{#if data.scenarios.length === 0}
		<p class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
			Сначала создайте сценарий с триггером «Диплинк /start=» во вкладке
			<a href="/admin/bot/scenarios" class="underline">Сценарии</a>.
		</p>
	{:else}
		<form
			method="POST"
			action="?/create"
			use:enhance
			class="mb-8 max-w-3xl space-y-3 rounded-xl border bg-white p-4"
		>
			<div class="flex flex-wrap items-end gap-2">
				<label class="block text-xs font-medium text-stone-500">
					Подпись (для себя)
					<input
						type="text"
						name="title"
						placeholder="Пост про выгорание"
						class="mt-1 w-44 rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Ссылка на пост
					<input
						type="text"
						name="postLink"
						placeholder="https://t.me/канал/123"
						class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Текст кнопки
					<input
						type="text"
						name="buttonText"
						placeholder="Получить материал"
						class="mt-1 w-44 rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Сценарий
					<select
						name="scenarioId"
						bind:value={selectedScenarioId}
						class="mt-1 rounded-lg border px-3 py-2 text-sm"
					>
						{#each data.scenarios as scenario (scenario.id)}
							<option value={scenario.id}>
								{scenario.name}{scenario.enabled ? '' : ' (выключен)'}{data.gates[scenario.id]
									? ''
									: ' — без шлагбаума'}
							</option>
						{/each}
					</select>
				</label>
			</div>
			{#if currentHint}
				<p class={cn('text-sm', currentHint.warn ? 'text-amber-700' : 'text-stone-500')}>
					{currentHint.text}
				</p>
			{/if}
			<button
				type="submit"
				class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
			>
				Повесить кнопку
			</button>
			{#if form?.createError}
				<p class="text-sm text-red-500">{form.createError}</p>
			{/if}
			{#if form?.createSuccess}
				<p class="text-sm text-green-600">Кнопка добавлена на пост</p>
			{/if}
		</form>
	{/if}

	{#if form?.error}
		<p class="mb-4 text-sm text-red-500">{form.error}</p>
	{/if}

	{#if data.posts.length === 0}
		<p class="text-sm text-stone-400">Кнопок пока нет.</p>
	{:else}
		<form
			method="POST"
			action="?/relink"
			use:enhance={() => {
				relinking = true;
				return async ({ update }) => {
					await update();
					relinking = false;
				};
			}}
			class="mb-4 flex max-w-3xl flex-wrap items-center gap-3"
		>
			<button
				type="submit"
				disabled={relinking}
				class="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-60"
			>
				{relinking ? 'Перевожу…' : 'Перевести кнопки на прямые ссылки'}
			</button>
			<span class="text-xs text-stone-500">
				Нужно один раз для кнопок, повешенных раньше: они ещё ходят через сервер. Повторное нажатие
				безопасно.
			</span>
		</form>
		{#if form?.relinkResult}
			<div class="mb-4 max-w-3xl text-sm">
				<p class="text-green-600">
					Переведено кнопок: {form.relinkResult.updated} из {form.relinkResult.total}
				</p>
				{#each form.relinkResult.failed as problem (problem)}
					<p class="text-red-500">{problem}</p>
				{/each}
			</div>
		{/if}

		<div class="overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs text-stone-500 uppercase">
					<tr>
						<th class="px-4 py-2 font-medium">Подпись</th>
						<th class="px-4 py-2 font-medium">Пост</th>
						<th class="px-4 py-2 font-medium">Кнопка</th>
						<th class="px-4 py-2 font-medium">Сценарий</th>
						<th class="px-4 py-2 font-medium">Клики</th>
						<th class="px-4 py-2 font-medium">Создана</th>
						<th class="px-4 py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.posts as row (row.post.id)}
						{@const hint = gateHint(row.post.scenarioId)}
						<tr class="border-b last:border-0 hover:bg-stone-50">
							<td class="px-4 py-2">{row.post.title ?? '—'}</td>
							<td class="px-4 py-2 text-stone-600">
								<a
									href="https://{postLabel(row.post)}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-600 hover:underline">{postLabel(row.post)}</a
								>
							</td>
							<td class="px-4 py-2 text-stone-600">{row.post.buttonText}</td>
							<td class="px-4 py-2 text-stone-600">
								{row.scenarioName}
								{#if hint}
									<span
										class={cn('block text-xs', hint.warn ? 'text-amber-700' : 'text-stone-400')}
									>
										{hint.text}
									</span>
								{/if}
							</td>
							<td class="px-4 py-2 text-stone-600">{row.post.clicks}</td>
							<td class="px-4 py-2 text-stone-500">{formatDate(row.post.createdAt)}</td>
							<td class="px-4 py-2 text-right">
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={row.post.id} />
									<button type="submit" class="text-sm text-red-500 hover:underline">Снять</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
