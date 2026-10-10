<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		isHost: boolean;
		busy: boolean;
		onresume: () => void;
	};

	let { isHost, busy, onresume }: Props = $props();

	let resumeButton = $state<HTMLElement | null>(null);

	// Ведущему сразу доступна кнопка с клавиатуры (Enter / пробел)
	onMount(() => resumeButton?.focus());
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Пауза"
	class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background px-6 text-center"
>
	<p class="text-6xl font-semibold tracking-wide sm:text-8xl">Пауза</p>

	{#if isHost}
		<div bind:this={resumeButton} tabindex="-1" class="w-full max-w-xs outline-none">
			<Button onclick={onresume} disabled={busy} class="w-full">Продолжить</Button>
		</div>
	{:else}
		<p class="text-lg text-muted-foreground" aria-live="polite">Ведущий скоро продолжит игру</p>
	{/if}
</div>
