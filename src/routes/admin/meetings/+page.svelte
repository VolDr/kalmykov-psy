<script lang="ts">
	import { Copy, Plus, Trash2, RefreshCw, Video, ShieldCheck, KeyRound, ExternalLink } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let deleting = $state<string | null>(null);
	let title = $state('Консультация');
	let maxClients = $state(2);
	let copied = $state('');
	const created = $derived(form && 'created' in form ? form.created : null);
	const rotated = $derived(form && 'rotated' in form ? form.rotated : null);
	const error = $derived(form && 'error' in form ? form.error : null);

	const link = (group: string, role: 'host' | 'guest' = 'guest') =>
		'/meet?room=' + encodeURIComponent(group) + (role === 'host' ? '&name=host' : '');

	async function copy(value: string, key: string, absolute = false) {
		try {
			await navigator.clipboard.writeText(absolute ? new URL(value, window.location.origin).href : value);
			copied = key;
			window.setTimeout(() => { if (copied === key) copied = ''; }, 2000);
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
			<h1 class="flex items-center gap-2 text-2xl font-semibold"><Video size={24} /> Видеовстречи</h1>
			<p class="mt-2 text-sm text-stone-500">Приватные комнаты Galene для консультаций и групповых встреч.</p>
		</div>
		<div class="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
			<ShieldCheck size={15} /> Управление доступно только администратору
		</div>
	</div>

	{#if data.backendError}
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
			<strong>Galene пока недоступен.</strong> {data.backendError}
			<p class="mt-2 text-xs">Создание комнат станет доступно после запуска Galene и настройки служебного доступа на VPS.</p>
		</div>
	{/if}

	{#if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div>
	{/if}

	{#if created}
		<div class="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
			<h2 class="font-semibold text-emerald-900">Комната создана: {created.group}</h2>
			<p class="text-sm text-emerald-950">Сохраните оба пароля: они показаны только после создания и не хранятся в админке в открытом виде.</p>
			<div class="grid gap-3 md:grid-cols-2">
				{#each [{ label: 'Ведущий (логин host)', role: 'host', password: created.hostPassword }, { label: 'Клиент (любое имя)', role: 'guest', password: created.guestPassword }] as user (user.role)}
					<div class="rounded-lg border border-emerald-200 bg-white p-3">
						<div class="mb-2 text-sm font-medium">{user.label}</div>
						<code class="block break-all rounded bg-stone-50 p-2 text-sm">{user.password}</code>
						<div class="mt-3 flex flex-wrap gap-3">
							<button type="button" class="flex items-center gap-1 text-xs text-emerald-800 underline" onclick={() => copy(user.password, 'pwd-' + user.role)}><Copy size={13} /> {copied === 'pwd-' + user.role ? 'Скопировано' : 'Копировать пароль'}</button>
							<button type="button" class="flex items-center gap-1 text-xs text-emerald-800 underline" onclick={() => copy(link(created.group, user.role as 'host' | 'guest'), 'url-' + user.role, true)}><Copy size={13} /> {copied === 'url-' + user.role ? 'Скопировано' : 'Копировать ссылку'}</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if rotated}
		<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
			<p class="font-semibold text-emerald-900">Новый пароль для {rotated.who === 'host' ? 'ведущего' : 'клиента'} — {rotated.group}</p>
			<code class="block break-all rounded bg-white p-3 text-sm">{rotated.secret}</code>
			<button type="button" class="flex items-center gap-1 text-sm text-emerald-800 underline" onclick={() => copy(rotated.secret, 'rotated')}><Copy size={14}/> {copied === 'rotated' ? 'Скопировано' : 'Копировать пароль'}</button>
			<p class="text-xs text-emerald-900">Предыдущий пароль больше не будет работать. Сохраните новый сейчас.</p>
		</div>
	{/if}

	<section class="rounded-xl border bg-white p-5 shadow-sm">
		<h2 class="mb-1 flex items-center gap-2 text-lg font-semibold"><Plus size={19}/> Новая комната</h2>
		<p class="mb-5 text-sm text-stone-500">Создается непосредственно в Galene, со случайными паролями для ведущего и клиента. Запись отключена.</p>
		<form action="?/create" method="POST" class="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_125px_auto]">
			<label class="block text-sm font-medium text-stone-700">
				Название комнаты
				<input class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm" name="title" bind:value={title} maxlength="60" required />
			</label>
			<label class="block text-sm font-medium text-stone-700">
				Участников
				<select name="maxClients" bind:value={maxClients} class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm">
					<option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option><option value={12}>12</option>
				</select>
			</label>
			<button class="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40" disabled={!data.configured || !!data.backendError} type="submit"><Plus size={16}/> Создать</button>
		</form>
	</section>

	<section class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="flex items-center justify-between border-b p-5"><h2 class="text-lg font-semibold">Мои комнаты ({data.rooms.length})</h2><span class="text-xs text-stone-400">Только созданные через админку</span></div>
		{#if data.rooms.length === 0}
			<div class="p-10 text-center text-sm text-stone-500">Пока нет комнат. Создайте первую выше.</div>
		{:else}
			<div class="divide-y">
				{#each data.rooms as room (room.id)}
					<div class="space-y-3 p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<div class="font-semibold">{room.title}</div><div class="font-mono text-xs text-stone-400">{room.id}{room.maxClients ? ` · до ${room.maxClients} участников` : ""}</div>
								<div class="flex flex-wrap items-center gap-3 text-xs">
									<a class="inline-flex items-center gap-1 text-blue-700 underline" href={link(room.id, 'host')} target="_blank" rel="noopener noreferrer">Войти как ведущий <ExternalLink size={13}/></a>
									<button type="button" class="inline-flex items-center gap-1 text-stone-600 underline" onclick={() => copy(link(room.id, 'guest'), 'link-' + room.id, true)}><Copy size={13}/> {copied === 'link-' + room.id ? 'Ссылка скопирована' : 'Приглашение клиенту'}</button>
								</div>
							</div>
							{#if deleting === room.id}
								<form method="POST" action="?/delete" class="flex flex-wrap items-center gap-2">
									<input type="hidden" name="group" value={room.id} /><input type="hidden" name="confirm" value={room.id}/>
									<span class="text-xs text-red-700">Удалить без возможности восстановления?</span>
									<button class="rounded-lg bg-red-700 px-3 py-2 text-xs text-white" type="submit">Удалить</button>
									<button type="button" class="rounded-lg border px-3 py-2 text-xs" onclick={() => deleting = null}>Отмена</button>
								</form>
							{:else}
								<button type="button" class="inline-flex items-center gap-1 text-xs text-red-700 hover:underline" onclick={() => deleting = room.id}><Trash2 size={14}/> Удалить</button>
							{/if}
						</div>
						<div class="flex flex-wrap gap-3">
							<form method="POST" action="?/rotate">
								<input type="hidden" name="group" value={room.id}/><input type="hidden" name="who" value="guest"/>
								<button type="submit" class="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"><RefreshCw size={14}/> Новый пароль клиента</button>
							</form>
							<form method="POST" action="?/rotate">
								<input type="hidden" name="group" value={room.id}/><input type="hidden" name="who" value="host"/>
								<button type="submit" class="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"><KeyRound size={14}/> Новый пароль ведущего</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	<p class="text-xs leading-relaxed text-stone-500">Пароли не включаются в ссылки. Передавайте приглашение и пароль клиенту по защищенному каналу. Для консультаций с персональными данными проверьте доступность соединения, защиту сервера и настройки приватности.</p>
</div>
