<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
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

	function displayName(c: {
		username: string | null;
		firstName: string | null;
		lastName: string | null;
	}) {
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
		<a
			href={data.fromArchive
				? `${resolve('/admin/bot/contacts')}?view=archive`
				: resolve('/admin/bot/contacts')}
			class="mb-4 inline-block text-sm text-blue-600 hover:underline"
			>← {data.fromArchive ? 'В архив' : 'Все контакты'}</a
		>
		<h1 class="mb-1 text-2xl font-semibold">{displayName(data.contact)}</h1>
		<p class="mb-4 text-xs text-stone-400">
			ID для ссылок (&#123;contact_id&#125;): {data.contact.publicId}
		</p>

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
				disabled={data.contact.botBlocked}
				placeholder={data.contact.botBlocked
					? 'Контакт в архиве — отправка недоступна'
					: 'Ответить вручную…'}
				class="w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
			></textarea>
			<button
				type="submit"
				disabled={data.contact.botBlocked}
				class="self-end rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
			>
				Отправить
			</button>
		</form>
		{#if form?.replyError}
			<p class="mt-2 text-sm text-red-500">{form.replyError}</p>
		{:else if data.contact.botBlocked}
			<p class="mt-2 text-sm text-stone-500">
				Отправка включится автоматически, если человек снова запустит бота.
			</p>
		{/if}
	</div>

	<div>
		<section
			class="rounded-xl border border-stone-200 bg-white p-4"
			aria-labelledby="chain-status-title"
		>
			<p id="chain-status-title" class="text-xs font-medium tracking-wide text-stone-500 uppercase">
				Активная цепочка
			</p>
			{#if data.pendingSteps.length > 0}
				<div class="mt-2 flex items-center gap-2">
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700"
					>
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>Есть
					</span>
					<span class="text-sm text-stone-500">Ожидающих шагов: {data.pendingSteps.length}</span>
				</div>
				<p class="mt-3 text-sm text-stone-600">
					Следующий: {data.pendingSteps[0].scenarioName}, {formatDateTime(
						data.pendingSteps[0].scheduledAt
					)}
				</p>
			{:else}
				<div class="mt-2 flex items-center gap-2">
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-sm font-medium text-stone-600"
					>
						<span class="h-2 w-2 rounded-full bg-stone-400"></span>Нет
					</span>
					<span class="text-sm text-stone-500">Контакт свободен</span>
				</div>
				<p class="mt-3 text-sm text-stone-500">Ожидающих шагов нет.</p>
			{/if}
		</section>

		<div class="mt-4 rounded-xl border bg-white p-4">
			<h2 class="mb-3 text-sm font-semibold text-stone-600">CRM</h2>
			<form
				method="POST"
				action="?/updateCrm"
				use:enhance={() =>
					async ({ update }) => {
						await update({ reset: false });
					}}
				class="space-y-3"
			>
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

		{#if data.pendingSteps.length > 0}
			<div class="mt-4 rounded-xl border bg-white p-4">
				<h2 class="mb-3 text-sm font-semibold text-stone-600">
					Ожидающие сообщения ({data.pendingSteps.length})
				</h2>
				<ul class="space-y-3">
					{#each data.pendingSteps as step (step.id)}
						<li class="text-xs">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<p class="font-medium text-stone-600">
										{formatDateTime(step.scheduledAt)} · {step.scenarioName}
									</p>
									{#if step.messageText}
										<p class="truncate text-stone-400">{step.messageText}</p>
									{/if}
								</div>
								<form method="POST" action="?/cancelScheduled" use:enhance>
									<input type="hidden" name="scheduledId" value={step.id} />
									<button type="submit" class="shrink-0 text-red-500 hover:underline">
										Отменить
									</button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-stone-400">
					Отмена шага останавливает дальнейшую цепочку для этого контакта.
				</p>
			</div>
		{/if}

		{#if data.contact.botBlocked}
			<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
				Пользователь заблокировал бота — сообщения отправить не получится.
			</div>
		{/if}
	</div>
</div>
