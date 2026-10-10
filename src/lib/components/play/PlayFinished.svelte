<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import type { RoomView } from '$lib/data/game-room-types';

	type Props = {
		view: RoomView;
		onrestart: () => void;
		busy: boolean;
	};

	let { view, onrestart, busy }: Props = $props();

	const winners = $derived(
		view.players.filter((p) => p.score === (view.players[0]?.score ?? 0) && p.score > 0)
	);
</script>

<div class="space-y-6">
	<div class="text-center">
		<p class="text-sm text-muted-foreground">{view.quizTitle}</p>
		<h1 class="mt-1 text-2xl font-semibold">
			{#if winners.length === 1}
				Победил {winners[0].name}
			{:else if winners.length > 1}
				Ничья: {winners.map((p) => p.name).join(', ')}
			{:else}
				Игра окончена
			{/if}
		</h1>
	</div>

	<Scoreboard players={view.players} youId={view.you.id} phase={view.phase} />

	{#if view.you.isHost}
		<Button onclick={onrestart} disabled={busy} class="w-full">Сыграть ещё раз</Button>
	{:else}
		<p class="text-center text-muted-foreground" aria-live="polite">
			Ведущий может запустить игру заново
		</p>
	{/if}
	<a
		href="/play"
		class="block text-center text-sm text-muted-foreground underline underline-offset-4"
	>
		Выбрать другую викторину
	</a>
</div>
