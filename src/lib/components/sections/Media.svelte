<script lang="ts">
    import Reveal from '$lib/components/Reveal.svelte';

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

<div class="w-full scroll-mt-24 pt-16" id="media">
    <div class="mx-auto md:max-w-[960px] lg:max-w-[1200px]">
        <div class="px-5">
            <Reveal><h2 class="subtitle mb-12 text-center">я в медиа</h2></Reveal>
        </div>

        <!-- Добавлен pb-10, чтобы абсолютная ссылка влезла и не обрезалась контейнером -->
        <div class="flex w-full scroll-pl-4 snap-x snap-mandatory  items-stretch gap-4 overflow-x-auto overflow-y-hidden px-4 pb-10 md:mb-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-5 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onwheel={handleWheelScroll}>
            
            <!-- Карточка 1: RG.ru -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://rg.ru/2025/07/16/kak-spravitsia-s-vygoraniem-i-ustalostiu-ot-raboty-prichiny-priznaki-i-chto-delat.html#6"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Как справиться с выгоранием и усталостью"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                            <img
                                src="/rg.webp"
                                alt="Российская газета"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-foreground transition-colors group-hover:text-primary">
                            Как справиться с выгоранием и усталостью
                        </h3>
                    </div>
                </Reveal>
            </div>

            <!-- Карточка 2: Psychodemia Интенсив -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://psychodemia.ru/myagkij-start-v-psikhologiyu"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Практический интенсив «Выгорание: что это и как с ним работать»"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                              <img
                                src="/psihodemia.webp"
                                alt="Психодемия"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-foreground transition-colors group-hover:text-primary">
                            Практический интенсив «Выгорание: что это и как с ним работать»
                        </h3>
                    </div>
                </Reveal>
                <!-- Выносная ссылка: теперь absolute везде -->
                <div class="absolute left-0 top-full mt-4 flex w-full justify-center">
                    <a
                        href="https://t.me/kalmykov_psy/262"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                    >
                        <span class="icon-[lucide--play-circle] h-4 w-4"></span>
                        <span>Посмотреть в записи</span>
                    </a>
                </div>
            </div>

            <!-- Карточка 3: Psychodemia Интервью -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://t.me/psychodemia/4587"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Интервью: как я пришёл в профессию"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                            <img
                                src="/psihodemia.webp"
                                alt="Психодемия"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-foreground transition-colors group-hover:text-primary">
                            Интервью: как я пришёл в профессию
                        </h3>
                    </div>
                </Reveal>
            </div>

        </div>
    </div>
</div>