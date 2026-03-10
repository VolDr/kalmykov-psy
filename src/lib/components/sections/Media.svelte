<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
</script>

<div
	class="col-span-1 mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-2.5 px-5 md:col-span-1 md:max-w-[960px] md:gap-3.5 lg:max-w-[1200px]"
>
	<div class="w-full scroll-mt-24" id="media">
		<div
			class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
		>
			<Reveal>
				<h2 class="subtitle">я в сми</h2>
			</Reveal>

			<div class="relative grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-3 md:px-0">
				<div class="relative flex flex-col">
					<Reveal class="h-full w-full">
						<div
							class="group relative flex h-full flex-col justify-between rounded-lg bg-[#F2F0EF] p-6 transition-all hover:bg-[#E8E6E5]"
						>
							<a
								href="https://rg.ru/2025/07/16/kak-spravitsia-s-vygoraniem-i-ustalostiu-ot-raboty-prichiny-priznaki-i-chto-delat.html#6"
								target="_blank"
								rel="noopener noreferrer"
								class="absolute inset-0 z-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
								aria-label="Как справиться с выгоранием и усталостью"
							></a>
							<div class="flex flex-col items-center gap-4 text-center">
								<div
									class="flex h-12 w-full items-center justify-center opacity-70 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 md:grayscale md:group-hover:grayscale-0"
								>
									<img
										src="/rg.webp"
										alt="Российская газета"
										class="max-h-full max-w-[120px] object-contain"
									/>
								</div>
								<h3 class="leading-relaxed text-[#191919]">
									Как справиться с выгоранием и усталостью
								</h3>
							</div>
						</div>
					</Reveal>
				</div>

				<div class="relative flex flex-col">
					<Reveal class="h-full w-full">
						<div
							class="group relative flex h-full flex-col justify-between rounded-lg bg-[#F2F0EF] p-6 transition-all hover:bg-[#E8E6E5]"
						>
							<a
								href="https://psychodemia.ru/myagkij-start-v-psikhologiyu"
								target="_blank"
								rel="noopener noreferrer"
								class="absolute inset-0 z-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
								aria-label="Практический интенсив «Выгорание: что это и как с ним работать»"
							></a>
							<div class="flex flex-col items-center gap-4 text-center">
								<div
									class="flex h-12 w-full items-center justify-center opacity-70 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 md:grayscale md:group-hover:grayscale-0"
								>
									<img
										src="/psihodemia.webp"
										alt="Психодемия"
										class="max-h-full max-w-[120px] object-contain"
									/>
								</div>
								<h3 class="leading-relaxed text-[#191919]">
									Практический интенсив «Выгорание: что это и как с ним работать»
								</h3>
							</div>
						</div>
					</Reveal>
					<div
						class="mt-1 flex justify-center md:absolute md:left-0 md:top-full md:mt-4 md:w-full"
					>
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

				<div class="relative flex flex-col">
					<Reveal class="h-full w-full">
						<div
							class="group relative flex h-full flex-col justify-between rounded-lg bg-[#F2F0EF] p-6 transition-all hover:bg-[#E8E6E5]"
						>
							<a
								href="https://t.me/psychodemia/4587"
								target="_blank"
								rel="noopener noreferrer"
								class="absolute inset-0 z-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8A98A] focus:ring-offset-2"
								aria-label="Интервью: как я пришел в профессию"
							></a>
							<div class="flex flex-col items-center gap-4 text-center">
								<div
									class="flex h-12 w-full items-center justify-center opacity-70 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 md:grayscale md:group-hover:grayscale-0"
								>
									<img
										src="/psihodemia.webp"
										alt="Психодемия"
										class="max-h-full max-w-[120px] object-contain"
									/>
								</div>
								<h3 class="leading-relaxed text-[#191919]">
									Интервью: как я пришел в профессию
								</h3>
							</div>
						</div>
					</Reveal>
				</div>
			</div>
		</div>
		<div class="md:mt-[54px]"></div>
	</div>
</div>