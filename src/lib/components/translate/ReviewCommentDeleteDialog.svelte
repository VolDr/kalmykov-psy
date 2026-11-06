<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { ReviewComment } from '#lib/data/translation-reconciliation.js';

	let {
		comment,
		deleting,
		error,
		onconfirm,
		oncancel
	}: {
		/** Комментарий, который просят удалить; null — окно закрыто */
		comment: ReviewComment | null;
		deleting: boolean;
		error: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();
</script>

<!-- Окно управляется снаружи: во время удаления Esc и щелчок мимо его не закрывают,
	иначе ошибка удаления оказалась бы в невидимом окне. -->
<Dialog.Root
	bind:open={
		() => Boolean(comment),
		(open) => {
			if (!open && !deleting) oncancel();
		}
	}
>
	<Dialog.Content
		showCloseButton={false}
		class="border-0"
		escapeKeydownBehavior={deleting ? 'ignore' : 'close'}
		interactOutsideBehavior={deleting ? 'ignore' : 'close'}
		preventScroll={false}
	>
		<Dialog.Header>
			<Dialog.Title>Удалить комментарий?</Dialog.Title>
		</Dialog.Header>
		{#if comment}
			<p
				class="max-h-40 overflow-auto rounded-xl bg-muted/60 px-3 py-2 text-sm break-words whitespace-pre-wrap"
			>
				{comment.body}
			</p>
		{/if}
		{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
		<Dialog.Footer>
			<button
				type="button"
				onclick={oncancel}
				disabled={deleting}
				class="min-h-11 rounded-lg px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
			>
				Отмена
			</button>
			<button
				type="button"
				onclick={onconfirm}
				disabled={deleting}
				class="min-h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-60"
			>
				{deleting ? 'Удаляем…' : 'Удалить'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
