<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Video, Clock3, ShieldCheck, Volume2, VolumeX, RefreshCw, AlertCircle } from '@lucide/svelte';

	type Status = {
		id: string;
		title: string;
		startAt: string;
		durationSeconds: number;
		ready: boolean;
		serverNow: number;
		state?: string;
	};
	const id = page.params.id;
	let webinar: Status | null = $state(null);
	let now = $state(Date.now());
	let serverOffset = 0;
	let loading = $state(true);
	let error = $state('');
	let playbackError = $state('');
	let muted = $state(true);
	let player: HTMLVideoElement | null = null;
	let retryAt = 0;

	const stage = $derived.by(() => {
		if (!webinar) return 'loading';
		if (!webinar.ready) return 'draft';
		const start = Date.parse(webinar.startAt);
		if (now < start) return 'waiting';
		if (now >= start + webinar.durationSeconds * 1000) return 'ended';
		return 'live';
	});
	const elapsed = $derived(webinar ? Math.max(0, (now - Date.parse(webinar.startAt)) / 1000) : 0);
	const remaining = $derived(webinar ? Math.max(0, Math.ceil((Date.parse(webinar.startAt) - now) / 1000)) : 0);
	const countdown = $derived(String(Math.floor(remaining / 3600)).padStart(2, '0') + ':' +
		String(Math.floor((remaining % 3600) / 60)).padStart(2, '0') + ':' +
		String(remaining % 60).padStart(2, '0'));

	function applyStatus(result: Status) {
		serverOffset = result.serverNow - Date.now();
		now = Date.now() + serverOffset;
		webinar = result;
	}
	async function refreshStatus() {
		if (!webinar) return;
		try {
			const r = await fetch('/api/webinars/' + id + '/status', { cache: 'no-store' });
			if (r.ok) applyStatus(await r.json() as Status);
		} catch {
			// The local clock still advances; video shows connection issues.
		}
	}
	async function connect() {
		loading = true;
		try {
			const token = new URLSearchParams(window.location.hash.slice(1)).get('key');
			const url = '/api/webinars/' + id;
			let result: Response;
			if (token) {
				result = await fetch(url + '/session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ key: token })
				});
			} else {
				// Works after a refresh: the invitation was exchanged for an
				// HttpOnly cookie, no secret needs to remain in the address bar.
				result = await fetch(url + '/status', { cache: 'no-store' });
			}
			if (!result.ok) throw new Error('Приглашение недействительно. Запросите новую ссылку у организатора.');
			applyStatus(await result.json() as Status);
			if (token) window.history.replaceState(null, '', window.location.pathname);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось подключиться.';
		} finally {
			loading = false;
		}
	}

	function syncPlayback() {
		if (!player || !webinar || stage !== 'live' || !Number.isFinite(player.duration)) return;
		const target = Math.max(0, Math.min(webinar.durationSeconds - 0.1, elapsed));
		if (Math.abs(player.currentTime - target) > 3) {
			try { player.currentTime = target; } catch {}
		}
	}
	function play() {
		if (!player) return;
		syncPlayback();
		void player.play().then(() => { playbackError = ''; }).catch(() => {
			playbackError = 'Нажмите кнопку воспроизведения, чтобы продолжить.';
		});
	}
	function markStalled() {
		playbackError = 'Соединение прервалось. Восстанавливаем воспроизведение…';
	}
	function retryVideo() {
		if (!player || stage !== 'live') return;
		if (Date.now() < retryAt) return;
		retryAt = Date.now() + 6000;
		player.load();
	}

	onMount(() => {
		void connect();
		const ticker = window.setInterval(() => {
			now = Date.now() + serverOffset;
			syncPlayback();
			if (stage === 'live' && playbackError && Date.now() >= retryAt) retryVideo();
			if (stage === 'ended' && player) player.pause();
		}, 1000);
		const clock = window.setInterval(() => void refreshStatus(), 20000);
		return () => { window.clearInterval(ticker); window.clearInterval(clock); };
	});
</script>

<svelte:head>
	<title>{webinar?.title || 'Автовебинар'} — Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow"/>
	<meta name="referrer" content="no-referrer"/>
</svelte:head>

