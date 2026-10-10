<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import type { RoomView } from '$lib/data/game-room-types';

	type Props = {
		view: RoomView;
		shareUrl: string;
		onstart: () => void;
		busy: boolean;
	};

	let { view, shareUrl, onstart, busy }: Props = $props();

	let copied = $state(false);

	async function share() {
		try {
			if (navigator.share) {
				await navigator.share({ title: view.quizTitle, url: shareUrl });
				return;
			}
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// пользователь закрыл окно «Поделиться» или буфер недоступен
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold">{view.quizTitle}</h1>
		<p class="mt-1 text-muted-foreground">
			Вопросов: {view.total}, на ответ — {Math.round(view.timeLimitMs / 1000)} сек.
		</p>
	</div>

	<div class="rounded-xl border border-border bg-card p-4 text-center">
		<p class="text-sm text-muted-foreground">Код комнаты</p>
		<p class="mt-1 text-4xl font-semibold tracking-[0.3em]">{view.code}</p>
		<button
			type="button"
			onclick={share}
			class="mt-3 cursor-pointer text-sm text-primary underline underline-offset-4"
		>
			{copied ? 'Ссылка скопирована' : 'Позвать друзей по ссылке'}
		</button>
	</div>

	<div>
		<h2 class="mb-2 font-medium">В комнате ({view.players.length})</h2>
		<Scoreboard players={view.players} youId={view.you.id} phase={view.phase} />
	</div>

	{#if view.you.isHost}
		<Button onclick={onstart} disabled={busy} class="w-full">Начать игру</Button>
	{:else}
		<p class="text-center text-muted-foreground" aria-live="polite">
			Ждём, пока ведущий начнёт игру…
		</p>
	{/if}
</div>
