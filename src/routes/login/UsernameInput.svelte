<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	let { error, value, isSubmitting }: { error?: string; value?: string; isSubmitting: boolean } =
		$props();
</script>

<div class="mb-4">
	<label for="username" class="mb-1 block font-medium text-gray-700">Логин</label>
	<Input
		id="username"
		name="username"
		type="text"
		placeholder="логин"
		disabled={isSubmitting}
		value={value || ''}
		aria-invalid={!!error}
	/>
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>
