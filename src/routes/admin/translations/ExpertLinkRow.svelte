<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		expertAnswer,
		isExpertItemDone,
		type ExpertResult
	} from '#lib/data/translation-expert.js';

	let {
		link,
		label,
		origin,
		action,
		sourceId,
		reviewId,
		copied,
		oncopy
	}: {
		link: ExpertResult;
		label: string;
		origin: string;
		action: (name: string) => string;
		sourceId: number;
		reviewId: number;
		copied: boolean;
		oncopy: (url: string) => void;
	} = $props();

	const url = $derived(`${origin}/translate/${link.token}`);
	const done = $derived(
		link.items.filter((item) => isExpertItemDone(item, expertAnswer(link.entries, item.key))).length
	);
</script>

<div class="space-y-2">
	<p class="text-xs text-muted-foreground tabular-nums">
		{label} · оценено {done} из {link.items.length} · создана {new Date(
			link.createdAt
		).toLocaleDateString('ru-RU')}
	</p>
	<input
		aria-label={`${label}: ссылка эксперта ${link.name}`}
		readonly
		value={url}
		class="block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
	/>
	<div class="flex flex-wrap items-center gap-3">
		<button
			type="button"
			onclick={() => oncopy(url)}
			class="min-h-11 rounded-lg border border-border px-3 py-2 text-sm"
			>{copied ? 'Скопировано' : 'Копировать ссылку'}</button
		>
		<a
			href={resolve('/translate/[token]', { token: link.token })}
			target="_blank"
			rel="noreferrer"
			class="inline-flex min-h-11 items-center px-2 text-sm underline">Открыть</a
		>
		<form
			method="POST"
			action={action('regenerateExpert')}
			use:enhance={({ cancel }) => {
				if (
					!confirm(
						`Сменить ссылку эксперта «${link.name}»? Ответы сохранятся, старая ссылка перестанет работать.`
					)
				)
					cancel();
			}}
		>
			<input type="hidden" name="sourceId" value={sourceId} />
			<input type="hidden" name="reviewId" value={reviewId} />
			<input type="hidden" name="expertId" value={link.id} />
			<button class="min-h-11 px-2 text-sm text-destructive">Сменить ссылку</button>
		</form>
		<form
			method="POST"
			action={action('deleteExpert')}
			use:enhance={({ cancel }) => {
				if (
					!confirm(
						`Удалить «${label.toLowerCase()}» эксперта «${link.name}»? Ссылка перестанет работать, ответы по ней удалятся и выпадут из статистики. Отменить нельзя.`
					)
				)
					cancel();
			}}
		>
			<input type="hidden" name="sourceId" value={sourceId} />
			<input type="hidden" name="reviewId" value={reviewId} />
			<input type="hidden" name="expertId" value={link.id} />
			<button class="min-h-11 px-2 text-sm text-destructive">Удалить ссылку</button>
		</form>
	</div>
	{#if link.adminToken}
		{@const adminUrl = `${origin}/translate/${link.adminToken}`}
		<div class="space-y-2 rounded-lg bg-muted/40 p-3">
			<p class="text-xs font-medium">Ваша ссылка для обсуждения с экспертом</p>
			<input aria-label={`Ссылка администратора для ${link.name}`} value={adminUrl} readonly class="block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
			<div class="flex flex-wrap gap-3">
				<button type="button" onclick={() => oncopy(adminUrl)} class="min-h-11 rounded-lg border border-border px-3 text-sm">Копировать вашу ссылку</button>
				<a href={resolve('/translate/[token]', { token: link.adminToken })} target="_blank" rel="noreferrer" class="inline-flex min-h-11 items-center text-sm underline">Открыть обсуждение от своего имени</a>
			</div>
		</div>
	{:else}
		<form method="POST" action={action('expertAdminLink')} use:enhance>
			<input type="hidden" name="sourceId" value={sourceId} /><input type="hidden" name="reviewId" value={reviewId} /><input type="hidden" name="expertId" value={link.id} />
			<button class="min-h-11 rounded-lg border border-border px-3 text-sm">Создать вашу ссылку для обсуждения</button>
		</form>
	{/if}
</div>
