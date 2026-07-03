<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	let messagesEl = $state<HTMLDivElement | null>(null);

	// Автопрокрутка к последнему сообщению при загрузке и при новых сообщениях;
	// поллинг без новых сообщений скролл не трогает (админ может листать историю)
	let lastMessagesCount = -1;
	$effect(() => {
		const count = data.messages.length;
		if (messagesEl && count !== lastMessagesCount) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
		lastMessagesCount = count;
	});

	// Живое обновление ленты: перезагружаем данные, пока открыта карточка
	onMount(() => {
		const interval = setInterval(() => invalidateAll(), 7000);
		return () => clearInterval(interval);
	});

	function displayName(c: { username: string | null; firstName: string | null; lastName: string | null }) {
		const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
		if (full && c.username) return `${full} (@${c.username})`;
		if (full) return full;
		if (c.username) return `@${c.username}`;
		return 'Без имени';
	}

	function formatDateTime(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let replyText = $state('');
</script>

<svelte:head>
	<title>{displayName(data.contact)} — контакт бота</title>
</svelte:head>

<div class="grid gap-6 p-6 lg:grid-cols-3">
	<div class="lg:col-span-2">
		<a href="/admin/bot/contacts" class="mb-4 inline-block text-sm text-blue-600 hover:underline"
			>← Все контакты</a
		>
		<h1 class="mb-4 text-2xl font-semibold">{displayName(data.contact)}</h1>

		<div
			bind:this={messagesEl}
			class="mb-4 flex h-[50vh] flex-col gap-2 overflow-y-auto rounded-xl border bg-white p-4"
		>
			{#if data.messages.length === 0}
				<p class="text-sm text-stone-400">Переписки пока нет.</p>
			{/if}
			{#each data.messages as message (message.id)}
				<div class="flex {message.direction === 'out' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-[75%] rounded-lg px-3 py-2 text-sm {message.direction === 'out'
							? 'bg-primary text-primary-foreground'
							: 'bg-stone-100 text-stone-800'}"
					>
						<p class="whitespace-pre-wrap">{message.text ?? '(без текста)'}</p>
						<p
							class="mt-1 text-[10px] opacity-60 {message.direction === 'out'
								? 'text-primary-foreground'
								: 'text-stone-500'}"
						>
							{formatDateTime(message.createdAt)}
							{#if message.sentByAccountId}· вручную ({message.sentByAccountId}){/if}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<form
			method="POST"
			action="?/reply"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') replyText = '';
					await update();
				};
			}}
			class="flex gap-2"
		>
			<textarea
				name="text"
				bind:value={replyText}
				rows="2"
				placeholder="Ответить вручную…"
				class="w-full rounded-lg border px-3 py-2 text-sm"
			></textarea>
			<button
				type="submit"
				class="self-end rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
			>
				Отправить
			</button>
		</form>
		{#if form?.replyError}
			<p class="mt-2 text-sm text-red-500">{form.replyError}</p>
		{/if}
	</div>

	<div>
		<div class="rounded-xl border bg-white p-4">
			<h2 class="mb-3 text-sm font-semibold text-stone-600">CRM</h2>
			<form method="POST" action="?/updateCrm" use:enhance class="space-y-3">
				<label class="block text-xs font-medium text-stone-500">
					Этап
					<input
						type="text"
						name="stage"
						value={data.contact.stage}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Теги (через запятую)
					<input
						type="text"
						name="tags"
						value={data.contact.tags.join(', ')}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Заметки
					<textarea name="notes" rows="4" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						>{data.contact.notes ?? ''}</textarea
					>
				</label>
				<button
					type="submit"
					class="w-full rounded-lg border bg-white px-4 py-2 text-sm hover:bg-stone-50"
				>
					Сохранить
				</button>
				{#if form?.crmSuccess}
					<p class="text-xs text-green-600">Сохранено</p>
				{/if}
			</form>
		</div>

		{#if data.contact.botBlocked}
			<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
				Пользователь заблокировал бота — сообщения отправить не получится.
			</div>
		{/if}
	</div>
</div>
