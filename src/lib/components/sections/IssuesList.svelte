<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
	let {
		items
	}: {
		items: Array<{ theme: string; points: string[]; gridClass: string }>;
	} = $props();
</script>

<div
	class="m-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]  scroll-mt-24" id="requests"
>
	<Reveal>
		<div class="text-center subtitle mx-5">
			Помогаю справляться с тревогой, выгоранием, прокрастинацией и найти путь к жизни, которую вам
			хочется жить
		</div>
	</Reveal>

	<h2 class="subtitle" >c чем ко мне обращаются</h2>
	<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
		{#each items as group}
			<div class="{group.gridClass} min-h-[220px]">
				<Reveal axis="x" class="h-full">
					<div
						class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-[#f7f5f0] p-6"
					>
						<!-- Заголовок карточки -->
						<div class="mb-4 flex items-center gap-3">
							<h3 class="text-lg font-semibold text-[#191919]">{group.theme}</h3>
						</div>

						<!-- Список пунктов -->
						<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
							{#each group.points as point}
								<li class="flex items-center gap-3">
									<span class="flex-shrink-0">—</span>
									<div><div class="reveal-root w-fit"><p>{point}</p></div></div>
								</li>
							{/each}
						</ul>
					</div>
				</Reveal>
			</div>
		{/each}
	</div>
</div>
