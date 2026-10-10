<script lang="ts">
	import { onMount } from 'svelte';
	import { createWakeLock } from '$lib/client/wakeLock';
	import Button from '$lib/components/ui/Button.svelte';
	import PlayLobby from '$lib/components/play/PlayLobby.svelte';
	import PlayQuestion from '$lib/components/play/PlayQuestion.svelte';
	import PlayFinished from '$lib/components/play/PlayFinished.svelte';
	import PausedScreen from '$lib/components/play/PausedScreen.svelte';
	import CountdownScreen from '$lib/components/play/CountdownScreen.svelte';
	import type { RoomAction, RoomView } from '$lib/data/game-room-types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let view = $state<RoomView | null>(null);
	let joined = $state(data.preview?.joined ?? false);
	let gone = $state(false);
	let offline = $state(false);
	let name = $state('');
	let error = $state('');
	let busy = $state(false);

	let source: EventSource | null = null;
	// Разница часов сервера и клиента: таймер считаем по серверному дедлайну
	let clockOffset = 0;
	let now = $state(Date.now());

	// Срок на вопросе — endsAt, на показе ответа — nextAt, до вопроса — startsAt:
	// одна и та же полоса отсчитывает все три
	const deadline = $derived(view?.endsAt ?? view?.nextAt ?? view?.startsAt ?? null);
	const remainingMs = $derived(
		deadline ? Math.max(0, deadline - (now + clockOffset)) : (view?.timeLimitMs ?? 0)
	);
	const shareUrl = $derived(
		typeof location === 'undefined' ? '' : `${location.origin}/play/${data.code}`
	);

	// Поток считается мёртвым, если от сервера давно ничего нет (ping приходит каждые 15 с).
	// Так бывает после сна телефона или смены сети: браузер может не заметить обрыв
	const STALE_MS = 40_000;
	let lastMessageAt = Date.now();

	function connect() {
		source?.close();
		lastMessageAt = Date.now();
		source = new EventSource(`/play/${data.code}/events`);
		source.onmessage = (event) => {
			const next: RoomView = JSON.parse(event.data);
			clockOffset = next.serverNow - Date.now();
			lastMessageAt = Date.now();
			// Сообщение об ошибке относится к прошлому шагу игры
			if (
				!view ||
				next.phase !== view.phase ||
				next.index !== view.index ||
				next.paused !== view.paused
			)
				error = '';
			view = next;
			offline = false;
		};
		source.addEventListener('ping', () => {
			lastMessageAt = Date.now();
			offline = false;
		});
		source.addEventListener('gone', () => {
			source?.close();
			source = null;
			gone = true;
		});
		// EventSource сам переподключается; пока связи нет — показываем плашку
		source.onerror = () => (offline = true);
	}

	function reconnectIfStale() {
		if (!joined || gone || !source) return;
		if (source.readyState === EventSource.CLOSED || Date.now() - lastMessageAt > STALE_MS) {
			offline = true;
			connect();
		}
	}

	function onVisibilityChange() {
		if (document.visibilityState !== 'visible') return;
		// Вернулись во вкладку: состояние могло уйти далеко вперёд, берём свежий снимок
		if (joined && !gone) connect();
	}

	async function send(action: RoomAction): Promise<boolean> {
		busy = true;
		error = '';
		try {
			const res = await fetch(`/play/${data.code}/act`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(action)
			});
			const body = await res.json();
			if (!body.ok) error = body.error ?? 'Что-то пошло не так';
			return body.ok === true;
		} catch {
			error = 'Нет связи с сервером';
			return false;
		} finally {
			busy = false;
		}
	}

	async function join(event: SubmitEvent) {
		event.preventDefault();
		if (await send({ type: 'join', name })) {
			joined = true;
			connect();
		}
	}

	// Пока идёт игра, экран не должен гаснуть: уснувший телефон рвёт поток событий
	const wakeLock = createWakeLock();
	$effect(() => {
		if (view && view.phase !== 'finished') wakeLock.hold();
		else wakeLock.release();
	});

	// Всё, что трогает document/window и таймеры, — только в браузере: onDestroy в Svelte
	// выполняется и при серверном рендере, поэтому очистка возвращается из onMount
	onMount(() => {
		if (joined) connect();
		const ticker = setInterval(() => {
			now = Date.now();
			reconnectIfStale();
		}, 200);
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('online', onVisibilityChange);

		return () => {
			source?.close();
			wakeLock.release();
			clearInterval(ticker);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('online', onVisibilityChange);
		};
	});
</script>

<svelte:head>
	<title>Викторина {data.code}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-10">
	{#if !data.preview || gone}
		<div class="space-y-4 text-center">
			<h1 class="text-2xl font-semibold">Комната не найдена</h1>
			<p class="text-muted-foreground">
				Возможно, игра закончилась или сервер перезапускался. Создайте новую комнату.
			</p>
			<Button href="/play">К викторинам</Button>
		</div>
	{:else if !joined}
		<form onsubmit={join} class="space-y-4">
			<div>
				<h1 class="text-2xl font-semibold">{data.preview.quizTitle}</h1>
				<p class="mt-1 text-muted-foreground">Вас позвали сыграть в викторину.</p>
			</div>
			{#if data.preview.phase !== 'lobby'}
				<p class="rounded-xl border border-border bg-card p-4 text-muted-foreground">
					Игра уже началась. Дождитесь, пока ведущий запустит новую партию, и откройте ссылку снова.
				</p>
			{:else if data.preview.full}
				<p class="rounded-xl border border-border bg-card p-4 text-muted-foreground">
					В комнате нет свободных мест.
				</p>
			{:else}
				<label class="block">
					<span class="mb-1 block text-sm font-medium">Ваше имя</span>
					<input
						type="text"
						bind:value={name}
						maxlength="20"
						required
						autocomplete="nickname"
						class="w-full rounded-lg border-border bg-card px-4 py-3 focus:border-primary focus:ring-primary"
					/>
				</label>
				{#if error}
					<p class="text-sm text-destructive" role="alert">{error}</p>
				{/if}
				<Button type="submit" disabled={busy || !name.trim()} class="w-full">Войти в комнату</Button
				>
			{/if}
		</form>
	{:else if !view}
		<p class="text-center text-muted-foreground">Подключаемся…</p>
	{:else}
		{#if offline}
			<p class="mb-4 rounded-lg bg-muted px-4 py-2 text-center text-sm" role="status">
				Связь потеряна, переподключаемся…
			</p>
		{/if}
		{#if error}
			<p class="mb-4 text-center text-sm text-destructive" role="alert">{error}</p>
		{/if}

		{#if view.phase === 'lobby'}
			<PlayLobby {view} {shareUrl} {busy} onstart={() => send({ type: 'start' })} />
		{:else if view.phase === 'finished'}
			<PlayFinished {view} {busy} onrestart={() => send({ type: 'restart' })} />
		{:else if view.phase === 'countdown'}
			<CountdownScreen {view} {remainingMs} {busy} onpause={() => send({ type: 'pause' })} />
		{:else}
			<PlayQuestion
				{view}
				{remainingMs}
				{busy}
				onanswer={(answer) => send({ type: 'answer', ...answer })}
				onpause={() => send({ type: 'pause' })}
			/>
		{/if}
		{#if view.paused}
			<PausedScreen isHost={view.you.isHost} {busy} onresume={() => send({ type: 'resume' })} />
		{/if}
	{/if}
</div>
