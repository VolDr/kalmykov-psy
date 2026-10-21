<script lang="ts">
	import type { MethodologyPage } from '$lib/data/questionnaireMethodology';

	let { details }: { details: MethodologyPage } = $props();
</script>

<section class="mt-12 border-t border-[#e4dccb] pt-9 text-foreground/85 md:mt-14 md:pt-11" aria-labelledby="questionnaire-methodology-title">
	<h2 id="questionnaire-methodology-title" class="text-[24px] leading-tight font-extrabold text-navy md:text-[28px]">
		{details.title}
	</h2>
	<p class="mt-4 text-[15px] leading-[1.75] md:text-[16px]">{details.intro}</p>

	<div class="mt-7 space-y-7">
		{#each details.sections as section (section.heading)}
			<section>
				<h3 class="text-[17px] font-bold leading-snug text-navy md:text-[19px]">{section.heading}</h3>
				<p class="mt-2 text-[15px] leading-[1.75] md:text-[16px]">{section.text}</p>
			</section>
		{/each}
	</div>

	<div class="mt-9 border-t border-[#e4dccb] pt-6">
		<h3 class="text-[17px] font-bold text-navy">Научные источники</h3>
		<ul class="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-[1.6] md:text-[15px]">
			{#each details.sources as source (source.label)}
				<li>
					{#if source.href}
						<a href={source.href} target="_blank" rel="noopener noreferrer" class="underline decoration-primary/60 underline-offset-4 hover:decoration-primary">
							{source.label}
						</a>
					{:else}
						{source.label}
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	{#if details.related.length}
		<nav class="mt-7" aria-label="Связанные опросники">
			<h3 class="text-[17px] font-bold text-navy">Другие опросники</h3>
			<ul class="mt-3 space-y-2 text-[14px] leading-relaxed md:text-[15px]">
				{#each details.related as related (related.href)}
					<li>
						<a href={related.href} class="font-medium text-navy underline decoration-primary/60 underline-offset-4 hover:decoration-primary">
							{related.label} →
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</section>
