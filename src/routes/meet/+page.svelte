<script lang="ts">
	import { onMount } from 'svelte';
	import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Settings2, ShieldCheck, Copy, Check, Video, AlertCircle, ArrowRight, LoaderCircle } from '@lucide/svelte';

	let videoElement: HTMLVideoElement;
	let stream: MediaStream | null = $state(null);
	let cameraEnabled = $state(true);
	let micEnabled = $state(true);
	let deviceError = $state('');
	let loading = $state(false);
	let name = $state('');
	let copied = $state(false);
	let room = $state('');
	let status = $state<'preview' | 'unavailable'>('preview');

	const stopStream = () => {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
	};

	async function startPreview() {
		if (!navigator.mediaDevices?.getUserMedia) {
			deviceError = 'Камера доступна только по HTTPS или на localhost.';
			return;
		}
		loading = true;
		deviceError = '';
		try {
			stopStream();
			const nextStream = await navigator.mediaDevices.getUserMedia({
				video: cameraEnabled,
				audio: micEnabled
			});
			stream = nextStream;
			if (videoElement) {
				videoElement.srcObject = nextStream;
				await videoElement.play().catch(() => {});
			}
		} catch {
			deviceError = 'Не удалось получить доступ к камере или микрофону. Проверьте разрешения браузера.';
		} finally {
			loading = false;
		}
	}

	async function toggleCamera() {
		cameraEnabled = !cameraEnabled;
		const track = stream?.getVideoTracks()[0];
		if (track) track.enabled = cameraEnabled;
		else if (cameraEnabled) await startPreview();
	}

	async function toggleMic() {
		micEnabled = !micEnabled;
		const track = stream?.getAudioTracks()[0];
		if (track) track.enabled = micEnabled;
		else if (micEnabled) await startPreview();
	}

	async function copyRoomLink() {
		if (!room) return;
		try {
			await navigator.clipboard.writeText(window.location.origin + '/meet?room=' + encodeURIComponent(room));
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			deviceError = 'Не удалось скопировать ссылку.';
		}
	}

	onMount(() => {
		room = new URLSearchParams(window.location.search).get('room') || '';
		startPreview();
		return stopStream;
	});
</script>

