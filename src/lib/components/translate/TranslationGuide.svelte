<script lang="ts">
	import MarkdownLink from '#lib/components/MarkdownLink.svelte';

	let { text, onstart }: { text: string; onstart: () => void } = $props();

	const paragraphs = $derived(text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim()));
</script>

<article aria-labelledby="tr-guide-title" class="space-y-6">
	<h2 id="tr-guide-title" class="text-xl font-semibold text-navy">Как переводить</h2>
	<div class="space-y-3 text-base leading-relaxed text-navy/85">
		{#each paragraphs as paragraph, index (index)}
			<p><MarkdownLink text={paragraph} /></p>
		{/each}
	</div>
	<div class="flex justify-end">
		<button
			type="button"
			onclick={onstart}
			class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			Начать перевод <span aria-hidden="true">→</span>
		</button>
	</div>
</article>
