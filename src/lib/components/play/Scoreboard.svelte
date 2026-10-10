<script lang="ts">
	import { cn } from '$lib/utils';
	import type { PlayerView, RoomPhase } from '$lib/data/game-room-types';

	type Props = {
		players: PlayerView[];
		youId: string;
		phase: RoomPhase;
	};

	let { players, youId, phase }: Props = $props();

	const showScores = $derived(phase !== 'lobby');
</script>

<ul class="divide-y divide-border rounded-xl border border-border bg-card">
	{#each players as player, i (player.id)}
		<li
			class={cn(
				'flex items-center gap-3 px-4 py-3',
				player.id === youId && 'bg-primary/10',
				!player.connected && 'opacity-50'
			)}
		>
			{#if phase === 'reveal' || phase === 'finished'}
				<span class="w-6 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
			{/if}
			<span class="flex-1 truncate font-medium">
				{player.name}
				{#if player.isHost}
					<span class="ml-1 text-xs font-normal text-muted-foreground">ведущий</span>
				{/if}
				{#if player.id === youId}
					<span class="ml-1 text-xs font-normal text-muted-foreground">вы</span>
				{/if}
				{#if player.answerText}
					<span class="block truncate text-sm font-normal text-muted-foreground">
						«{player.answerText}»
					</span>
				{/if}
			</span>
			{#if phase === 'question'}
				<span class="text-sm text-muted-foreground">
					{player.answered ? 'ответил' : player.connected ? 'думает…' : 'вышел'}
				</span>
			{:else if phase === 'reveal' && player.gain !== null}
				<span
					class={cn(
						'text-sm tabular-nums',
						player.gain > 0 ? 'text-primary' : 'text-muted-foreground'
					)}
				>
					{player.gain > 0 ? `+${player.gain}` : '0'}
				</span>
			{/if}
			{#if showScores}
				<span class="w-16 text-right font-semibold tabular-nums">{player.score}</span>
			{/if}
		</li>
	{/each}
</ul>
