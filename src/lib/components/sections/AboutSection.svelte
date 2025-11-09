<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';

	const {
		items
	}: {
		items: Array<{ icon: string; highlight: string; text: string; gridClass: string }>;
	} = $props();

	const iconMap: Record<string, string> = {
		briefcase: 'icon-[lucide--briefcase]',
		'book-open': 'icon-[lucide--book-open]',
		flask: 'icon-[lucide--flask-conical]',
		compass: 'icon-[lucide--compass]',
		'trending-up': 'icon-[lucide--trending-up]',
		clock: 'icon-[lucide--clock]',
		lightbulb: 'icon-[lucide--lightbulb]'
	};
</script>

<div
	class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
>
	<Reveal>
		<h3 class="subtitle">обо мне</h3>
	</Reveal>

	<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24">
		{#each items as item}
			<div class={item.gridClass}>
				<Reveal axis="x" class="h-full">
					<div
						class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-[#F2F0EF] p-6"
					>
						<div>
							<span class="{iconMap[item.icon]} mb-4 h-6 w-6 text-right text-[#B8A98A]"></span>
							<h4 class="text-lg font-semibold text-[#191919]">{item.highlight}</h4>
						</div>
						<p class="leading-relaxed text-[#191919]">{item.text}</p>
					</div>
				</Reveal>
			</div>
		{/each}
	</div>
</div>
