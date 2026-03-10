<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { name = $bindable(''), error }: { name?: string; error?: string } = $props();
</script>

<div class="space-y-2">
	<Label for="name">
		Имя (ID клиента)
		<span class="text-destructive">*</span>
	</Label>
	<Input
		id="name"
		name="name"
		bind:value={name}
		placeholder="Имя"
		aria-invalid={!!error}
		class="h-12"
	/>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
