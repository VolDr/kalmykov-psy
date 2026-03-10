<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';

	let { description = $bindable(''), error }: { description?: string; error?: string } = $props();
</script>

<div class="space-y-2">
	<Label for="description">Описание</Label>
	<Textarea
		id="description"
		name="description"
		bind:value={description}
		placeholder="Введите описание клиента"
		aria-invalid={!!error}
		class="max-h-48 min-h-24"
	/>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
