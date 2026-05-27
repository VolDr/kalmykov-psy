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

    const categoryExplanations: Record<string, string> = {
        'Основное образование': 'Дипломы по психологическому консультированию — то, что дает право работать психологом.',
        'Подходы': 'Я работаю конкретными методами, а не интуитивно. Эти методы изучены в тысячах исследований и доказали свою эффективность в работе с психологическими запросами — примерно как доказанные схемы лечения в медицине.',
        'Специализации': 'Отдельные темы, в которые я погрузился глубже.',
        'Конференции': 'Я регулярно почещаю профессиональные встречи и конференции — там психологи обсуждают новые исследования, разбирают сложные случаи и учатся друг у друга.',
        'Остальное': 'Образование, которое напрямую не связано с консультированием, но помогает в работе с людьми..'
    };

    function openDiplomaModal(imageUrl: string) {
        const index = diplomas.findIndex((d) => d.imageUrl === imageUrl);
        selectedDiplomaIndex = index >= 0 ? index : 0;
        isModalOpen = true;
    }

    function scrollCarousel(event: Event, direction: 'left' | 'right') {
        const button = event.currentTarget as HTMLElement;
        const section = button.closest('.education-section');
        const carousel = section?.querySelector('.education-carousel');
        
        if (carousel) {
            const scrollAmount = 680; 
            carousel.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    }

    function handleWheelScroll(e: WheelEvent) {
        const target = e.currentTarget as HTMLElement;
        
        if (e.deltaX !== 0) return;

        const isAtLeftEdge = target.scrollLeft <= 0;
        const isAtRightEdge = Math.ceil(target.scrollLeft + target.clientWidth) >= target.scrollWidth;

        if ((e.deltaY < 0 && !isAtLeftEdge) || (e.deltaY > 0 && !isAtRightEdge)) {
            e.preventDefault();
            
            target.scrollBy({
                left: e.deltaY > 0 ? 200 : -200,
                behavior: 'smooth' 
            });
        }
    }
</script>

<div class="w-full scroll-mt-24" id="education">
    <AccordionItem {isOpen}>
        {#snippet header()}
            <Reveal width="full" axis="x">
                <div class="space-y-1.5 text-left">
                    <h2 class="subtitle scroll-mt-24">Где я учился</h2>
                    <p class="text-sm font-normal text-foreground/50 normal-case tracking-normal">
                        Сюда можно нажать, чтобы посмотреть мои документы об образовании, если для вас это важно.
                    </p>
                </div>
            </Reveal>
        {/snippet}
    
        <div class="pt-4 md:pt-6">
            {#each educationGroups as group, groupIndex}
                <div class="education-section {groupIndex > 0 ? 'mt-12' : 'mt-2'}">
                    
                    <div class="pl-4 flex items-end justify-between {categoryExplanations[group.category] ? 'mb-2' : 'mb-6'}">
                        <h3 class="text-xl font-circe font-semibold text-foreground md:text-2xl">
                            {group.category}
                        </h3>
                        
                        {#if group.items.length > 3}
                            <div class="hidden md:flex items-center gap-2 pb-1 pr-1">
                                <button
                                    onclick={(e) => scrollCarousel(e, 'left')}
                                    class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-all hover:border-primary hover:text-primary hover:shadow-sm"
                                    aria-label="Листать влево"
                                >
                                    <span class="icon-[lucide--chevron-left] h-5 w-5"></span>
                                </button>
                                <button
                                    onclick={(e) => scrollCarousel(e, 'right')}
                                    class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-all hover:border-primary hover:text-primary hover:shadow-sm"
                                    aria-label="Листать вправо"
                                >
                                    <span class="icon-[lucide--chevron-right] h-5 w-5"></span>
                                </button>
                            </div>
                        {/if}
                    </div>
                    
                    {#if categoryExplanations[group.category]}
                        <p class="pl-4 mb-6 max-w-[700px] text-sm leading-relaxed text-foreground/60  pr-20">
                            {categoryExplanations[group.category]}
                        </p>
                    {/if}
                    
                    <div 
                        class="education-carousel flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-6 pt-2 scroll-pl-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin] md:[scrollbar-color:var(--color-primary)_var(--color-background)] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-track]:bg-background md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-primary/70 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-primary my-scroll"
                        onwheel={handleWheelScroll}
                    >
                        {#each group.items as item, idx}
                            <svelte:element
                                this={item.diploma ? 'button' : 'div'}
                                onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
                                class={cn(
                                    ' group relative flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-border bg-background p-6 md:p-8 text-left transition-all duration-300',
                                    {
                                        'hover:cursor-pointer hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-visible:outline-primary focus:outline-primary outline-0': item.diploma,
                                        'ml-4': idx === 0,
                                        'mr-4' : idx === group.items.length - 1
                                    }
                                )}
                            >
                                <div class="relative z-10 w-full flex flex-col">
                                    {#if !item.completed}
                                        <span class="t-badge" data-open="true">
                                            <span class="t-badge-dot h-2 w-2 rounded-full bg-primary"></span>
                                        </span>
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-card text-foreground/60 rounded-md w-fit mb-3">
                                            В процессе
                                        </span>
                                    {/if}

                                    <h5 class={cn('text-lg font-medium leading-snug text-foreground transition-colors', {
                                        'group-hover:text-primary': item.diploma
                                    })}>
                                        {item.title}
                                    </h5>
                                    <p class="mt-3 text-sm text-foreground/60 leading-relaxed">{item.details}</p>
                                </div>
                                
                                {#if item.diploma}
                                    <div class="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
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