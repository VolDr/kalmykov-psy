<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, ShieldCheck, Copy, Check, ArrowRight, AlertCircle, MessageCircle, Send, X, Users, Video, RefreshCw, Sparkles, Hand, UserX, Trash2 } from '@lucide/svelte';
	import { ServerConnection } from '#lib/galene/protocol.js';
	import { createBackgroundBlur, type BlurSession, type BlurStrength } from '#lib/meet/background-blur.js';

	let { inviteRoom = '', inviteTokenValue = '', inviteCode = '' }: { inviteRoom?: string; inviteTokenValue?: string; inviteCode?: string } = $props();

	let localVideo: HTMLVideoElement;
	let localStream: MediaStream | null = $state(null);
	let displayStream: MediaStream | null = $state(null);
	type BlurMode = 'off' | 'light' | 'strong';
	const BLUR_STORAGE_KEY = 'kalmykov-meet-blur-mode';
	const BLUR_OPTIONS: { mode: BlurMode; label: string; strength: string }[] = [
		{ mode: 'off', label: 'Без размытия', strength: '0' },
		{ mode: 'light', label: 'Легкое', strength: '0.2' },
		{ mode: 'strong', label: 'Сильное', strength: '0.5' }
	];
	let blurMode = $state<BlurMode>('off');
	let blurMenuOpen = $state(false);
	let blurBusy = $state(false);
	let blurSession: BlurSession | null = null;
	let blurInput: MediaStream | null = null;
	let blurVersion = 0;
	let screenStream: MediaStream | null = $state(null);
	let outgoing: any = null;
	let screenOutgoing: any = null;
	let connection: any = null;
	let cameraEnabled = $state(true);
	let micEnabled = $state(true);
	let loading = $state(false);
	let error = $state('');
	const DISPLAY_NAME_KEY = 'kalmykov-meet-display-name';
	let name = $state('');
	let inviteToken = $state('');
	let room = $state('');
	let copied = $state(false);
	let state = $state<'preview'|'connecting'|'connected'>('preview');
	let participants: { id: string; source: string; name: string; stream: MediaStream | null; label: string; mediaStatus: string }[] = $state([]);
	let remoteUsers: { id: string; name: string; raised: boolean }[] = $state([]);
	let userCount = $state(1);
	let canPresent = $state(false);
	let isModerator = $state(false);
	let myHandRaised = $state(false);
	let membersOpen = $state(false);
	let chatOpen = $state(false);
	let chatText = $state('');
	let messages: { id: string; source: string; name: string; text: string; self: boolean }[] = $state([]);
	const streamAction = (node: HTMLVideoElement, value: MediaStream | null) => {
		node.srcObject = value;
		node.play().catch(() => {});
		return { update(next: MediaStream | null) { node.srcObject = next; if (next) node.play().catch(() => {}); }, destroy() { node.srcObject = null; } };
	};
	const stop = (media: MediaStream | null) => media?.getTracks().forEach(t => t.stop());
	const cleanRemote = () => { participants = []; remoteUsers = []; userCount = 1; myHandRaised = false; membersOpen = false; messages = []; };
	function closeConnection() {
		const old = connection;
		connection = null;
		try { old?.close(); } catch {}
		outgoing = null; screenOutgoing = null;
		stop(screenStream); screenStream = null;
		cleanRemote();
		isModerator = false;
	}
	async function preview() {
		if (!navigator.mediaDevices?.getUserMedia) { error = 'Для доступа к камере нужен HTTPS.'; return; }
		loading = true;
		error = '';
		try {
			const next = await navigator.mediaDevices.getUserMedia({ audio: micEnabled, video: cameraEnabled });
			blurVersion++;
			blurSession?.stop(); blurSession = null; blurInput = null;
			blurBusy = false;
			stop(localStream);
			localStream = next;
			displayStream = next;
			if (localVideo) { localVideo.srcObject = next; await localVideo.play().catch(() => {}); }
			if (blurMode !== 'off' && next.getVideoTracks().length) await applyBackgroundBlur();
			else if (state === 'connected' && canPresent) publishLocalMedia(next);
		} catch {
			error = 'Не удалось открыть камеру или микрофон. Проверьте разрешения браузера.';
		} finally { loading = false; }
	}
	async function toggleCamera() {
		cameraEnabled = !cameraEnabled;
		const track = localStream?.getVideoTracks()[0];
		if (track) track.enabled = cameraEnabled;
		else if (cameraEnabled) await preview();
	}
	async function toggleMic() {
		micEnabled = !micEnabled;
		const track = localStream?.getAudioTracks()[0];
		if (track) track.enabled = micEnabled;
		else if (micEnabled) await preview();
	}
	function publish(media: MediaStream, label: string) {
		if (!connection || !canPresent) return null;
		const c = connection.newUpStream();
		c.label = label;
		c.setStream(media);
		c.onerror = (e: unknown) => { error = 'Ошибка передачи видео: ' + String(e); };
		c.onstatus = (status: string) => {
			if (status === 'failed') error = 'Не удалось установить медиасоединение для отправки видео. Проверьте TURN и UDP-порты.';
		};
		// Follow Galene's reference client: explicit send-only transceivers ensure
		// that each upstream track is negotiated in both joining orders.
		media.getTracks().forEach(t => c.pc.addTransceiver(t, {
			direction: 'sendonly',
			streams: [media]
		}));
		return c;
	}
	function showLocalStream(stream: MediaStream | null) {
		if (!localVideo || state === 'connected') return;
		localVideo.srcObject = stream;
		if (stream) void localVideo.play().catch(() => {});
	}
	function saveBlurPreference() {
		try { window.localStorage.setItem(BLUR_STORAGE_KEY, blurMode); } catch {}
	}
	async function applyBackgroundBlur() {
		const ticket = ++blurVersion;
		const camera = localStream;
		if (blurMode === 'off' || !camera?.getVideoTracks().length) {
			blurSession?.stop();
			blurSession = null;
			blurInput = null;
			blurBusy = false;
			displayStream = camera;
			showLocalStream(camera);
			if (camera && state === 'connected' && canPresent) publishLocalMedia(camera);
			return;
		}

		blurBusy = true;
		const strength: BlurStrength = blurMode === 'light' ? 0.2 : 0.5;
		let newSession: BlurSession | null = null;
		try {
			if (blurSession && blurInput === camera) {
				// The resulting MediaStream and WebRTC sender stay unchanged.
				await blurSession.setStrength(strength);
				return;
			}
			newSession = await createBackgroundBlur(camera, strength, (message) => {
				if (blurInput !== camera || blurMode === 'off') return;
				error = 'Размытие фона отключено: ' + message;
				blurMode = 'off';
				saveBlurPreference();
				void applyBackgroundBlur();
			});
			// Do not publish a temporary unfiltered output while downloading
			// weights or initializing the GPU model.
			await newSession.ready;
			if (ticket !== blurVersion || localStream !== camera) return;
			blurSession?.stop();
			blurSession = newSession;
			blurInput = camera;
			displayStream = newSession.stream;
			showLocalStream(displayStream);
			if (state === 'connected' && canPresent) publishLocalMedia(displayStream);
			newSession = null; // now owned by blurSession
		} catch (cause) {
			if (ticket !== blurVersion) return;
			blurSession?.stop();
			blurSession = null;
			blurInput = null;
			blurMode = 'off';
			saveBlurPreference();
			displayStream = camera;
			showLocalStream(camera);
			if (camera && state === 'connected' && canPresent) publishLocalMedia(camera);
			error = 'Не удалось включить Longpipe: ' +
				(cause instanceof Error ? cause.message : String(cause));
		} finally {
			newSession?.stop();
			if (ticket === blurVersion) blurBusy = false;
		}
	}
	function chooseBlurMode(value: BlurMode) {
		if (blurBusy) return;
		blurMode = value;
		blurMenuOpen = false;
		saveBlurPreference();
		void applyBackgroundBlur();
	}
	function publishLocalMedia(stream: MediaStream) {
		if (!connection || !canPresent) return;
		try {
			outgoing?.close();
			outgoing = publish(stream, 'camera');
		} catch (e) {
			error = 'Не удалось передать видео: ' + (e instanceof Error ? e.message : String(e));
		}
	}
	async function join() {
		if (!name.trim() || !room.trim() || (!inviteCode && !inviteToken) || state !== 'preview') return;
		try { window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim()); } catch {}
		state = 'connecting'; error = '';
		try {
			// One invitation URL for everyone. Privileges come from the site's
			// authenticated admin session and are selected only on the server.
			let credential = inviteToken;
			if (inviteCode) {
				const access = await fetch('/api/meet/join', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ code: inviteCode }),
					cache: 'no-store',
					credentials: 'same-origin'
				});
				if (!access.ok) {
					const problem = await access.json().catch(() => null);
					throw new Error(problem?.error || 'Не удалось получить доступ к комнате.');
				}
				const accessData = await access.json();
				credential = accessData.token;
			}
			const response = await fetch('/api/meet/status?room=' + encodeURIComponent(room), {
				cache: 'no-store'
			});
			if (!response.ok) {
				const details = await response.json().catch(() => null);
				throw new Error(details?.error || 'Комната не найдена или сервер недоступен (' + response.status + ').');
			}
			const info = await response.json();
			const sc = new ServerConnection();
			connection = sc;
			sc.onconnected = () => { sc.join(info.name, name.trim(), { type: 'token', token: credential }).catch((e: Error) => { error = e.message; leave(); }); };
			sc.onerror = (e: unknown) => { error = 'Ошибка соединения: ' + String(e); };
			sc.onclose = () => { if (connection === sc) { connection = null; state = 'preview'; cleanRemote(); isModerator = false; } };
			sc.onjoined = (kind: string, group: string, perms: string[], _status: unknown, _data: unknown, code: string, message: string) => {
				if (kind === 'fail') { error = message || code || 'Не удалось войти в комнату.'; leave(); return; }
				if (kind === 'join') {
					try { window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim()); } catch {}
					state = 'connected';
					canPresent = perms.includes('present');
					isModerator = perms.includes('op');
					sc.request({ '': ['audio', 'video'] });
					if (displayStream && canPresent) publishLocalMedia(displayStream);
					if (!canPresent) error = 'У аккаунта нет права трансляции (present).';
				}
				if (kind === 'change') {
					canPresent = perms.includes('present');
					isModerator = perms.includes('op');
				}
			};
			sc.onuser = (id: string, kind: string) => {
				remoteUsers = Object.entries(sc.users)
					.filter(([userId]) => userId !== sc.id)
					.map(([userId, user]) => ({
						id: userId,
						name: (user as { username?: string }).username || 'Участник',
						raised: (user as { data?: { raisehand?: boolean } }).data?.raisehand === true
					}));
				myHandRaised = sc.users[sc.id]?.data?.raisehand === true;
				userCount = remoteUsers.length + 1;
				// Re-request tracks when a later participant begins presenting.
				// Without this, the first person in the room can miss the
				// stream that appeared after their initial track request.
				if (id !== sc.id && sc.group && (kind === 'add' || kind === 'change')) {
					sc.request({ '': ['audio', 'video'] });
				}
			};
			sc.ondownstream = (down: any) => {
				const update = (media: MediaStream | null, mediaStatus: string) => {
					const previous = participants.find(p => p.id === down.id);
					participants = [
						...participants.filter(p => p.id !== down.id),
						{
							id: down.id,
							source: down.source || '',
							name: down.username || previous?.name || 'Участник',
							stream: media || previous?.stream || null,
							label: down.label || 'camera',
							mediaStatus
						}
					];
				};
				// Show the participant immediately, even before the first
				// WebRTC track arrives, and surface a media connection failure.
				update(down.stream || null, 'connecting');
				down.ondowntrack = (_track: MediaStreamTrack, _transceiver: unknown, media: MediaStream) => {
					update(media, 'connected');
				};
				down.onnegotiationcompleted = () => {
					update(down.stream || null, down.stream ? 'connected' : 'connecting');
				};
				down.onstatus = (status: string) => {
					if (status === 'failed' || status === 'disconnected') {
						update(down.stream || null, status);
					}
				};
				down.onclose = () => { participants = participants.filter(p => p.id !== down.id); };
				down.onerror = (e: unknown) => {
					console.warn('Galene receive stream', e);
					update(down.stream || null, 'failed');
				};
			};
			sc.onchat = (id: string, source: string, _dest: string, username: string, _time: Date, _privileged: boolean, _history: boolean, kind: string, value: string) => {
				if (kind === 'caption') return;
				messages = [...messages.slice(-99), { id: id || crypto.randomUUID(), source: source || '', name: username || 'Участник', text: value, self: source === sc.id }];
			};
			sc.onusermessage = (_id: string, _dest: string, _username: string, _time: Date, privileged: boolean, kind: string, operationError: string, value: unknown) => {
				if (operationError) { error = 'Galene: ' + operationError; return; }
				if (kind === 'clearchat' && privileged) {
					const filter = value && typeof value === 'object' ? value as { id?: string; userId?: string } : null;
					if (!filter) messages = [];
					else messages = messages.filter(m => !((!filter.id || m.id === filter.id) && (!filter.userId || m.source === filter.userId)));
				}
			};
			sc.connect(info.endpoint);
		} catch (e) { error = e instanceof Error ? e.message : String(e); leave(); }
	}
	function leave() { closeConnection(); state = 'preview'; canPresent = false; }
	async function shareScreen() {
		if (screenStream) {
			screenOutgoing?.close(); screenOutgoing = null;
			stop(screenStream); screenStream = null; return;
		}
		try {
			const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
			screenStream = media;
			screenOutgoing = publish(media, 'screenshare');
			media.getVideoTracks()[0].addEventListener('ended', () => {
				screenOutgoing?.close(); screenOutgoing = null;
				stop(screenStream); screenStream = null;
			}, { once: true });
		} catch (e) { if ((e as Error)?.name !== 'NotAllowedError') error = 'Не удалось показать экран.'; }
	}
	function toggleHand() {
		if (!connection || state !== 'connected') return;
		try {
			connection.userAction('setdata', connection.id, { raisehand: myHandRaised ? null : true });
		} catch {
			error = 'Не удалось изменить статус поднятой руки.';
		}
	}
	function kickUser(id: string, username: string) {
		if (!isModerator || !connection || id === connection.id || !remoteUsers.some(user => user.id === id)) return;
		if (!window.confirm('Исключить участника «' + username + '» из встречи?')) return;
		try { connection.userAction('kick', id); }
		catch { error = 'Не удалось исключить участника.'; }
	}
	function clearChat(message?: { id: string; source: string; name: string }) {
		if (!isModerator || !connection) return;
		const prompt = message ? 'Удалить сообщение участника «' + message.name + '» для всех?' : 'Очистить историю чата для всех участников?';
		if (!window.confirm(prompt)) return;
		try {
			if (message) {
				if (!message.id || !message.source) throw new Error('Нет идентификатора сообщения.');
				connection.groupAction('clearchat', { id: message.id, userId: message.source });
			} else connection.groupAction('clearchat');
		} catch { error = 'Не удалось удалить сообщение или очистить чат.'; }
	}
	function sendChat() {
		const value = chatText.trim();
		if (!value || !connection) return;
		try { connection.chat('', '', value); chatText = ''; } catch { error = 'Сообщение не отправлено.'; }
	}
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true; window.setTimeout(() => copied = false, 1800);
		} catch { error = 'Не удалось скопировать ссылку.'; }
	}
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		room = inviteRoom || params.get('room') || '';
		const invite = new URLSearchParams(window.location.hash.replace(/^#/, ''));
		inviteToken = inviteTokenValue || invite.get('token') || '';
		try { name = window.localStorage.getItem(DISPLAY_NAME_KEY) || ''; } catch { name = ''; }
		try {
			const savedBlur = window.localStorage.getItem(BLUR_STORAGE_KEY);
			blurMode = savedBlur === 'light' || savedBlur === 'strong' ? savedBlur : 'off';
		} catch { blurMode = 'off'; }
		preview();
		return () => { blurVersion++; blurSession?.stop(); blurSession = null; blurInput = null; closeConnection(); stop(localStream); };
	});
</script>

<svelte:head>
	<title>Видеовстреча — Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
	<meta name="description" content="Защищенное пространство для онлайн-встреч." />
</svelte:head>

<div class="meet">
	<header class="header">
		<a class="brand" href="/"><span class="logo">к<span>.</span></span><span>Андрей Калмыков<small>Видеовстречи</small></span></a>
		<div class="private"><ShieldCheck size={17}/> Приватное пространство</div>
	</header>
	{#if state !== 'connected'}
		<main class="prejoin">
			<section class="intro">
				<div class="eyebrow">● &nbsp; Онлайн-встреча</div>
				<h1>Хорошо, что вы <em>здесь.</em></h1>
				<p>Устройтесь поудобнее. Проверьте камеру и микрофон перед встречей.</p>
				<div class="notice"><ShieldCheck size={20}/><div><strong>Доступ только по приглашению</strong><span>Одна ссылка на комнату для всех участников.</span></div></div>
			</section>
			<section class="panel">
				<div class="video">
					<video bind:this={localVideo} autoplay muted playsinline class:hidden={!cameraEnabled || !localStream}></video>
					{#if !cameraEnabled || !localStream}<div class="placeholder"><div class="avatar"><Video size={31}/></div>{loading ? 'Подключаем камеру…' : cameraEnabled ? 'Предпросмотр камеры' : 'Камера выключена'}</div>{/if}
					<div class="userlabel">Вы</div>
					<div class="video-buttons">
						<button onclick={toggleMic} class:off={!micEnabled} title={micEnabled ? 'Выключить микрофон' : 'Включить микрофон'} aria-label="Микрофон">{#if micEnabled}<Mic size={21}/>{:else}<MicOff size={21}/>{/if}</button>
						<button onclick={toggleCamera} class:off={!cameraEnabled} title={cameraEnabled ? 'Выключить камеру' : 'Включить камеру'} aria-label="Камера">{#if cameraEnabled}<Camera size={21}/>{:else}<CameraOff size={21}/>{/if}</button>

						<button onclick={preview} title="Обновить устройства" aria-label="Обновить устройства"><RefreshCw size={20}/></button>
					</div>
				</div>
				<div class="fields">
					<div class="invitation-label"><ShieldCheck size={18}/><span>{inviteCode || inviteToken ? 'Доступ по ссылке на комнату' : 'Требуется ссылка-приглашение'}</span></div>
					<div class="invitation-info"><span>Комната</span><strong>{room || 'Не указана'}</strong></div>
					<label for="meet-name">Ваше имя перед входом</label><input id="meet-name" type="text" bind:value={name} placeholder="Введите имя" autocomplete="nickname" maxlength="60" required />
					<fieldset class="blur-prejoin" disabled={blurBusy || !cameraEnabled}>
						<legend><Sparkles size={15}/> Размытие фона {#if blurBusy}<span>— загружаем модель…</span>{/if}</legend>
						<div class="blur-choices">
							{#each BLUR_OPTIONS as choice (choice.mode)}
								<button type="button"
									class:selected={blurMode === choice.mode}
									aria-pressed={blurMode === choice.mode}
									onclick={() => chooseBlurMode(choice.mode)}>
									<span>{choice.label}</span><small>{choice.strength}</small>
								</button>
							{/each}
						</div>
					</fieldset>
					{#if !inviteCode && !inviteToken}<p class="invite-warning">Запросите личную ссылку у организатора встречи. Вход только по приглашению.</p>{/if}
					<button class="primary" onclick={join} disabled={(!inviteCode && !inviteToken) || !name.trim() || !room.trim() || state === 'connecting'}>{state === 'connecting' ? 'Подключаемся…' : 'Присоединиться ко встрече'}<ArrowRight size={19}/></button>
					<p class="hint">Без регистрации и установки приложений</p>
				</div>
			</section>
		</main>
	{:else}
		<main class="call">
			<div class="call-top"><div><strong>Встреча</strong><span>{room}</span></div><div class="call-meta">{#if isModerator}<span class="role-indicator moderator" title="Права ведущего подтверждены сервером Galene"><ShieldCheck size={15}/>Ведущий</span>{/if}<button type="button" class="members-trigger" onclick={() => { membersOpen = !membersOpen; if (membersOpen) chatOpen = false; }} aria-label="Список участников" aria-expanded={membersOpen}><Users size={17}/>{userCount}{#if remoteUsers.some(u => u.raised)}<Hand size={15}/>{/if}</button> <button onclick={copyLink} title="Скопировать свою ссылку">{#if copied}<Check size={17}/>{:else}<Copy size={17}/>{/if}</button></div></div>
			<div class="call-main">
				<div class="tiles">
					<div class="tile"><video use:streamAction={displayStream || localStream} autoplay muted playsinline class:dim={!cameraEnabled}></video>{#if myHandRaised}<div class="hand-indicator"><Hand size={16}/> Рука поднята</div>{/if}<div class="tile-label">Вы {#if isModerator} · Ведущий{/if} {#if !micEnabled}<MicOff size={14}/>{/if}</div></div>
					{#each participants as peer (peer.id)}
						<div class="tile">
							<video use:streamAction={peer.stream} autoplay playsinline></video>
							{#if remoteUsers.some(user => user.id === peer.source && user.raised)}<div class="hand-indicator"><Hand size={16}/> Рука поднята</div>{/if}
							{#if !peer.stream || peer.mediaStatus === 'failed' || peer.mediaStatus === 'disconnected'}
								<div class="peer-loading">
									{peer.mediaStatus === 'failed' ? 'Не удалось получить видео. Проверьте соединение.' : peer.mediaStatus === 'disconnected' ? 'Видеосвязь прервана. Пробуем восстановить…' : 'Подключаем видео…'}
								</div>
							{/if}
							<div class="tile-label">{peer.name}{peer.label === 'screenshare' ? ' · Экран' : ''}</div>
						</div>
					{/each}
					{#each remoteUsers.filter(user => !participants.some(peer => peer.source === user.id)) as user (user.id)}
						<div class="empty-tile">{#if user.raised}<Hand size={30}/>{:else}<Users size={36}/>{/if}<strong>{user.name}</strong><p>{user.raised ? 'Поднял руку' : 'Участник подключился, ожидаем его видео'}</p></div>
					{/each}
					{#if participants.length === 0 && remoteUsers.length === 0}<div class="empty-tile"><Users size={36}/><strong>Ожидаем собеседника</strong><p>Другой участник войдет по общей ссылке на комнату</p></div>{/if}
				</div>
				{#if membersOpen}
					<aside class="chat members-panel">
						<div class="chat-heading">Участники ({userCount}) <button onclick={() => membersOpen = false} aria-label="Закрыть список"><X size={19}/></button></div>
						<div class="members-list">
							<div class="member-row"><span>Вы {#if myHandRaised}<Hand size={17}/>{/if}</span>{#if isModerator}<small>Ведущий</small>{/if}</div>
							{#each remoteUsers as user (user.id)}
								<div class="member-row">
									<span>{user.name} {#if user.raised}<Hand size={17}/>{/if}</span>
									{#if isModerator}<button type="button" class="kick-action" onclick={() => kickUser(user.id, user.name)} title="Исключить участника" aria-label={'Исключить ' + user.name}><UserX size={16}/></button>{/if}
								</div>
							{/each}
						</div>
					</aside>
				{:else if chatOpen}
					<aside class="chat">
						<div class="chat-heading">Сообщения
							<div class="chat-heading-actions">
								{#if isModerator && messages.length}<button title="Очистить весь чат" aria-label="Очистить весь чат" onclick={() => clearChat()}><Trash2 size={17}/></button>{/if}
								<button onclick={() => chatOpen = false} aria-label="Закрыть чат"><X size={19}/></button>
							</div>
						</div>
						<div class="chat-messages">
							{#each messages as message (message.id)}
								<div class="message">
									<div class="message-head"><strong>{message.self ? 'Вы' : message.name}</strong>
										{#if isModerator && message.source && message.id}
											<button class="delete-message" type="button" title="Удалить сообщение у всех" aria-label={'Удалить сообщение от ' + message.name} onclick={() => clearChat(message)}><Trash2 size={14}/></button>
										{/if}
									</div>
									<p>{message.text}</p>
								</div>
							{/each}
						</div>
						<form onsubmit={(e) => { e.preventDefault(); sendChat(); }}><input bind:value={chatText} placeholder="Написать сообщение" aria-label="Сообщение"/><button type="submit" aria-label="Отправить сообщение"><Send size={19}/></button></form>
					</aside>
				{/if}
			</div>
			<div class="toolbar">
				<button onclick={toggleMic} class:off={!micEnabled} title="Микрофон" aria-label="Микрофон">{#if micEnabled}<Mic size={22}/>{:else}<MicOff size={22}/>{/if}</button>
				<button onclick={toggleCamera} class:off={!cameraEnabled} title="Камера" aria-label="Камера">{#if cameraEnabled}<Camera size={22}/>{:else}<CameraOff size={22}/>{/if}</button>
				<button onclick={shareScreen} class:active={!!screenStream} disabled={!canPresent} title="Показать экран" aria-label="Показать экран"><MonitorUp size={22}/></button>
				<button type="button" onclick={toggleHand} class:active={myHandRaised} aria-pressed={myHandRaised} title={myHandRaised ? 'Опустить руку' : 'Поднять руку'} aria-label={myHandRaised ? 'Опустить руку' : 'Поднять руку'}><Hand size={22}/></button>
				<div class="blur-toolbar">
					<button type="button" class:active={blurMode !== 'off'} disabled={!cameraEnabled}
						onclick={() => blurMenuOpen = !blurMenuOpen}
						aria-label="Настройки размытия фона"
						aria-expanded={blurMenuOpen}
						title="Размытие фона">
						<Sparkles size={22}/>
					</button>
					{#if blurMenuOpen}
						<div class="blur-popover" role="group" aria-label="Выбор размытия">
							<strong>Размытие фона</strong>
							{#each BLUR_OPTIONS as choice (choice.mode)}
								<button type="button"
									class:selected={blurMode === choice.mode}
									aria-pressed={blurMode === choice.mode}
									disabled={blurBusy}
									onclick={() => chooseBlurMode(choice.mode)}>
									<span>{choice.label}</span><small>{choice.strength}</small>
								</button>
							{/each}
							{#if blurBusy}<p>Применяем эффект…</p>{/if}
						</div>
					{/if}
				</div>
				<button onclick={() => { chatOpen = !chatOpen; if (chatOpen) membersOpen = false; }} class:active={chatOpen} title="Чат" aria-label="Чат"><MessageCircle size={22}/></button>
				<button class="hangup" onclick={leave} title="Завершить звонок" aria-label="Завершить звонок"><PhoneOff size={23}/></button>
			</div>
		</main>
	{/if}
	{#if error}<div class="error" role="alert"><AlertCircle size={18}/>{error}<button onclick={() => error = ''} aria-label="Закрыть сообщение"><X size={16}/></button></div>{/if}
	<footer class="footer"><span>© Андрей Калмыков</span><span>Пространство для спокойного разговора</span></footer>
</div>

<style>
	:global(body:has(.meet)){background:#f7f6f2}
	.meet{min-height:100svh;background:#f7f6f2;color:#29322b;font-family:'Aeonik',system-ui,sans-serif;display:flex;flex-direction:column}
	.header{height:86px;padding:0 clamp(20px,5vw,85px);display:flex;align-items:center;justify-content:space-between}
	.brand{color:inherit;text-decoration:none;display:flex;align-items:center;gap:14px;font-weight:650;font-size:14px;line-height:1.3}.brand small{display:block;font-weight:400;color:#879083;font-size:12px;margin-top:3px}.logo{font:bold 43px Georgia,serif;letter-spacing:-5px}.logo span{color:#b8a079}.private{display:flex;align-items:center;gap:9px;color:#85977c;font-size:12px}
	.prejoin{flex:1;max-width:1200px;width:calc(100% - 48px);margin:auto;display:grid;grid-template-columns:1fr 1.02fr;align-items:center;gap:clamp(40px,8vw,130px);padding:45px 0 80px}
	.eyebrow{font-size:11px;letter-spacing:.17em;text-transform:uppercase;color:#85997e;font-weight:700;margin-bottom:27px}
	.intro h1{font:normal clamp(44px,5vw,76px)/1.1 Georgia,serif;letter-spacing:-.055em;margin:0 0 28px}.intro h1 em{color:#8a9b7e}.intro>p{font-size:17px;line-height:1.75;max-width:420px;color:#7c8378}.notice{border-top:1px solid #dedfd7;margin-top:58px;padding-top:25px;display:flex;gap:13px;color:#85977e}.notice strong{color:#4f5e4e;display:block;font-size:13px}.notice span{color:#8a9187;display:block;font-size:12px;margin-top:6px;line-height:1.5}
	.panel{background:#fff;border:1px solid #e6e8e1;box-shadow:0 18px 60px #39423420;border-radius:21px;padding:12px 12px 25px;width:100%;max-width:580px}
	.video{height:auto;aspect-ratio:1.42;background:#29312c;border-radius:14px;overflow:hidden;position:relative}
	.video video,.tile video{width:100%;height:100%;object-fit:cover}.video>video{transform:scaleX(-1)}.hidden{visibility:hidden}.placeholder{position:absolute;inset:0;color:#c5cec2;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;font-size:13px}.avatar{background:#465148;border-radius:50%;width:77px;height:77px;display:grid;place-items:center}.userlabel,.tile-label{position:absolute;bottom:18px;left:19px;background:#1e2621bc;color:white;border-radius:8px;padding:8px 12px;font-size:12px;display:flex;gap:9px;align-items:center}
	.video-buttons{position:absolute;bottom:15px;right:17px;display:flex;gap:9px}.video-buttons button,.toolbar button{border:0;color:#fff;background:#4c5c4f;display:grid;place-items:center;cursor:pointer;width:44px;height:44px;border-radius:50%}.video-buttons button.off,.toolbar button.off{background:#ba7163}.video-buttons button.active{background:#b8c9b3;color:#29322b}.video-buttons button:hover,.toolbar button:hover{filter:brightness(1.13)}
	.fields{padding:21px 23px 0}.fields label{display:block;font-size:12px;font-weight:650;margin:11px 0 7px}.fields input,.chat input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #e0e3db;border-radius:9px;background:#fdfdfb;font:inherit;font-size:14px;color:#29322b;outline:none}.fields input:focus,.chat input:focus{border-color:#8a9b7e;box-shadow:0 0 0 3px #8a9b7e20}
	.invitation-label{display:flex;align-items:center;gap:10px;margin:5px 0 17px;color:#526c51;font-size:13px;font-weight:650}
	.invitation-info{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid #e9ece6;padding:13px 1px;font-size:13px}.invitation-info span{color:#888f85}.invitation-info strong{color:#364438;font-weight:650;overflow-wrap:anywhere;text-align:right}.invite-warning{font-size:12px;line-height:1.6;color:#a35b45;margin:14px 0}
	.blur-prejoin{margin:18px 0 4px;border:0;padding:0;min-width:0}.blur-prejoin legend{display:flex;gap:7px;align-items:center;font-size:12px;font-weight:650;color:#526c51;padding:0 0 9px}.blur-prejoin legend span{color:#9b9e96;font-weight:400}
	.blur-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.blur-choices button{background:#f8faf6;border:1px solid #e0e6dc;border-radius:8px;min-height:52px;padding:8px 5px;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;color:#526151;cursor:pointer}.blur-choices button span{font-size:12px}.blur-choices button small{font-size:10px;color:#8b9988}.blur-choices button.selected{background:#e9f1e5;border-color:#759771;color:#2f5131}.blur-choices button:disabled{opacity:.55;cursor:not-allowed}
	.blur-toolbar{position:relative;display:flex;align-items:center}.blur-popover{position:absolute;z-index:15;bottom:64px;left:50%;transform:translateX(-50%);width:205px;border-radius:13px;border:1px solid #e0e6dc;background:#fff;box-shadow:0 12px 32px #0003;padding:11px;display:flex;flex-direction:column;gap:4px;color:#29322b}.blur-popover>strong{padding:5px 7px 8px;font-size:12px}.toolbar .blur-popover button{width:100%;height:auto;min-height:38px;border-radius:7px;background:#fff;color:#405743;padding:8px 9px;display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;text-align:left;font-size:12px}.toolbar .blur-popover button.selected{background:#e9f1e5;color:#2f5131}.blur-popover small{color:#879083;font-size:11px}.blur-popover p{margin:4px;font-size:11px;color:#71836e}
	.primary{margin-top:17px;width:100%;border:0;border-radius:10px;min-height:49px;display:flex;align-items:center;justify-content:center;gap:12px;background:#526c51;color:white;font:inherit;font-size:14px;font-weight:650;cursor:pointer}.primary:disabled{background:#a4b2a0;cursor:not-allowed}.hint{text-align:center;color:#9ba198;font-size:11px;margin:12px 0 0}
	.call{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 clamp(12px,3vw,50px) 18px;gap:17px}.call-top{display:flex;justify-content:space-between;align-items:center;padding:5px 10px}.call-top strong{font-size:16px;display:block}.call-top span{color:#859083;font-size:12px}.call-meta{display:flex;align-items:center;gap:9px;color:#707d71}.call-meta button,.chat button{border:0;background:transparent;color:inherit;cursor:pointer}.role-indicator{display:inline-flex;align-items:center;gap:5px;border:1px solid #d7ddd2;border-radius:30px;color:#667266;background:#f3f5f0;padding:6px 9px;font-size:11px}.role-indicator.moderator{border-color:#b5c6aa;background:#e4eddf;color:#345a37;font-weight:650}
	.call-main{display:flex;gap:16px;flex:1;min-height:350px}.tiles{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px;align-content:center}.tile{position:relative;min-height:240px;aspect-ratio:16/10;background:#29312c;overflow:hidden;border-radius:17px}.tile video.dim{visibility:hidden}.empty-tile{border:1px dashed #cad1c8;border-radius:17px;min-height:240px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#879485;gap:12px}.empty-tile strong{color:#556151}.empty-tile p{font-size:13px;margin:0}.empty-tile button{background:#fff;border:1px solid #dce2d8;border-radius:9px;padding:10px 15px;display:flex;gap:8px;cursor:pointer;color:#4c6048}
	.peer-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#cdd6ca;font-size:13px;pointer-events:none}
	.toolbar{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px}.toolbar button{width:52px;height:52px;background:#e4e9e0;color:#425440}.toolbar button.active{background:#b8c9b3}.toolbar button.hangup{background:#bb625b;color:white;border-radius:18px;width:73px}.toolbar button:disabled{opacity:.4;cursor:not-allowed}
	.hand-indicator{position:absolute;top:14px;left:14px;display:flex;gap:7px;align-items:center;padding:7px 11px;background:#f3e6bd;color:#56421d;border-radius:9px;font-weight:700;font-size:12px}
	.call-meta .members-trigger{display:inline-flex;gap:6px;align-items:center;font-size:12px;padding:6px;border-radius:8px}.call-meta .members-trigger:hover{background:#e3eade}
	.members-list{display:flex;flex-direction:column;padding:8px 14px;gap:2px;overflow-y:auto}.member-row{display:flex;align-items:center;justify-content:space-between;padding:11px 7px;border-bottom:1px solid #edf0e9;gap:8px;min-width:0}.member-row>span{display:flex;align-items:center;gap:7px;font-size:13px;overflow-wrap:anywhere}.member-row>span svg{color:#ad8b32;flex-shrink:0}.member-row small{font-size:11px;color:#527552}.kick-action,.delete-message{background:none;border:0;color:#a76559;cursor:pointer;padding:4px}.kick-action:hover,.delete-message:hover{color:#bb3c30}.message-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.chat-heading-actions{display:flex;gap:8px;align-items:center}
	.chat{width:300px;background:#fff;border:1px solid #e3e7df;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}.chat-heading{padding:20px;font-weight:700;display:flex;justify-content:space-between}.chat-messages{flex:1;overflow:auto;padding:12px 20px}.message{padding:8px 0}.message strong{font-size:12px;color:#556c52}.message p{font-size:13px;margin:5px 0;overflow-wrap:anywhere}.chat form{border-top:1px solid #edf0e9;padding:10px;display:flex;align-items:center;gap:5px}.chat input{border:0}
	.error{position:fixed;z-index:20;bottom:85px;left:50%;transform:translateX(-50%);max-width:min(600px,90vw);background:#fff1eb;color:#934536;display:flex;align-items:center;gap:12px;padding:13px 17px;border:1px solid #e8c5b8;border-radius:10px;box-shadow:0 12px 25px #0002;font-size:13px}.error button{background:none;border:0;color:inherit;cursor:pointer}
	.footer{display:flex;justify-content:space-between;gap:15px;padding:21px clamp(20px,5vw,85px);border-top:1px solid #e4e7de;color:#989e95;font-size:11px}
	@media(max-width:850px){.header{height:74px}.prejoin{max-width:550px;grid-template-columns:1fr;padding:30px 0 60px;gap:32px}.intro h1{font-size:52px}.intro>p{font-size:15px}.notice{display:none}.call-main{flex-direction:column}.chat{width:100%;height:250px}.tiles{grid-template-columns:1fr 1fr}.tile{min-height:170px}}
	@media(max-width:520px){.private{font-size:0}.prejoin{width:calc(100% - 28px);padding:12px 0 35px}.intro h1{font-size:44px}.video{aspect-ratio:1.28}.panel{box-sizing:border-box;padding:8px 8px 18px}.fields{padding:16px 13px 0}.tiles{grid-template-columns:1fr}.tile{aspect-ratio:16/10}.call{padding:0 8px}.toolbar{gap:8px}.toolbar button{width:45px;height:45px}.footer{flex-direction:column;gap:5px}}
</style>