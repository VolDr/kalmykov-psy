<script lang="ts">
	import type { ReviewScale } from '#lib/data/translation-review-groups.js';

	let { scale, number, id }: { scale: ReviewScale; number: number; id: string } = $props();
</script>

<header class="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-5 select-text">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		Шкала {number} · пункты {scale.itemKeys.join(', ')}
	</p>
	<h2 {id} tabindex="-1" class="text-xl font-semibold text-navy">{scale.title}</h2>
	<p class="leading-relaxed text-foreground">{scale.definition}</p>
	{#each scale.quotes as quote (quote.text)}
		<p class="text-sm leading-relaxed text-muted-foreground">
			<q lang="en">{quote.text}</q> ({quote.year})
		</p>
	{/each}
	<p class="text-sm leading-relaxed text-foreground">
		<span class="font-medium">Высокий балл:</span>
		{scale.highScore}
	</p>
</header>
