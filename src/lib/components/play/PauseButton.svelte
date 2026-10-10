<script lang="ts">
	type Props = {
		onpause: () => void;
		busy: boolean;
	};

	let { onpause, busy }: Props = $props();
</script>

<button
	type="button"
	onclick={onpause}
	disabled={busy}
	class="cursor-pointer rounded-md border border-border px-2.5 py-0.5 text-sm text-foreground transition-colors duration-150 hover:border-primary disabled:cursor-default disabled:opacity-60"
>
	Пауза
</button>
