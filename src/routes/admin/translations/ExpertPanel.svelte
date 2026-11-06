<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { TranslationItem } from '#lib/data/translation.js';
	import { latestExpertTexts, type ExpertResult } from '#lib/data/translation-expert.js';
	import ExpertLinkRow from './ExpertLinkRow.svelte';
	import ExpertResultsTable from './ExpertResultsTable.svelte';

	let {
		experts,
		currentItems,
		sourceId,
		reviewId,
		origin,
		ready
	}: {
		experts: ExpertResult[];
		/** Пункты, которые эксперт получил бы сейчас: текущие итоговые формулировки */
		currentItems: TranslationItem[];
		sourceId: number;
		reviewId: number;
		origin: string;
		ready: boolean;
	} = $props();

	let busy = $state('');
	let name = $state('');
	let copied = $state('');
	let copyError = $state('');
	const action = (name: string) => `?id=${sourceId}&review=${reviewId}&/${name}`;
	// Все ссылки одного эксперта: первая и повторные
	const people = $derived.by(() => {
		const sorted = [...experts].sort((a, b) => a.id - b.id);
		const ids = [...new Set(sorted.map((link) => link.personId))];
		return ids.map((personId) => {
			const links = sorted.filter((link) => link.personId === personId);
			const seen = latestExpertTexts(links);
			return {
				personId,
				links,
				name: links.at(-1)?.name ?? '',
				changed: currentItems.filter((item) => seen.get(item.key) !== item.source).length
			};
		});
	});
	const duplicate = $derived(
		people.find((person) => person.name.trim().toLowerCase() === name.trim().toLowerCase())
	);

	async function copy(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copied = url;
			copyError = '';
			setTimeout(() => (copied = ''), 1500);
		} catch {
			copyError = 'Скопируйте ссылку из поля вручную.';
		}
	}
	function submitting(key: string, onSuccess?: () => void): SubmitFunction {
		return ({ cancel }) => {
			if (!ready || busy) {
				cancel();
				return;
			}
			busy = key;
			return async ({ result, update }) => {
				try {
					await update({ reset: false });
					if (result.type === 'success') onSuccess?.();
				} finally {
					busy = '';
				}
			};
		};
	}
</script>

<section
	class="space-y-5 rounded-xl border border-border bg-card p-5"
	aria-label="Экспертная оценка"
>
	<div>
		<h3 class="text-lg font-semibold">Экспертная оценка</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			Отдельная ссылка для каждого эксперта. Эксперт видит сведённый русский текст, сгруппированный
			по компонентам, и оценивает ясность каждого пункта, инструкции и формата ответов, а также
			релевантность утверждений своему компоненту. Текст фиксируется при создании ссылки. После
			правок нажмите «Повторная оценка» у эксперта: он получит только изменённые пункты, а в
			статистике останется одним экспертом.
		</p>
	</div>

	<form
		method="POST"
		action={action('createExpert')}
		class="flex flex-wrap items-end gap-3"
		use:enhance={submitting('create', () => (name = ''))}
	>
		<input type="hidden" name="sourceId" value={sourceId} />
		<input type="hidden" name="reviewId" value={reviewId} />
		<label class="block min-w-60 flex-1">
			<span class="mb-1 block text-sm font-medium">Имя нового эксперта</span>
			<input
				name="expertName"
				bind:value={name}
				required
				maxlength="80"
				autocomplete="off"
				aria-describedby={duplicate ? 'expert-duplicate' : undefined}
				class="block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				placeholder="Например, Анна Петрова"
			/>
		</label>
		<button
			disabled={!ready || Boolean(busy) || !name.trim()}
			class="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
			>{busy === 'create' ? 'Создаём…' : 'Создать ссылку эксперта'}</button
		>
	</form>
	{#if duplicate}
		<p id="expert-duplicate" class="text-sm text-destructive" role="status">
			Эксперт «{duplicate.name}» уже есть. Новая ссылка с этим именем будет считаться другим
			экспертом. Для повторной оценки используйте кнопку «Повторная оценка» у него ниже.
		</p>
	{/if}
	{#if !ready}
		<p class="text-sm text-muted-foreground">
			Сначала заполните и сохраните все итоговые формулировки.
		</p>
	{/if}
	{#if copyError}<p role="alert" class="text-sm text-destructive">{copyError}</p>{/if}

	{#if people.length}
		<ul class="divide-y divide-border rounded-lg border border-border">
			{#each people as person (person.personId)}
				{@const firstId = person.links[0]?.id ?? person.personId}
				<li class="space-y-4 p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<form method="POST" action={action('renameExpert')} use:enhance class="flex gap-2">
							<input type="hidden" name="sourceId" value={sourceId} />
							<input type="hidden" name="reviewId" value={reviewId} />
							<input type="hidden" name="expertId" value={firstId} />
							<input
								name="expertName"
								aria-label={`Имя эксперта ${person.name}`}
								value={person.name}
								required
								maxlength="80"
								class="min-h-11 w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
							/>
							<button class="min-h-11 px-2 text-sm">Переименовать</button>
						</form>
						<form
							method="POST"
							action={action('repeatExpert')}
							use:enhance={submitting(`repeat-${person.personId}`)}
						>
							<input type="hidden" name="sourceId" value={sourceId} />
							<input type="hidden" name="reviewId" value={reviewId} />
							<input type="hidden" name="personId" value={person.personId} />
							<button
								disabled={!ready || Boolean(busy) || person.changed === 0}
								class="min-h-11 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
								>{busy === `repeat-${person.personId}`
									? 'Создаём…'
									: person.changed
										? `Повторная оценка: изменено пунктов ${person.changed}`
										: 'Изменённых пунктов нет'}</button
							>
						</form>
					</div>
					{#each person.links as link, index (link.id)}
						<ExpertLinkRow
							{link}
							label={index === 0 ? 'Первая оценка' : `Повторная оценка ${index}`}
							{origin}
							{action}
							{sourceId}
							{reviewId}
							copied={copied === `${origin}/translate/${link.token}`}
							oncopy={copy}
						/>
					{/each}
				</li>
			{/each}
		</ul>
		<ExpertResultsTable {experts} {currentItems} />
	{/if}
</section>
