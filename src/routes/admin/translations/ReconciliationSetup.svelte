<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { parseSecondTranslation } from '#lib/data/translation-reconciliation.js';
	import type { TranslationItem } from '#lib/data/translation.js';
	let {
		sourceId,
		items,
		prepared,
		firstReady,
		initialOpen = true
	}: {
		sourceId: number;
		items: TranslationItem[];
		prepared: string;
		firstReady: boolean;
		initialOpen?: boolean;
	} = $props();
	let text = $state(untrack(() => prepared));
	let busy = $state(false);
	let fileError = $state('');
	const preview = $derived.by(() => {
		try {
			return { count: Object.keys(parseSecondTranslation(text, items)).length, error: '' };
		} catch (error) {
			return { count: 0, error: (error as Error).message };
		}
	});
	async function readFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		fileError = '';
		if (!file) return;
		if (file.size > 512_000) {
			fileError = 'Файл больше 500 КБ';
			input.value = '';
			return;
		}
		try {
			text = await file.text();
		} catch {
			fileError = 'Не удалось прочитать файл';
		} finally {
			input.value = '';
		} // Отправляется видимый, редактируемый текст.
	}
</script>

<details class="rounded-xl border border-border bg-card p-5" open={initialOpen}>
	<summary class="cursor-pointer font-semibold text-foreground"
		>Новое согласование двух переводов</summary
	>
	<form
		method="POST"
		action="?/createReconciliation"
		enctype="multipart/form-data"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				busy = false;
				await update({ reset: false });
			};
		}}
		class="mt-5 space-y-4"
	>
		<input type="hidden" name="sourceId" value={sourceId} />
		<p class="max-w-prose text-sm text-muted-foreground">
			Вариант 1 будет взят из заполненного перевода по текущей ссылке. Вариант 2 уже загружен из
			файла «П1 для обратного перевода.md»; его можно заменить. После создания появятся две
			отдельные ссылки для участников.
		</p>
		<label class="block text-sm font-medium"
			>Название<input
				name="title"
				value="Согласование перевода"
				required
				maxlength="150"
				class="mt-1 block min-h-11 w-full max-w-lg rounded-lg border border-border bg-background px-3 py-2"
			/></label
		>
		<label class="block text-sm font-medium"
			>Другой файл второго перевода (.md или JSON)<input
				type="file"
				name="secondFile"
				accept=".md,.markdown,.json,text/markdown,application/json"
				onchange={readFile}
				class="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-border file:bg-background file:px-3"
			/></label
		>
		<label class="block text-sm font-medium"
			>Текст второго перевода<textarea
				name="secondText"
				bind:value={text}
				oninput={() => (fileError = '')}
				rows="8"
				class="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed font-normal"
			></textarea></label
		>
		{#if preview.count}<p class="text-sm text-muted-foreground">
				Проверено: {preview.count} из {items.length} частей. Инструкция, пункты и ответы сопоставлены
				по ключам.
			</p>{:else}<p class="text-sm text-destructive" role="alert">{preview.error}</p>{/if}
		{#if fileError}<p class="text-sm text-destructive" role="alert">{fileError}</p>{/if}
		{#if !firstReady}<p class="text-sm text-muted-foreground">
				Сначала заполните все части первого перевода. Сейчас снимок ещё неполный.
			</p>{/if}
		<p class="text-xs text-muted-foreground">
			Оба варианта фиксируются на момент создания. Новый файл создаёт отдельное согласование,
			сохраняя предыдущие ответы.
		</p>
		<button
			disabled={busy || !firstReady || !preview.count || Boolean(fileError)}
			class="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
			>{busy ? 'Создаём ссылки…' : 'Создать две ссылки'}</button
		>
	</form>
</details>
