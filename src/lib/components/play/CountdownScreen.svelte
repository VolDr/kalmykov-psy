<script lang="ts">
	import PauseButton from './PauseButton.svelte';
	import type { RoomView } from '$lib/data/game-room-types';

	type Props = {
		view: RoomView;
		remainingMs: number;
		onpause: () => void;
		busy: boolean;
	};

	let { view, remainingMs, onpause, busy }: Props = $props();

	// 3 → 2 → 1; сам вопрос в это время скрыт даже в данных, которые пришли с сервера
	const digit = $derived(
		Math.min(view.countdownMs / 1000, Math.max(1, Math.ceil(remainingMs / 1000)))
	);
	const share = $derived(Math.min(1, remainingMs / view.countdownMs));
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
		<span>Вопрос {view.index + 1} из {view.total}</span>
		{#if view.you.isHost}
			<PauseButton {onpause} {busy} />
		{/if}
	</div>

	<div class="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
		<div
			class="h-full bg-primary transition-[width] duration-200"
			style:width="{share * 100}%"
		></div>
	</div>

	<div class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
		<p class="text-lg text-muted-foreground">Приготовьтесь</p>
		<!-- key по цифре: на каждую новую цифру анимация появления запускается заново -->
		{#key digit}
			<p
				class="animate-in text-9xl font-semibold tabular-nums duration-300 zoom-in-50 fade-in motion-reduce:animate-none"
				aria-live="assertive"
			>
				{digit}
			</p>
		{/key}
	</div>
</div>
