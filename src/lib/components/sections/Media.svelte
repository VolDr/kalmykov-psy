<script lang="ts">
    import Reveal from '$lib/components/Reveal.svelte';
</script>

<div class="w-full scroll-mt-24 pt-16" id="media">
    <div class="mx-auto md:max-w-[960px] lg:max-w-[1200px]">
        <div class="px-5">
            <Reveal><h2 class="subtitle mb-12 text-center">я в медиа</h2></Reveal>
        </div>

        <!-- Добавлен pb-10, чтобы абсолютная ссылка влезла и не обрезалась контейнером -->
        <div class="flex w-full snap-x snap-mandatory scroll-px-5 items-stretch gap-4 overflow-x-auto overflow-y-hidden px-5 pb-10 md:mb-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-5 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            
            <!-- Карточка 1: RG.ru -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-[#E5E5E5] bg-white p-8 transition-all duration-300 hover:border-[#B8A98A]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://rg.ru/2025/07/16/kak-spravitsia-s-vygoraniem-i-ustalostiu-ot-raboty-prichiny-priznaki-i-chto-delat.html#6"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
                            aria-label="Как справиться с выгоранием и усталостью"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                            <img
                                src="/rg.webp"
                                alt="Российская газета"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-[#191919] transition-colors group-hover:text-[#B8A98A]">
                            Как справиться с выгоранием и усталостью
                        </h3>
                    </div>
                </Reveal>
            </div>

            <!-- Карточка 2: Psychodemia Интенсив -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-[#E5E5E5] bg-white p-8 transition-all duration-300 hover:border-[#B8A98A]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://psychodemia.ru/myagkij-start-v-psikhologiyu"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
                            aria-label="Практический интенсив «Выгорание: что это и как с ним работать»"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                              <img
                                src="/psihodemia.webp"
                                alt="Психодемия"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-[#191919] transition-colors group-hover:text-[#B8A98A]">
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
                        class="flex items-center gap-2 text-sm font-semibold text-[#B8A98A] transition-colors hover:text-[#9e8f72] hover:underline"
                    >
                        <span class="icon-[lucide--play-circle] h-4 w-4"></span>
                        <span>Посмотреть в записи</span>
                    </a>
                </div>
            </div>

            <!-- Карточка 3: Psychodemia Интервью -->
            <div class="relative flex w-[75vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none">
                <Reveal class="flex h-full w-full flex-1 flex-col">
                    <div class="group relative flex flex-1 flex-col items-center justify-start rounded-2xl border border-[#E5E5E5] bg-white p-8 transition-all duration-300 hover:border-[#B8A98A]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-10">
                        <a
                            href="https://t.me/psychodemia/4587"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
                            aria-label="Интервью: как я пришел в профессию"
                        ></a>
                        
                        <div class="mb-6 flex h-14 w-full items-center justify-center opacity-60 grayscale-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 md:grayscale">
                            <img
                                src="/psihodemia.webp"
                                alt="Психодемия"
                                class="max-h-full max-w-[140px] object-contain"
                            />
                        </div>
                        <h3 class="text-center text-lg font-medium leading-relaxed text-[#191919] transition-colors group-hover:text-[#B8A98A]">
                            Интервью: как я пришел в профессию
                        </h3>
                    </div>
                </Reveal>
            </div>

        </div>
    </div>
</div>