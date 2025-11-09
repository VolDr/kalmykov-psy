<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import { faqItems } from '$lib/data/faq';
</script>

<div class="flex flex-col items-center gap-2.5 md:gap-3.5 w-full">
	<Reveal>
		<a id="faq" class="subtitle" href="#faq">вопрос — ответ</a>
	</Reveal>

	<div class="grid grid-cols-1 sm:grid-cols-1 gap-5 min-w-full">
		<div class="sm:col-span-7 lg:col-span-8">
			<div class="flex flex-col flex-nowrap content-center justify-center items-stretch gap-4">
				{#each faqItems as item}
					<Reveal width="full" axis="x">
						<AccordionItem>
							{#snippet header()}
								<p>{item.question}</p>
							{/snippet}
							{#snippet children()}
								{#each item.answer.split('\n\n') as paragraph}
									<p><MarkdownLink text={paragraph} /></p>
								{/each}
							{/snippet}
						</AccordionItem>
					</Reveal>
				{/each}
			</div>
		</div>
	</div>
</div>
