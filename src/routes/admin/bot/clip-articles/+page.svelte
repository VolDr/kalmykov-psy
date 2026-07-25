<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Лид-статьи — Админка</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-1 text-2xl font-semibold">Лид-статьи</h1>
	<p class="mb-6 max-w-2xl text-sm text-stone-500">
		Клип-лендинги: статья короткими экранами с кнопкой «Дальше», в конце — опросник на уровень
		выгорания. На сайте показывается только общий результат, разбор по сферам выдаёт бот после
		подписки на канал (тексты бота — на вкладке «Опросник»).
	</p>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="mb-8 flex max-w-2xl flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
	>
		<label class="block flex-1 text-xs font-medium text-stone-500">
			Название
			<input
				type="text"
				name="title"
				placeholder="Почему отдых не помогает"
				class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
			/>
		</label>
		<label class="block flex-1 text-xs font-medium text-stone-500">
			Slug (URL: /useful/…)
			<input
				type="text"
				name="slug"
				placeholder="burnout-story"
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

	{#if data.articles.length === 0}
		<p class="text-sm text-stone-500">Пока нет ни одной статьи.</p>
	{:else}
		<div class="max-w-3xl overflow-hidden rounded-xl border bg-white">
			<table class="w-full text-sm">
				<thead class="bg-stone-50 text-left text-xs text-stone-500">
					<tr>
						<th class="px-4 py-2 font-medium">Название</th>
						<th class="px-4 py-2 font-medium">URL</th>
						<th class="px-4 py-2 font-medium">Экранов</th>
						<th class="px-4 py-2 font-medium">Статус</th>
					</tr>
				</thead>
				<tbody>
					{#each data.articles as article (article.id)}
						<tr class="border-t">
							<td class="px-4 py-2">
								<a
									href="/admin/bot/clip-articles/{article.id}"
									class="font-medium text-blue-600 hover:underline"
								>
									{article.title}
								</a>
							</td>
							<td class="px-4 py-2">
								<a
									href="/useful/{article.slug}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-stone-500 hover:underline"
								>
									/useful/{article.slug}
								</a>
							</td>
							<td class="px-4 py-2 text-stone-500">{article.pages.length}</td>
							<td class="px-4 py-2">
								{#if article.enabled}
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
										включена
									</span>
								{:else}
									<span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
										выключена
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
