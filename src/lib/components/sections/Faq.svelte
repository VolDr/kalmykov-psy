<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import { faqItems } from '$lib/data/faq';
</script>

<div class="flex w-full flex-col items-center gap-2.5 md:gap-3.5 scroll-mt-24" id="faq">
	<Reveal>
		<h2 class="subtitle scroll-mt-24" ><a href="#faq">вопрос — ответ</a></h2>
	</Reveal>

	<div class="grid min-w-full grid-cols-1 gap-5 sm:grid-cols-1">
		<div class="sm:col-span-7 lg:col-span-8">
			<div class="flex flex-col flex-nowrap content-center items-stretch justify-center gap-4">
				{#each faqItems as item}
					<Reveal width="full" axis="x">
						<AccordionItem>
							{#snippet header()}
								<h3>{item.question}</h3>
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
