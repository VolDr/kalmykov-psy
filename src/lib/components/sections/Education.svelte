<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import DiplomaModal from '$lib/components/DiplomaModal.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { educationGroups } from '$lib/data/education';
	import { cn } from '$lib/utils';

	let { isOpen = false }: { isOpen?: boolean } = $props();
	let isModalOpen = $state(false);
	let selectedDiplomaIndex = $state(0);

	const diplomas = $derived(
		educationGroups
			.flatMap((group) => group.items)
			.filter((item) => item.diploma)
			.map((item) => ({
				imageUrl: item.diploma!,
				title: item.title
			}))
	);

	function openDiplomaModal(imageUrl: string) {
		const index = diplomas.findIndex((d) => d.imageUrl === imageUrl);
		selectedDiplomaIndex = index >= 0 ? index : 0;
		isModalOpen = true;
	}
</script>

<div class="w-full scroll-mt-24" id="education">
	<AccordionItem {isOpen}>
		{#snippet header()}
			<Reveal width="full" axis="x">
				<h2  class="subtitle scroll-mt-24">где я учился</h2>
			</Reveal>
		{/snippet}
	
		
				{#each educationGroups as group, groupIndex}
					<div class={groupIndex > 0 ? 'mt-10' : ''}>
						<h3 class="mb-6 text-xl font-semibold text-foreground/90">{group.category}</h3>
						
						<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
							{#each group.items as item, i}
								<svelte:element
									this={item.diploma ? 'button' : 'div'}
									onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
									class={cn(
										'group relative rounded-lg bg-background py-4 pl-4 text-left transition-all',
										{
											// Ховер эффекты только если есть диплом
											'hover:cursor-pointer hover:bg-border': item.diploma,
											// Если элемент последний и нечетный, растягиваем его (как в примере)
											'md:col-span-2': (i === group.items.length - 1) && (group.items.length % 2 !== 0)
										}
									)}
								>
									{#if item.diploma}
										<span
											class="icon-[lucide--eye] absolute right-4 top-4 h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-30"
										></span>
									{/if}
									
									<h5
										class={cn('text-base font-medium leading-snug', {
											'group-hover:text-foreground/60': item.diploma
										})}
									>
										{item.title}
									</h5>
									<p class="mt-1.5 text-xs text-foreground/50">{item.details}</p>
								</svelte:element>
							{/each}
						</div>
					</div>
				{/each}
		
	
	</AccordionItem>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />