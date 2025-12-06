<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let {
		clientId = $bindable(undefined),
		clientName = $bindable(''),
		clients = [],
		initialClientId
	}: {
		clientId?: number | undefined;
		clientName?: string;
		clients: Array<{ id: number; nick: string | null; value: string }>;
		initialClientId?: number;
	} = $props();

	let showSuggestions = $state(false);

	// Initialize clientName from initialClientId if provided
	$effect(() => {
		if (initialClientId !== undefined && clientName === '') {
			const client = clients.find((c) => c.id === initialClientId);
			if (client) {
				clientName = client.nick || client.value;
				clientId = client.id;
			}
		}
	});

	let filteredClients = $derived(
		clients.filter((client) => {
			const searchText = clientName.toLowerCase();
			const nick = client.nick?.toLowerCase() || '';
			const value = client.value.toLowerCase();
			return nick.includes(searchText) || value.includes(searchText);
		})
	);

	function selectClient(client: { id: number; nick: string | null; value: string }) {
		clientName = client.nick || client.value;
		clientId = client.id;
		showSuggestions = false;
	}

	function handleInput() {
		// Reset clientId when user types
		clientId = undefined;
	}
</script>

<div class="relative space-y-2">
	<Label for="clientName">
		Имя
		<span class="text-destructive">*</span>
	</Label>
	<Input
		id="clientName"
		name="clientName"
		bind:value={clientName}
		placeholder="Начните вводить имя клиента"
		required
		onfocus={() => (showSuggestions = true)}
		onblur={() => setTimeout(() => (showSuggestions = false), 200)}
		oninput={handleInput}
	/>
	<input type="hidden" name="clientId" value={clientId} />
	{#if showSuggestions && filteredClients.length > 0}
		<div
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
		>
			{#each filteredClients as client}
				<button
					type="button"
					class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => selectClient(client)}
				>
					{#if client.nick}
						<span>{client.nick}</span>
						<span class="ml-1 text-muted-foreground">({client.value})</span>
					{:else}
						{client.value}
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
