<script lang="ts">
	import Reveal from './Reveal.svelte';

	let { items }: { items: string[] } = $props();
</script>

<div class="max-w-[720px] md:max-w-[960px] m-auto">
	<div class="px-5 z-10 relative">
		<div
			class="max-w-[1140px] mx-auto my-0 min-h-[50px] rounded-xl flex flex-col flex-nowrap items-center justify-center gap-2.5 lg:gap-3.5"
		>
			<Reveal>
				<div class="max-w-[720px] md:max-w-[960px] mx-auto">
					<div class="subtitle">
						помогаю справляться с тревогой, выгоранием прокрастинацией и найти путь к жизни, которую
						вам хочется жить
					</div>
				</div>
			</Reveal>
			<div class="container max-w-[720px] flex flex-col gap-2.5 lg:gap-3.5">
				С чем ко мне обращаются:
				<ul class="flex gap-2.5 lg:gap-3.5 content-start justify-start flex-col items-start">
					{#each items as text}
						<li class="flex items-center gap-3">
							<span class="flex-shrink-0">—</span>
							<div>
								<Reveal>
									<p>{text}</p>
								</Reveal>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>
