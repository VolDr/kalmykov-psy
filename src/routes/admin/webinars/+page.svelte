<script lang="ts">
	import { Video, Plus, Copy, Trash2, UploadCloud, CalendarClock, ExternalLink } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let title = $state('Автовебинар');
	let startLocal = $state('');
	let uploading = $state('');
	let progress = $state(0);
	let uploadError = $state('');
	let copied = $state('');
	let deleting = $state('');

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
	}
	function stateOf(record: PageData['webinars'][number]) {
		if (!record.ready) return 'Ожидает видео';
		const start = Date.parse(record.startAt);
		if (Date.now() < start) return 'Запланирован';
		if (Date.now() < start + record.durationSeconds * 1000) return 'Идет показ';
		return 'Завершен';
	}
	function setStartAt(event: SubmitEvent) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLFormElement)) return;
		const hidden = target.elements.namedItem('startAt');
		if (!(hidden instanceof HTMLInputElement)) return;
		hidden.value = new Date(startLocal).toISOString();
	}

	async function uploadVideo(id: string, file: File) {
		if (uploading) return;
		if (!file.name.toLowerCase().endsWith('.zip') || file.size > 1024 * 1024 * 1024) {
			uploadError = 'Нужен ZIP с готовым HLS (index.m3u8 и .ts), до 1 ГБ.';
			return;
		}
		uploading = id;
		progress = 0;
		uploadError = '';
		try {
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open('PUT', '/admin/webinars/' + id + '/upload');
				xhr.setRequestHeader('Content-Type', 'application/zip');
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) progress = Math.floor(event.loaded / event.total * 100);
				};
				xhr.onerror = () => reject(new Error('Сетевая ошибка при загрузке видео.'));
				xhr.onload = () => xhr.status >= 200 && xhr.status < 300
					? resolve()
					: reject(new Error(xhr.responseText?.slice(0, 300) || 'Ошибка загрузки: ' + xhr.status));
				xhr.send(file);
			});
			window.location.reload();
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'Не удалось загрузить MP4.';
		} finally {
			uploading = '';
		}
	}

	async function copyLink(id: string, key: string) {
		const url = new URL('/webinar/' + id + '#key=' + encodeURIComponent(key), location.origin);
		try {
			await navigator.clipboard.writeText(url.href);
			copied = id;
			window.setTimeout(() => { if (copied === id) copied = ''; }, 1800);
		} catch {
			uploadError = 'Не удалось скопировать ссылку.';
		}
	}
</script>

<svelte:head>
	<title>Автовебинары — Админка</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-7 p-6">
	<div>
		<h1 class="flex items-center gap-2 text-2xl font-semibold"><Video size={23}/> Автовебинары</h1>
		<p class="mt-2 text-sm text-stone-500">Загрузите готовый HLS ZIP и назначьте время. Участники увидят видео одновременно, начиная с текущего момента эфира.</p>
	</div>
	{#if form && 'error' in form && form.error}
		<p class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{form.error}</p>
	{/if}
	{#if uploadError}
		<p class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{uploadError}</p>
	{/if}
	<section class="rounded-xl border bg-white p-5 shadow-sm">
		<h2 class="mb-4 flex items-center gap-2 font-semibold"><Plus size={18}/> Создать вебинар</h2>
		<form method="POST" action="?/create" onsubmit={setStartAt} class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
			<label class="block text-sm font-medium text-stone-700">
				Название
				<input name="title" bind:value={title} required maxlength="100" class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5"/>
			</label>
			<label class="block text-sm font-medium text-stone-700">
				Начало (местное время)
				<input type="datetime-local" bind:value={startLocal} required class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5"/>
			</label>
			<input type="hidden" name="startAt"/>
			<button type="submit" class="flex items-center justify-center gap-2 rounded-lg bg-stone-800 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700"><Plus size={16}/> Создать</button>
		</form>
		<p class="mt-3 text-xs text-stone-500">Затем загрузите ZIP с index.m3u8 и .ts-сегментами (один VOD-поток). Время хранится в UTC; зрителям показывается в их часовом поясе.</p>
	</section>
	<section class="space-y-4">
		<h2 class="font-semibold">Созданные вебинары ({data.webinars.length})</h2>
		{#each data.webinars as webinar (webinar.id)}
			<div class="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h3 class="text-base font-semibold">{webinar.title}</h3>
						<p class="mt-1 flex items-center gap-2 text-sm text-stone-500"><CalendarClock size={15}/> {formatDate(webinar.startAt)}</p>
						<p class="mt-1 text-xs text-stone-500">{stateOf(webinar)}{webinar.ready ? ' · ' + Math.ceil(webinar.durationSeconds / 60) + ' мин · ' + (webinar.bytes / 1048576).toFixed(0) + ' МБ' : ''}</p>
					</div>
					{#if deleting === webinar.id}
						<form method="POST" action="?/delete" class="flex items-center gap-2">
							<input type="hidden" name="id" value={webinar.id}/>
							<input type="hidden" name="confirm" value={webinar.id}/>
							<button type="submit" class="rounded bg-red-700 px-3 py-2 text-xs text-white">Удалить</button>
							<button type="button" class="text-xs" onclick={() => deleting = ''}>Отмена</button>
						</form>
					{:else}
						<button type="button" class="text-stone-400 hover:text-red-700" onclick={() => deleting = webinar.id} aria-label="Удалить вебинар"><Trash2 size={17}/></button>
					{/if}
				</div>
				{#if !webinar.ready}
					<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-600">
						<UploadCloud size={20}/>
						{uploading === webinar.id ? 'Загрузка видео: ' + progress + '%' : 'Выбрать и загрузить HLS ZIP до 1 ГБ'}
						<input type="file" accept=".zip,application/zip" class="sr-only" disabled={!!uploading}
							onchange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadVideo(webinar.id, file); }}/>
					</label>
					{#if uploading === webinar.id}<progress value={progress} max="100" class="w-full"></progress>{/if}
				{:else}
					<div class="flex flex-wrap gap-3">
						<button type="button" onclick={() => copyLink(webinar.id, webinar.viewerSecret)}
							class="flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-white">
							<Copy size={14}/> {copied === webinar.id ? 'Скопировано' : 'Скопировать ссылку зрителя'}
						</button>
						<a href={'/webinar/' + webinar.id + '#key=' + encodeURIComponent(webinar.viewerSecret)} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs">
							<ExternalLink size={14}/> Открыть страницу
						</a>
					</div>
				{/if}
			</div>
		{:else}
			<p class="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Пока нет вебинаров.</p>
		{/each}
	</section>
	<p class="text-xs leading-relaxed text-stone-500">
		Готовые HLS-сегменты хранятся на диске сервера, доступен только по ссылке-приглашению и только во время показа.
		Синхронизация просмотра — по часам сервера. Это не DRM: технически подготовленный зритель может сохранить видео,
		поскольку браузер получает видеофрагменты.
	</p>
</div>
