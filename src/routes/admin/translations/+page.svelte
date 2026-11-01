<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { cn } from '#lib/utils.js';
	import TranslationLog from './TranslationLog.svelte';
	import TranslationTable from './TranslationTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let copied = $state(false);

	const doneCount = $derived(
		data.doc ? data.doc.items.filter((it) => data.entries?.[it.key]?.translation.trim()).length : 0
	);

	async function copyLink(link: string) {
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<svelte:head><title>Переводы опросников</title></svelte:head>

<div class="space-y-8 p-6">
	<h1 class="text-2xl font-semibold">Переводы опросников</h1>

	{#if !data.doc}
		<p class="text-gray-500">
			Документов нет. Примените миграцию <code>drizzle/0024_translation_docs.sql</code>.
		</p>
	{:else}
		{#if data.docs.length > 1}
			<nav class="flex flex-wrap gap-2" aria-label="Документы">
				{#each data.docs as doc (doc.id)}
					<!-- Только ?id= на этой же странице -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={`?id=${doc.id}`}
						aria-current={doc.id === data.doc.id ? 'page' : undefined}
						class={cn(
							'rounded-md border px-3 py-1.5 text-sm',
							doc.id === data.doc.id ? 'border-gray-900 bg-gray-900 text-white' : 'hover:bg-gray-50'
						)}>{doc.title}</a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
			</nav>
		{/if}

		<section class="space-y-3">
			<h2 class="text-lg font-medium">
				{data.doc.title}
				<span class="ml-2 text-sm font-normal text-gray-500">
					переведено {doneCount} из {data.doc.items.length}
				</span>
			</h2>
			<div class="flex flex-wrap items-center gap-2">
				<code class="rounded bg-gray-100 px-2 py-1 text-sm break-all">{data.doc.link}</code>
				<button
					type="button"
					class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
					onclick={() => data.doc && copyLink(data.doc.link)}
				>
					{copied ? 'Скопировано' : 'Копировать'}
				</button>
				<a
					href={resolve('/translate/[token]', { token: data.doc.token })}
					target="_blank"
					rel="noreferrer"
					class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Открыть</a
				>
				<form
					method="POST"
					action="?/regenerate"
					use:enhance={({ cancel }) => {
						if (!confirm('Старая ссылка перестанет работать. Сменить?')) cancel();
					}}
				>
					<input type="hidden" name="id" value={data.doc.id} />
					<button class="rounded-md border px-3 py-1 text-sm text-red-700 hover:bg-red-50">
						Сменить ссылку
					</button>
				</form>
			</div>
			<p class="text-xs text-gray-500">
				Открытие этой ссылки из админки тоже попадёт в журнал заходов.
			</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-medium">Перевод</h2>
			<TranslationTable items={data.doc.items} entries={data.entries ?? {}} />
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-medium">Журнал заходов и правок</h2>
			<p class="text-xs text-gray-500">
				Правки одного поля подряд с одного IP склеиваются в одну строку: «Было» — до начала серии,
				«Стало» — последнее значение. Наведите на IP, чтобы увидеть браузер. Последние 300 событий.
			</p>
			<TranslationLog events={data.events ?? []} items={data.doc.items} />
		</section>
	{/if}
</div>
