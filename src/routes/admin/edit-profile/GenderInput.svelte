<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	let { gender = $bindable(''), error }: { gender?: string; error?: string } = $props();

	const genderOptions = ['Не указано', 'м', 'ж'];
	let showSuggestions = $state(false);
	let filteredOptions = $derived(
		genderOptions.filter((opt) => opt.toLowerCase().includes(gender.toLowerCase()))
	);

	function selectOption(option: string) {
		gender = option === 'Не указано' ? '' : option;
		showSuggestions = false;
	}
</script>

<div class="relative space-y-2">
	<Label for="gender">Пол</Label>
	<Input
		id="gender"
		name="gender"
		bind:value={gender}
		placeholder="Выберите пол"
		aria-invalid={!!error}
		class="h-12"
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
					class="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
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
