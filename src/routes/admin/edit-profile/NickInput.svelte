<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { nick = $bindable(''), error }: { nick?: string; error?: string } = $props();
</script>

<div class="space-y-2">
	<Label for="nick">Ник (отображаемое имя)</Label>
	<Input
		id="nick"
		name="nick"
		bind:value={nick}
		placeholder="Ник"
		aria-invalid={!!error}
		class="h-12"
	/>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
