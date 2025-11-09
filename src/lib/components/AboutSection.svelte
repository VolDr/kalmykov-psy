<script lang="ts">
	import Reveal from './Reveal.svelte';

	let { items }: { items: string[] } = $props();
</script>

<div class="max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto flex flex-col items-center gap-6">
	<Reveal>
		<div class="subtitle">обо мне</div>
	</Reveal>

	<ul
		class="max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-2.5 md:gap-2.5 lg:grid-flow-col lg:grid-rows-[190px_93px]"
	>
		{#each items as text}
			<li>
				<Reveal axis="x" class="col-span-3 lg:col-span-1">
					<div class="flex items-center gap-3 mx-5 lg:mx-0">— <p>{text}</p></div>
				</Reveal>
			</li>
		{/each}
	</ul>
</div>
