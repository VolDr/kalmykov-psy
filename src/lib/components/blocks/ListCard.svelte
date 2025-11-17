<script lang="ts">
	import { cn } from '$lib/utils';
	import Reveal from '$lib/components/Reveal.svelte';

	interface Props {
		title: string;
		points: string[];
		gridClass?: string;
		minHeight?: string;
		withReveal?: boolean;
		justify?: 'between' | 'start';
	}

	let {
		title,
		points,
		gridClass = '',
		minHeight = '220px',
		withReveal = false,
		justify = 'between'
	}: Props = $props();

	const justifyClass = justify === 'between' ? 'justify-between' : 'justify-start';

	const cardContent = () => {
		return `
			<div class="flex h-full min-h-[180px] flex-col ${justifyClass} rounded-lg bg-[#F2F0EF] p-6">
				<div class="mb-4 flex items-center gap-3">
					<h4 class="text-lg font-semibold text-[#191919]">${title}</h4>
				</div>
				<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
					${points.map((point) => `<li class="flex items-center gap-3"><span class="flex-shrink-0">—</span><div><div class="reveal-root w-fit"><p>${point}</p></div></div></li>`).join('')}
				</ul>
			</div>
		`;
	};
</script>

<div class={cn(gridClass, `min-h-[${minHeight}]`)}>
	{#if withReveal}
		<Reveal axis="x" class="h-full">
			<div
				class={cn('flex h-full min-h-[180px] flex-col rounded-lg bg-[#F2F0EF] p-6', justifyClass)}
			>
				<div class="mb-4 flex items-center gap-3">
					<h4 class="text-lg font-semibold text-[#191919]">{title}</h4>
				</div>
				<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
					{#each points as point}
						<li class="flex items-center gap-3">
							<span class="flex-shrink-0">—</span>
							<div>
								<div class="reveal-root w-fit">
									<p>{point}</p>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</Reveal>
	{:else}
		<div class={cn('flex h-full min-h-[180px] flex-col rounded-lg bg-[#F2F0EF] p-6', justifyClass)}>
			<div class="mb-4 flex items-center gap-3">
				<h4 class="text-lg font-semibold text-[#191919]">{title}</h4>
			</div>
			<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
				{#each points as point}
					<li class="flex items-center gap-3">
						<span class="flex-shrink-0">—</span>
						<div>
							<div class="reveal-root w-fit">
								<p>{point}</p>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
