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

<div class="w-full">
	<AccordionItem {isOpen}>
		{#snippet header()}
			<Reveal width="full" axis="x">
				<h3 id="education" class="subtitle">где я учился</h3>
			</Reveal>
		{/snippet}
		{#snippet children()}
			<div class="pl-4 lg:pl-32">
				{#each educationGroups as group, groupIndex}
					<div class={groupIndex > 0 ? 'mt-10' : ''}>
						<h4 class="mb-6 text-xl font-semibold text-[#191919]/90">{group.category}</h4>
						<div class="relative pl-8">
							{#each group.items as item}
								<div class="relative mb-8">
									<!-- Маркер -->
									<!-- <div
										class="absolute top-1.5 -left-[75px] flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F0EF]"
									>
										{#if item.completed}
											<svg
												class="h-5 w-5"
												fill="none"
												stroke="black"
												viewBox="0 0 24 24"
												stroke-width="2"
											>
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											<div class="h-2 w-2 rounded-full bg-black/20"></div>
										{/if}
									</div> -->

									<!-- Контент -->
									<svelte:element
										this={item.diploma ? 'button' : 'div'}
										onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
										class={cn('group w-full text-left ', { 'hover:cursor-pointer': item.diploma })}
									>
										<h5
											class={cn('cursor-default text-lg leading-snug font-medium ', {
												'group-hover:text-[#191919]/60 hover:cursor-pointer': item.diploma
											})}
										>
											{item.title}
											{#if item.diploma}
												<span
													class="ml-1.5 icon-[lucide--eye] inline-block h-4 w-4 opacity-40 group-hover:opacity-30"
												></span>
											{/if}
										</h5>
										<p class="mt-1 text-sm text-[#191919]/50">{item.details}</p>
									</svelte:element>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/snippet}
	</AccordionItem>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />
