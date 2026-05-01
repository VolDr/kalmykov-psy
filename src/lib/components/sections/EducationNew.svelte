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
                <h2 class="subtitle scroll-mt-24">где я учился</h2>
            </Reveal>
        {/snippet}
    
        <div class="pt-4 md:pt-6">
            {#each educationGroups as group, groupIndex}
                <div class={groupIndex > 0 ? 'mt-12' : 'mt-2'}>
                    <h3 class="mb-6 text-2xl font-circe font-semibold text-[#191919]">{group.category}</h3>
                    
                    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {#each group.items as item, i}
                            <svelte:element
                                this={item.diploma ? 'button' : 'div'}
                                onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
                                class={cn(
                                    'group relative flex flex-col justify-between rounded-2xl border border-[#B8A98A] bg-white p-6 md:p-8 text-left transition-all duration-300',
                                    {
                                        'hover:cursor-pointer focus-visible:outline-[#B8A98A] focus:outline-[#B8A98A] outline-0': item.diploma,
                                        'md:col-span-2': (i === group.items.length - 1) && (group.items.length % 2 !== 0)
                                    }
                                )}
                            >
                                <div class="relative z-10">
                                    <h5 class={cn('text-lg font-medium leading-snug text-[#191919] transition-colors', {
                                        'group-hover:text-[#B8A98A]': item.diploma
                                    })}>
                                        {item.title}
                                    </h5>
                                    <p class="mt-3 text-sm text-[#191919]/60 leading-relaxed max-w-[90%]">{item.details}</p>
                                </div>
                                
                                {#if item.diploma}
                                    <div class="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f5f0] text-[#B8A98A] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#B8A98A] group-hover:text-white">
                                        <span class="icon-[lucide--file-badge-2] h-5 w-5"></span>
                                    </div>
                                {/if}
                            </svelte:element>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </AccordionItem>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />