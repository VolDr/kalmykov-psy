<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import TranslationTable from './TranslationTable.svelte';
	import TranslationLog from './TranslationLog.svelte';
	let { back, sourceId, reviewId, origin, ready }: {
		back: PageData['backTranslation']; sourceId: number; reviewId: number;
		origin: string; ready: boolean;
	} = $props();
	let busy = $state(false);
	let copied = $state(false);
	let copyError = $state('');
	const link = $derived(back ? `${origin}/translate/${back.token}` : '');
	const done = $derived(back?.items.filter((item) => back.entries[item.key]?.translation.trim()).length ?? 0);
	async function copy() {
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			copyError = '';
			setTimeout(() => (copied = false), 1500);
		} catch { copyError = 'Скопируйте ссылку из поля вручную.'; }
	}
</script>

<section class="space-y-4 rounded-xl border border-border bg-card p-5" aria-label="Обратный перевод">
	<div>
		<h3 class="text-lg font-semibold">Обратный перевод на английский</h3>
		<p class="mt-1 text-sm text-muted-foreground">Отдельная ссылка для переводчика. Исходный текст — итоговая русская формулировка каждого пункта.</p>
	</div>
	{#if back}
		<p class="text-sm text-muted-foreground">Переведено {done} из {back.items.length}. Текст зафиксирован при создании ссылки; последующие правки согласования его не меняют.</p>
		<input aria-label="Ссылка для обратного перевода" readonly value={link} class="block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
		<div class="flex flex-wrap items-center gap-3">
			<button type="button" onclick={copy} class="min-h-11 rounded-lg border border-border px-3 py-2 text-sm">{copied ? 'Скопировано' : 'Копировать ссылку'}</button>
			<a href={resolve('/translate/[token]', { token: back.token })} target="_blank" rel="noreferrer" class="inline-flex min-h-11 items-center px-2 text-sm underline">Открыть</a>
			<form method="POST" action={`?id=${sourceId}&review=${reviewId}&/regenerateBackTranslation`} use:enhance={({ cancel }) => { if (!confirm('Сменить ссылку обратного переводчика? Ответы сохранятся, старая ссылка перестанет работать.')) cancel(); }}>
				<input type="hidden" name="sourceId" value={sourceId} /><input type="hidden" name="reviewId" value={reviewId} />
				<button class="min-h-11 px-2 text-sm text-destructive">Сменить ссылку</button>
			</form>
		</div>
		{#if copyError}<p role="alert" class="text-sm text-destructive">{copyError}</p>{/if}
		<TranslationTable items={back.items} entries={back.entries} />
		<details><summary class="min-h-11 cursor-pointer py-2 text-sm font-medium">Журнал обратного перевода</summary><TranslationLog items={back.items} events={back.events} /></details>
	{:else}
		<p class="text-sm text-muted-foreground">Сначала заполните и сохраните все итоговые формулировки. Переводчик получит только русский текст, без английского оригинала и обсуждения участников.</p>
		<form method="POST" action={`?id=${sourceId}&review=${reviewId}&/createBackTranslation`} use:enhance={({ cancel }) => {
			if (!ready || busy) { cancel(); return; }
			busy = true;
			return async ({ update }) => { try { await update(); } finally { busy = false; } };
		}}>
			<input type="hidden" name="sourceId" value={sourceId} /><input type="hidden" name="reviewId" value={reviewId} />
			<button disabled={!ready || busy} class="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">{busy ? 'Создаём…' : 'Создать ссылку для обратного перевода'}</button>
		</form>
	{/if}
</section>
