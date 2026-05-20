<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	let {
		source = $bindable(''),
		sources = [],
		error
	}: { source?: string; sources: string[]; error?: string } = $props();

	let showSuggestions = $state(false);
	let filteredSources = $derived(
		sources.filter((s) => s.toLowerCase().includes(source.toLowerCase()))
	);

	function selectSource(selectedSource: string) {
		source = selectedSource;
		showSuggestions = false;
	}
</script>

<div class="relative space-y-2">
	<Label for="source">
		Источник
		<span class="text-destructive">*</span>
	</Label>
	<Input
		id="source"
		name="source"
		bind:value={source}
		placeholder="Источник обращения"
		aria-invalid={!!error}
		class="h-12"
		onfocus={() => (showSuggestions = true)}
		onblur={() => setTimeout(() => (showSuggestions = false), 200)}
	/>
	{#if showSuggestions && filteredSources.length > 0}
		<div
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
		>
			{#each filteredSources as sourceOption}
				<button
					type="button"
					class="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => selectSource(sourceOption)}
				>
					{sourceOption}
				</button>
			{/each}
		</div>
	{/if}
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
