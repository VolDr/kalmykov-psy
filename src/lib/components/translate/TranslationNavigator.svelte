<script lang="ts">
	import { cn } from '#lib/utils.js';
	import type { TranslationEntry, TranslationItem } from '#lib/data/translation.js';

	let {
		items,
		entries,
		current,
		hasGuide,
		onselect
	}: {
		items: TranslationItem[];
		entries: Record<string, TranslationEntry>;
		/** Номер текущего шага; шаг 0 — «Как переводить», если он есть */
		current: number;
		hasGuide: boolean;
		onselect: (step: number) => void;
	} = $props();

	const offset = $derived(hasGuide ? 1 : 0);

	const groups = $derived.by(() => {
		const result: { name: string; items: { item: TranslationItem; index: number }[] }[] = [];
		items.forEach((item, index) => {
			const last = result.at(-1);
			if (last?.name === item.group) last.items.push({ item, index });
			else result.push({ name: item.group, items: [{ item, index }] });
		});
		return result;
	});
</script>

<nav aria-label="Пункты опросника" class="space-y-4">
	{#if hasGuide}
		<button
			type="button"
			onclick={() => onselect(0)}
			aria-current={current === 0 ? 'step' : undefined}
			class={cn(
				'h-9 rounded-lg border px-3 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
				current === 0
					? 'border-primary bg-primary text-white'
					: 'border-navy/15 bg-white text-navy hover:border-navy/40'
			)}
		>
			Как переводить
		</button>
	{/if}
	{#each groups as group (group.name)}
		<div>
			<p class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
				{group.name}
			</p>
			<ul class="flex flex-wrap gap-1.5">
				{#each group.items as { item, index } (item.key)}
					{@const done = Boolean(entries[item.key]?.translation.trim())}
					{@const commented = Boolean(entries[item.key]?.comment.trim())}
					<li>
						<button
							type="button"
							onclick={() => onselect(index + offset)}
							aria-label={`${item.label}${done ? ', переведено' : ''}${commented ? ', есть комментарий' : ''}`}
							aria-current={index + offset === current ? 'step' : undefined}
							class={cn(
								'relative h-9 min-w-9 rounded-lg border px-2 text-sm tabular-nums transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
								done
									? 'border-primary/30 bg-primary/10 text-navy hover:bg-primary/20'
									: 'border-navy/15 bg-white text-navy/70 hover:border-navy/40',
								index + offset === current &&
									'border-primary bg-primary text-white hover:bg-primary'
							)}
						>
							{item.short}
							{#if commented}
								<span
									class="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-white bg-amber-500"
									aria-hidden="true"
								></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
	<p class="flex items-center gap-3 text-xs text-muted-foreground">
		<span class="inline-flex items-center gap-1.5">
			<span class="size-3 rounded border border-primary/30 bg-primary/10"></span> есть перевод
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="size-2.5 rounded-full bg-amber-500"></span> есть комментарий
		</span>
	</p>
</nav>