<div class="webinar">
	<header><a href="/" class="brand">к<span>.</span> <small>Видеовебинар</small></a><span class="secure"><ShieldCheck size={17}/> Доступ по приглашению</span></header>
	<main>
		{#if loading}
			<div class="panel"><Clock3 size={36}/><h1>Подключаемся к вебинару…</h1></div>
		{:else if error}
			<div class="panel"><AlertCircle size={38}/><h1>Не удалось войти</h1><p>{error}</p></div>
		{:else if webinar}
			<div class="heading"><div class="eyebrow">Онлайн-вебинар</div><h1>{webinar.title}</h1></div>
			<div class="player">
				{#if stage === 'draft'}
					<div class="panel"><Clock3 size={38}/><h2>Организатор готовит видео</h2></div>
				{:else if stage === 'waiting'}
					<div class="panel"><Clock3 size={38}/><h2>До начала осталось</h2><div class="countdown">{countdown}</div><p>Вебинар начнется {new Date(webinar.startAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
				{:else if stage === 'live'}
					<video bind:this={player} autoplay muted={muted} playsinline preload="metadata"
						src={'/api/webinars/' + id + '/video'}
						onloadedmetadata={syncPlayback}
						onplaying={() => playbackError = ''}
						onwaiting={markStalled}
						onstalled={markStalled}
						onerror={markStalled}></video>
					{#if playbackError}<div class="problem"><AlertCircle size={18}/>{playbackError}<button onclick={retryVideo}><RefreshCw size={16}/> Повторить</button></div>{/if}
					<div class="video-controls">
						<span class="live">● В эфире</span>
						<button type="button" onclick={play}>Продолжить показ</button>
						<button type="button" onclick={() => { muted = !muted; if (player) { player.muted = muted; play(); } }} aria-label={muted ? 'Включить звук' : 'Выключить звук'}>
							{#if muted}<VolumeX size={20}/>{:else}<Volume2 size={20}/>{/if} {muted ? 'Включить звук' : 'Звук включен'}
						</button>
					</div>
				{:else}
					<div class="panel"><Video size={38}/><h2>Вебинар завершился</h2><p>Спасибо за участие!</p></div>
				{/if}
			</div>
			<p class="caption">
				Просмотр синхронизируется со временем сервера. Если вы присоединились позже, запись начнется с текущего момента показа.
				Если видео остановилось, нажмите «Продолжить показ».
			</p>
		{/if}
	</main>
	<footer>© Андрей Калмыков</footer>
</div>

<style>
	:global(body:has(.webinar)){background:#f7f6f2}
	.webinar{font-family:system-ui,sans-serif;background:#f7f6f2;min-height:100svh;color:#2b342e;display:flex;flex-direction:column}
	header{height:82px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(22px,5vw,80px)}
	.brand{text-decoration:none;color:#304031;font:700 36px Georgia,serif}.brand span{color:#b69e73}.brand small{font:400 13px system-ui;color:#7e8980;vertical-align:middle;margin-left:14px}
	.secure{color:#718572;font-size:12px;display:flex;align-items:center;gap:9px}
	main{width:min(1060px,calc(100% - 32px));margin:36px auto 60px;flex:1}.heading{margin:0 0 26px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#879e86;font-weight:700;margin-bottom:12px}
	h1{font:normal clamp(27px,4vw,50px)/1.12 Georgia,serif;margin:0}
	.player{background:#212923;position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;color:white;box-shadow:0 18px 60px #27362729}
	.player video{width:100%;height:100%;display:block;background:black;object-fit:contain}
	.panel{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;min-height:100%;padding:20px}
	.panel svg{color:#94ac92}.panel h2{font:normal clamp(24px,3vw,37px) Georgia,serif;margin:0}.panel h1{font-size:27px}.panel p{font-size:13px;color:#aebdb0;margin:0}
	.countdown{font-variant-numeric:tabular-nums;font-size:clamp(37px,7vw,75px);font-weight:700;letter-spacing:.06em}
	.video-controls{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;gap:15px;padding:15px 22px;background:linear-gradient(transparent,#000b);flex-wrap:wrap}
	.video-controls button,.problem button{border:0;background:#e7f1e4;color:#273d2c;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px}
	.video-controls .live{background:#bb5748;padding:6px 9px;border-radius:6px;font-size:12px;font-weight:700;margin-right:auto}
	.problem{position:absolute;top:14px;left:14px;right:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:8px;background:#743d36eb;color:white;font-size:13px}
	.caption{max-width:760px;color:#829184;line-height:1.7;font-size:12px;margin-top:20px}
	footer{padding:25px clamp(20px,5vw,80px);border-top:1px solid #e3e8df;font-size:11px;color:#9aa79d}
	@media(max-width:600px){header{height:67px}.secure{font-size:0}.player{aspect-ratio:4/5}.video-controls{padding:10px;gap:8px}.video-controls button{padding:7px 9px}.panel{gap:12px}}
</style>
