<script lang="ts">
	import { tick } from 'svelte';
	import MessageSquarePlus from '@lucide/svelte/icons/message-square-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { cn } from '#lib/utils.js';
	import { TRANSLATION_MAX_LENGTH } from '#lib/data/translation.js';
	import type {
		ReconciliationProfile,
		ReviewComment
	} from '#lib/data/translation-reconciliation.js';
	import ReviewerAvatar from './ReviewerAvatar.svelte';
	import { reviewerTone } from './reviewer-tone.js';

	let {
		id,
		itemLabel,
		comments,
		profiles,
		ownSlot,
		unseen,
		draft,
		sending,
		error,
		ondraft,
		onsend,
		ondelete
	}: {
		id: string;
		itemLabel: string;
		/** Комментарии пункта в порядке добавления */
		comments: ReviewComment[];
		profiles: Record<number, ReconciliationProfile>;
		ownSlot: number;
		/** Ещё не просмотренные комментарии второго участника */
		unseen: Set<string>;
		draft: string;
		sending: boolean;
		error: string;
		ondraft: (value: string) => void;
		onsend: () => void;
		ondelete: (comment: ReviewComment) => void;
	} = $props();

	let open = $state(false);
	let wasSending = false;
	let input = $state<HTMLTextAreaElement>();
	const composing = $derived(open || Boolean(draft));
	const fallback = (slot: number) => ({ name: `Участник ${slot}`, avatar: '' });

	async function start() {
		open = true;
		await tick();
		input?.focus();
	}
	function cancel() {
		ondraft('');
		open = false;
	}
	function send() {
		if (draft.trim() && !sending) onsend();
	}
	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			send();
		} else if (event.key === 'Escape' && !draft.trim()) {
			event.preventDefault();
			cancel();
		}
	}
	$effect(() => {
		// Успешная отправка очищает черновик: поле закрывается само
		if (wasSending && !sending && !draft && !error) open = false;
		wasSending = sending;
	});
</script>

<section aria-label={`Обсуждение: ${itemLabel}`} class="space-y-2">
	{#if comments.length}
		<ul class="space-y-2">
			{#each comments as comment (comment.id)}
				{@const own = comment.slot === ownSlot}
				{@const profile = profiles[comment.slot] ?? fallback(comment.slot)}
				{@const tone = reviewerTone(comment.slot)}
				<li class="flex max-w-xl items-start gap-2">
					<ReviewerAvatar {profile} size="small" />
					<div class={cn('min-w-0 rounded-2xl rounded-tl-sm px-3 py-2 text-sm', tone.bubble)}>
						<p class={cn('flex flex-wrap items-center gap-x-2 text-xs font-medium', tone.name)}>
							{profile.name}{own ? ' (вы)' : ''}
							{#if unseen.has(comment.id)}
								<span class="rounded-full bg-sky-600 px-1.5 text-[11px] leading-4 text-white"
									>новый</span
								>
							{/if}
						</p>
						<p class="mt-0.5 leading-relaxed break-words whitespace-pre-wrap select-text">
							{comment.body}
						</p>
					</div>
					{#if own}
						<button
							type="button"
							onclick={() => ondelete(comment)}
							aria-label="Удалить комментарий"
							title="Удалить комментарий"
							class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
						>
							<Trash2 size={15} aria-hidden="true" />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if composing}
		<div class="flex max-w-xl items-start gap-2" data-comment-composer>
			<ReviewerAvatar profile={profiles[ownSlot] ?? fallback(ownSlot)} size="small" />
			<div class="min-w-0 flex-1">
				<label for={id} class="sr-only">Новый комментарий</label>
				<textarea
					{id}
					bind:this={input}
					value={draft}
					oninput={(event) => ondraft(event.currentTarget.value)}
					{onkeydown}
					maxlength={TRANSLATION_MAX_LENGTH}
					rows="2"
					class={cn(
						'block min-h-16 w-full rounded-2xl rounded-tl-sm border-0 px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:outline-none',
						reviewerTone(ownSlot).bubble
					)}
				></textarea>
				<div class="mt-1.5 flex flex-wrap items-center gap-2">
					<button
						type="button"
						onclick={send}
						disabled={!draft.trim() || sending}
						class="min-h-9 rounded-lg bg-navy px-3 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
					>
						{sending ? 'Отправляем…' : 'Отправить'}
					</button>
					<button
						type="button"
						onclick={cancel}
						disabled={sending}
						class="min-h-9 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
					>
						Отмена
					</button>
				</div>
				{#if error}<p role="alert" class="mt-1 text-xs text-destructive">{error}</p>{/if}
			</div>
		</div>
	{:else}
		<button
			type="button"
			onclick={start}
			class="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
		>
			<MessageSquarePlus size={15} aria-hidden="true" /> Написать комментарий
		</button>
	{/if}
</section>
