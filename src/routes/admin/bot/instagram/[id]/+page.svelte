<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const isComment = $derived(data.rule.triggerType === 'comment');

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{data.rule.name} — Instagram-автоответ</title>
</svelte:head>

<div class="p-6">
	<a href="/admin/bot/instagram" class="mb-4 inline-block text-sm text-blue-600 hover:underline">
		← Все правила
	</a>
	<h1 class="mb-1 text-2xl font-semibold">{data.rule.name}</h1>
	<p class="mb-6 text-sm text-stone-500">
		Триггер: {isComment ? 'комментарий под постом/рилсом' : 'входящее сообщение в директ'}
		{#if data.rule.hits > 0}
			· сработало {data.rule.hits} раз{data.rule.lastHitAt
				? `, последний — ${formatDate(data.rule.lastHitAt)}`
				: ''}
		{/if}
	</p>

	<form
		method="POST"
		action="?/update"
		use:enhance={() =>
			async ({ update }) => {
				// reset: false — иначе enhance сбрасывает поля к значениям на момент загрузки
				await update({ reset: false });
			}}
		class="max-w-2xl space-y-4 rounded-xl border bg-white p-4"
	>
		<label class="block text-xs font-medium text-stone-500">
			Название
			<input
				type="text"
				name="name"
				value={data.rule.name}
				class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
			/>
		</label>

		<label class="block text-xs font-medium text-stone-500">
			Ключевые слова (через запятую)
			<input
				type="text"
				name="keywords"
				value={data.rule.keywords.join(', ')}
				placeholder="фокус, гайд, хочу"
				class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
			/>
		</label>

		<label class="flex items-center gap-2 text-sm text-stone-600">
			<input type="checkbox" name="matchExact" checked={data.rule.matchExact} class="rounded" />
			Только точное совпадение (иначе — «текст содержит слово»)
		</label>

		{#if isComment}
			<label class="block text-xs font-medium text-stone-500">
				Media ID поста/рилса (пусто — все посты)
				<input
					type="text"
					name="mediaId"
					value={data.rule.mediaId ?? ''}
					placeholder="17895695668004550"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
				/>
			</label>

			<label class="block text-xs font-medium text-stone-500">
				Публичный ответ под комментарием (пусто — не отвечать)
				<textarea
					name="commentReplyText"
					rows="2"
					placeholder="Отправил в директ! 📩"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.rule.commentReplyText ?? ''}
				></textarea>
			</label>
		{/if}

		<label class="block text-xs font-medium text-stone-500">
			{isComment ? 'Сообщение в директ автору комментария (пусто — не писать)' : 'Ответ в директе'}
			<textarea
				name="dmText"
				rows="4"
				placeholder={isComment
					? 'Привет! Вот обещанный гайд: https://…'
					: 'Привет! Отвечу в ближайшее время 🙌'}
				class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
				value={data.rule.dmText ?? ''}
			></textarea>
			{#if isComment}
				<span class="mt-1 block text-xs font-normal text-stone-400">
					Meta разрешает одно сообщение на комментарий, в течение 7 дней после него.
				</span>
			{/if}
		</label>

		<label class="flex items-center gap-2 text-sm text-stone-600">
			<input type="checkbox" name="enabled" checked={data.rule.enabled} class="rounded" />
			Правило включено
		</label>

		{#if form?.error}
			<p class="text-sm text-red-500">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="text-sm text-green-600">Сохранено</p>
		{/if}

		<button
			type="submit"
			class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
		>
			Сохранить
		</button>
	</form>

	<form method="POST" action="?/delete" use:enhance class="mt-4 max-w-2xl">
		<button type="submit" class="text-sm text-red-500 hover:underline">Удалить правило</button>
	</form>
</div>
