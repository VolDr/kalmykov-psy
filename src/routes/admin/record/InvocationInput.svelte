<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { invocation = $bindable(''), error }: { invocation?: string; error?: string } = $props();

	const invocationOptions = ['Не указано', 'ты', 'вы'];
	let showSuggestions = $state(false);
	let filteredOptions = $derived(
		invocationOptions.filter((opt) => opt.toLowerCase().includes(invocation.toLowerCase()))
	);

	function selectOption(option: string) {
		invocation = option === 'Не указано' ? '' : option;
		showSuggestions = false;
	}
</script>

<div class="relative space-y-2">
	<Label for="invocation">На ты/на вы</Label>
	<Input
		id="invocation"
		name="invocation"
		bind:value={invocation}
		placeholder="Выберите обращение"
		aria-invalid={!!error}
		onfocus={() => (showSuggestions = true)}
		onblur={() => setTimeout(() => (showSuggestions = false), 200)}
	/>
	{#if showSuggestions && filteredOptions.length > 0}
		<div
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
		>
			{#each filteredOptions as option}
				<button
					type="button"
					class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => selectOption(option)}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
