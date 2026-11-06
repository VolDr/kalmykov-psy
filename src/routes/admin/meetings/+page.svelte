<script lang="ts">
	import { Plus, Trash2, RefreshCw, Video, ShieldCheck, Copy, ExternalLink, Link2, Clock3 } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';
	import type { MeetingInvite } from '#lib/server/galene-admin.server.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let deleting = $state<string | null>(null);
	let title = $state('Консультация');
	let maxClients = $state(2);
	let copied = $state('');
	const created = $derived(form && 'created' in form ? form.created : null);
	const reissued = $derived(form && 'reissued' in form ? form.reissued : null);
	const error = $derived(form && 'error' in form ? form.error : null);

	function inviteUrl(group: string, invite: MeetingInvite) {
		// Keep the token in the URL fragment: it is not sent to nginx in HTTP
		// requests and is omitted from the Referer header.
		return '/meet?room=' + encodeURIComponent(group) + '#token=' +
			encodeURIComponent(invite.token) + '&name=' + encodeURIComponent(invite.username);
	}

	function expiry(iso: string) {
		return new Date(iso).toLocaleDateString('ru-RU', {
			day: 'numeric', month: 'short', year: 'numeric'
		});
	}

	async function copyLink(group: string, invite: MeetingInvite) {
		try {
			await navigator.clipboard.writeText(new URL(inviteUrl(group, invite), window.location.origin).href);
			copied = invite.token;
			window.setTimeout(() => {
				if (copied === invite.token) copied = '';
			}, 1800);
		} catch {
			copied = '';
		}
	}
</script>

<svelte:head>
	<title>Видеовстречи — Админка</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-7 p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="flex items-center gap-2 text-2xl font-semibold"><Video size={24}/> Видеовстречи</h1>
			<p class="mt-2 text-sm text-stone-500">
				Создавайте приватные комнаты и отправляйте участникам личные ссылки. Без паролей и регистрации.
			</p>
		</div>
		<div class="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
			<ShieldCheck size={15}/> Только для администратора
		</div>
	</div>

	{#if data.backendError}
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
			<strong>Galene недоступен.</strong> {data.backendError}
		</div>
	{/if}

	{#if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div>
	{/if}

	{#if created}
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">
			<strong>Комната «{created.title}» создана.</strong>
			Персональные ссылки появились в списке ниже — скопируйте каждую для нужного участника.
		</div>
	{/if}

	{#if reissued}
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">
			<strong>Ссылки комнаты {reissued.group} обновлены.</strong>
			Прежние приглашения и пароли больше не работают для нового входа.
			Новые ссылки доступны ниже.
		</div>
	{/if}

	<section class="rounded-xl border bg-white p-5 shadow-sm">
		<h2 class="mb-1 flex items-center gap-2 text-lg font-semibold"><Plus size={19}/> Новая комната</h2>
		<p class="mb-5 text-sm text-stone-500">
			На каждого участника создается отдельная ссылка: одна для ведущего, остальные для клиентов.
			Приглашения действуют 30 дней, запись отключена.
		</p>
		<form action="?/create" method="POST" class="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_125px_auto]">
			<label class="block text-sm font-medium text-stone-700">
				Название комнаты
				<input class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm" name="title" bind:value={title} maxlength="60" required/>
			</label>
			<label class="block text-sm font-medium text-stone-700">
				Участников
				<select name="maxClients" bind:value={maxClients} class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm">
					<option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
					<option value={6}>6</option><option value={8}>8</option><option value={12}>12</option>
				</select>
			</label>
			<button class="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40" disabled={!data.configured || !!data.backendError} type="submit">
				<Plus size={16}/> Создать
			</button>
		</form>
	</section>

	<section class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="flex items-center justify-between border-b p-5">
			<h2 class="text-lg font-semibold">Мои комнаты ({data.rooms.length})</h2>
			<span class="text-xs text-stone-400">Ссылки действуют только для своих комнат</span>
		</div>
		{#if data.rooms.length === 0}
			<div class="p-10 text-center text-sm text-stone-500">
				Комнат пока нет. Создайте первую выше.
			</div>
		{:else}
			<div class="divide-y">
				{#each data.rooms as room (room.id)}
					<div class="space-y-4 p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<div class="font-semibold">{room.title}</div>
								<div class="mt-1 font-mono text-xs text-stone-400">{room.id}</div>
								<div class="mt-1 text-xs text-stone-500">До {room.maxClients} участников</div>
							</div>
							{#if deleting === room.id}
								<form method="POST" action="?/delete" class="flex flex-wrap items-center gap-2">
									<input type="hidden" name="group" value={room.id}/>
									<input type="hidden" name="confirm" value={room.id}/>
									<span class="text-xs text-red-700">Удалить комнату и все приглашения?</span>
									<button class="rounded-lg bg-red-700 px-3 py-2 text-xs text-white" type="submit">Удалить</button>
									<button type="button" class="rounded-lg border px-3 py-2 text-xs" onclick={() => deleting = null}>Отмена</button>
								</form>
							{:else}
								<button type="button" class="inline-flex items-center gap-1 text-xs text-red-700 hover:underline" onclick={() => deleting = room.id}>
									<Trash2 size={14}/> Удалить
								</button>
							{/if}
						</div>

						{#if room.linksError}
							<p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
								Не удалось загрузить приглашения из Galene. Проверьте службу.
							</p>
						{:else if room.invites.length === 0}
							<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
								<p class="mb-3">У комнаты пока старый способ входа — через пароль, или истек срок действия ссылок.</p>
								<form method="POST" action="?/reissue">
									<input type="hidden" name="group" value={room.id}/>
									<button class="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-white" type="submit">
										<Link2 size={14}/> Создать индивидуальные ссылки и отключить пароли
									</button>
								</form>
							</div>
						{:else}
							<div class="grid gap-3 sm:grid-cols-2">
								{#each room.invites as invite (invite.token)}
									<div class="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
										<div class="flex items-center justify-between gap-2">
											<span class="text-sm font-semibold text-stone-800">
												{invite.label}
											</span>
											<span class="flex items-center gap-1 text-xs text-stone-400">
												<Clock3 size={12}/> до {expiry(invite.expires)}
											</span>
										</div>
										<p class="mt-2 break-all text-xs text-stone-400">
											Личная ссылка. Пароль не потребуется.
										</p>
										<div class="mt-3 flex flex-wrap gap-2">
											<button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700" onclick={() => copyLink(room.id, invite)}>
												<Copy size={14}/> {copied === invite.token ? 'Скопировано' : 'Копировать ссылку'}
											</button>
											<a href={inviteUrl(room.id, invite)} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 hover:bg-stone-100">
												<ExternalLink size={14}/> Открыть
											</a>
										</div>
									</div>
								{/each}
							</div>
							<form method="POST" action="?/reissue">
								<input type="hidden" name="group" value={room.id}/>
								<button type="submit" class="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50" title="Все прежние приглашения перестанут работать">
									<RefreshCw size={14}/> Перевыпустить все ссылки
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<p class="text-xs leading-relaxed text-stone-500">
		Ссылка дает доступ без дополнительного подтверждения личности: отправляйте ее только нужному человеку.
		Если ссылка утекла, перевыпустите приглашения. Токены находятся в фрагменте URL и не отправляются
		серверу сайта в адресе HTTP-запроса.
	</p>
</div>