<svelte:head>
	<title>Видеовстреча — Андрей Калмыков</title>
	<meta name="description" content="Пространство для онлайн-встреч. Проверьте камеру и микрофон перед звонком." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="meeting-page">
	<header class="topbar">
		<a href="/" class="brand" aria-label="Вернуться на сайт">
			<span class="brand-mark">к<span>.</span></span>
			<span class="brand-text">Андрей Калмыков <small>Видеовстречи</small></span>
		</a>
		<div class="top-status"><span class="status-dot"></span> Приватное пространство</div>
	</header>

	<main class="content">
		<div class="copy">
			<div class="eyebrow"><span class="eyebrow-dot"></span> Онлайн-встреча</div>
			<h1>Хорошо, что вы <em>здесь.</em></h1>
			<p class="intro">Устройтесь поудобнее. Перед встречей можно проверить камеру и микрофон — это займет всего пару секунд.</p>
			<div class="privacy"><ShieldCheck size={19} strokeWidth={1.8}/><div><strong>Только вы и ваш собеседник</strong><span>Подключение будет доступно после настройки сервера видеосвязи.</span></div></div>
		</div>

		<section class="preview-panel" aria-label="Подготовка ко встрече">
			<div class="video-frame">
				<video bind:this={videoElement} autoplay playsinline muted class:invisible={!cameraEnabled || !stream}></video>
				{#if !cameraEnabled || !stream}
					<div class="video-placeholder">
						<div class="avatar"><Video size={30} strokeWidth={1.4}/></div>
						<span>{cameraEnabled ? (loading ? 'Подключаем камеру…' : 'Предпросмотр камеры') : 'Камера выключена'}</span>
					</div>
				{/if}
				<div class="video-label"><span class="live-dot"></span> Вы</div>
				<div class="video-controls">
					<button type="button" class:off={!micEnabled} onclick={toggleMic} aria-label={micEnabled ? 'Выключить микрофон' : 'Включить микрофон'} title={micEnabled ? 'Выключить микрофон' : 'Включить микрофон'}>{#if micEnabled}<Mic size={21}/>{:else}<MicOff size={21}/>{/if}</button>
					<button type="button" class:off={!cameraEnabled} onclick={toggleCamera} aria-label={cameraEnabled ? 'Выключить камеру' : 'Включить камеру'} title={cameraEnabled ? 'Выключить камеру' : 'Включить камеру'}>{#if cameraEnabled}<Camera size={21}/>{:else}<CameraOff size={21}/>{/if}</button>
					<button type="button" onclick={startPreview} aria-label="Обновить предпросмотр" title="Обновить предпросмотр"><Settings2 size={20}/></button>
				</div>
			</div>
			{#if deviceError}<p class="error" role="alert"><AlertCircle size={16}/>{deviceError}</p>{/if}
			<div class="form-area">
				<label for="display-name">Как к вам обращаться?</label>
				<input id="display-name" maxlength="60" placeholder="Ваше имя" bind:value={name} autocomplete="name" />
				{#if room}
					<div class="room-info"><span>Комната: <strong>{room}</strong></span><button type="button" onclick={copyRoomLink} aria-label="Скопировать ссылку на комнату">{#if copied}<Check size={17}/>{:else}<Copy size={17}/>{/if}</button></div>
				{/if}
				<button type="button" class="join" onclick={() => (status = 'unavailable')} disabled={!name.trim()}>Присоединиться ко встрече <ArrowRight size={19}/></button>
				{#if status === 'unavailable'}<div class="unavailable" role="status"><AlertCircle size={18}/>Сервер видеосвязи пока не подключен. Предпросмотр камеры работает, но присоединиться к звонку еще нельзя.</div>{:else}<p class="hint">Никакой регистрации и установки приложений</p>{/if}
			</div>
		</section>
	</main>
	<footer class="bottom"><span>© {new Date().getFullYear()} Андрей Калмыков</span><span>Пространство для спокойного разговора</span></footer>
</div>

<style>
	:global(body) { margin: 0; }
	:global(body:has(.meeting-page)) { background: #f7f6f2; }
	.meeting-page { min-height: 100svh; display: flex; flex-direction: column; background: #f7f6f2; color: #292e29; font-family: 'Aeonik', system-ui, sans-serif; }
	.topbar { height: 98px; padding: 0 clamp(24px, 6vw, 104px); display: flex; justify-content: space-between; align-items: center; }
	.brand { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 13px; }
	.brand-mark { font-family: Georgia, serif; font-size: 43px; font-weight: 700; letter-spacing: -5px; line-height: 1; }.brand-mark span { color: #b69d73; }
	.brand-text { font-size: 14px; font-weight: 650; letter-spacing: -.02em; }.brand-text small { display: block; font-weight: 400; color: #81857c; margin-top: 3px; font-size: 12px; letter-spacing: .02em; }
	.top-status { font-size: 12px; color: #777f71; display: flex; align-items: center; gap: 9px; }.status-dot,.eyebrow-dot,.live-dot { height: 7px; width: 7px; border-radius: 100%; background: #8b9f80; display: inline-block; }
	.content { flex: 1; width: min(1180px, calc(100% - 48px)); margin: auto; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.06fr); align-items: center; gap: clamp(50px,7vw,125px); padding: 36px 0 80px; }
	.copy { max-width: 510px; }.eyebrow { text-transform: uppercase; letter-spacing: .17em; color: #899280; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
	h1 { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(43px,5vw,73px); font-weight: 400; letter-spacing: -.055em; line-height: 1.09; margin: 0 0 25px; }h1 em { color: #849679; font-weight: 400; }
	.intro { font-size: 17px; line-height: 1.76; color: #797d75; max-width: 405px; margin: 0; }
	.privacy { border-top: 1px solid #e2e2da; padding-top: 26px; display: flex; gap: 13px; color: #829576; margin-top: 53px; max-width: 400px; }.privacy strong { display: block; font-size: 13px; color: #4c5647; margin-bottom: 6px; font-weight: 600; }.privacy span { display: block; font-size: 12px; line-height: 1.6; color: #92958c; }
	.preview-panel { padding: 13px 13px 25px; border: 1px solid #e8e7df; background: #fff; border-radius: 22px; box-shadow: 0 18px 60px #343d3020; max-width: 580px; width: 100%; }
	.video-frame { aspect-ratio: 1.38; min-height: 250px; background: #252d29; border-radius: 14px; overflow: hidden; position: relative; }.video-frame video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }.video-frame video.invisible { visibility: hidden; }.video-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; color: #b9c2b7; font-size: 13px; }.avatar { width: 76px; height: 76px; background: #414d45; border-radius: 50%; display: grid; place-items: center; color: #d9e1d5; }
	.video-label { position: absolute; bottom: 20px; left: 19px; color: white; font-size: 12px; display: flex; align-items: center; gap: 8px; background: #161d19a8; padding: 8px 12px; border-radius: 8px; }.video-controls { display: flex; gap: 9px; position: absolute; bottom: 16px; right: 17px; }.video-controls button { width: 43px; height: 43px; display: grid; place-items: center; border-radius: 50%; border: 1px solid #ffffff24; background: #414c44dd; color: #fff; cursor: pointer; }.video-controls button.off { background: #bc695c; }.video-controls button:hover { filter: brightness(1.2); }
	.form-area { padding: 25px 23px 0; }.form-area label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 11px; }.form-area input { width: 100%; border-radius: 10px; border: 1px solid #dedfd8; background: #fbfbf9; padding: 14px 15px; font: inherit; font-size: 14px; outline: none; box-sizing: border-box; }.form-area input:focus { border-color: #8b9d80; box-shadow: 0 0 0 3px #8b9d8020; }
	.join { margin-top: 16px; display: flex; justify-content: center; align-items: center; gap: 13px; width: 100%; background: #52674f; color: white; border: none; border-radius: 10px; min-height: 51px; font: inherit; font-weight: 600; font-size: 14px; cursor: pointer; }.join:hover { background: #40563d; }.join:disabled { background: #a3ada0; cursor: not-allowed; }.hint { text-align: center; font-size: 11px; color: #9c9f98; margin: 14px 0 0; }
	.error,.unavailable { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 1.5; color: #a84e43; margin: 12px 18px 0; }.unavailable { background: #fff5eb; color: #8d6541; padding: 12px; border-radius: 8px; margin: 14px 0 0; }.room-info { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: #747a72; }.room-info button { border: none; background: transparent; cursor: pointer; color: #52674f; }
	.bottom { padding: 25px clamp(24px,6vw,104px); border-top: 1px solid #e7e6de; display: flex; justify-content: space-between; font-size: 11px; color: #969991; }
	@media (max-width: 850px) { .topbar { height: 80px; }.content { grid-template-columns: 1fr; max-width: 550px; gap: 33px; padding: 30px 0 65px; }.copy { max-width: 100%; }.eyebrow { margin-bottom: 17px; }h1 { margin-bottom: 18px; }.intro { font-size: 15px; }.privacy { display: none; }.preview-panel { box-sizing: border-box; }.bottom { gap: 15px; } }
	@media (max-width: 480px) { .top-status { font-size: 0; }.top-status .status-dot { width: 9px; height: 9px; }.content { width: calc(100% - 28px); padding-top: 12px; }.video-frame { min-height: 220px; }.preview-panel { padding: 8px 8px 18px; border-radius: 18px; }.form-area { padding: 20px 13px 0; }.bottom { flex-direction: column; gap: 5px; }.video-controls button { width: 38px; height: 38px; } }
</style>