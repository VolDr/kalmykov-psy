<script lang="ts">
	import BreakdownTable from './BreakdownTable.svelte';
	import type { StructuresDataset } from './types';

	let { structures }: { structures: StructuresDataset } = $props();
	const number = new Intl.NumberFormat('ru-RU');
	const percent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
	const kickerClass = 'mb-1 text-xs font-medium uppercase tracking-wider text-gray-500';
	const titleClass = 'text-xl font-semibold';
	const panelClass = 'rounded-lg border bg-white p-5';
	const panelTitleClass = 'mb-4 text-sm font-semibold';
	const disclosureClass = 'overflow-hidden rounded-lg border bg-white';
	const summaryClass =
		'flex min-h-16 cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50 sm:px-6';
	const metricClass =
		'flex min-h-24 flex-col justify-between rounded-lg border bg-white p-4 [&>span]:text-xs [&>span]:text-gray-500 [&>strong]:font-mono [&>strong]:text-2xl [&>strong]:font-semibold';

	function priorityLabel(priority: 'high' | 'med' | 'low') {
		return priority === 'high' ? 'Главное' : priority === 'med' ? 'Средне' : 'Низкий';
	}

	function priorityClass(priority: 'high' | 'med' | 'low') {
		const base = 'inline-flex rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide';
		if (priority === 'high') return `${base} bg-red-100 text-red-800`;
		if (priority === 'med') return `${base} bg-amber-100 text-amber-800`;
		return `${base} bg-gray-100 text-gray-600`;
	}
</script>

<div class="space-y-12">
	<section aria-labelledby="structure-corpus">
		<p class={kickerClass}>01 · Корпус</p>
		<div class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
			<h2 id="structure-corpus" class={titleClass}>
				Структура {structures.meta.afterFilter} постов
			</h2>
			<span class="text-xs text-muted-foreground"
				>из {structures.meta.totalPostsInChannel} в канале</span
			>
		</div>
		<div class="grid gap-4 xl:grid-cols-2">
			{#each Object.values(structures.distributions) as distribution (distribution.title)}
				<div class={panelClass}>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="font-semibold">{distribution.title}</h3>
						<span class="font-mono text-xs text-muted-foreground">n = {distribution.total}</span>
					</div>
					<div class="space-y-3">
						{#each distribution.items as item (item.name)}
							<div
								class="grid grid-cols-[minmax(140px,1fr)_minmax(100px,1.2fr)_72px] items-center gap-3 text-sm"
							>
								<span>{item.name}</span>
								<div class="h-1.5 rounded-full bg-muted">
									<div
										class="h-full rounded-full {item.accent ? 'bg-primary' : 'bg-primary/55'}"
										style:width={`${item.share}%`}
									></div>
								</div>
								<span class="text-right font-mono text-xs"
									>{item.n} · {percent.format(item.share)}%</span
								>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each structures.flags as flag (flag.key)}
				<div class={panelClass}>
					<div class="flex items-baseline justify-between gap-4">
						<h3 class="text-sm font-semibold">{flag.label}</h3>
						<strong class="font-mono text-xl">{percent.format((flag.n / flag.total) * 100)}%</strong
						>
					</div>
					<div class="mt-3 h-2 rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary"
							style:width={`${(flag.n / flag.total) * 100}%`}
						></div>
					</div>
					<p class="mt-2 text-xs text-muted-foreground">{flag.n} из {flag.total} постов</p>
				</div>
			{/each}
		</div>
	</section>

	<section aria-labelledby="structure-patterns">
		<p class={kickerClass}>02 · Паттерны</p>
		<h2 id="structure-patterns" class="mb-5 {titleClass}">12 шаблонов поста</h2>
		<div class="space-y-2">
			{#each structures.patterns as pattern (pattern.n)}
				<details class={disclosureClass} open={pattern.n <= 3}>
					<summary class={summaryClass}>
						<span class="font-mono text-xs text-muted-foreground">№{pattern.n}</span>
						<span class="min-w-0 flex-1"
							><strong class="block truncate font-medium">{pattern.title}</strong><small
								class="block truncate text-xs text-muted-foreground"
								>{pattern.structure} · {pattern.length}</small
							></span
						>
						<span class="hidden gap-5 text-right text-xs sm:flex"
							><span><b class="block font-mono text-sm">{pattern.posts}</b>постов</span><span
								><b class="block font-mono text-sm">{number.format(pattern.avgViews)}</b>ср.
								просмотров</span
							><span><b class="block font-mono text-sm">{percent.format(pattern.avgEr)}%</b>ER</span
							></span
						>
						<span class="w-12 text-right font-mono text-sm"
							>{pattern.ehScore == null ? '—' : `${pattern.ehScore}/10`}</span
						>
					</summary>
					<div class="border-t px-4 py-5 sm:px-6">
						<p class="max-w-4xl text-sm leading-6 text-muted-foreground">{pattern.note}</p>
						<div class="mt-5 grid gap-3 lg:grid-cols-3">
							{#each pattern.examples as example (example.id)}
								<a
									class="rounded-lg bg-muted/70 p-4 transition-colors duration-200 hover:bg-muted"
									href="https://t.me/kalmykov_psy/{example.id}"
									target="_blank"
									rel="noopener noreferrer"
								>
									<div class="mb-2 flex justify-between font-mono text-xs">
										<span class="text-primary">#{example.id} ↗</span><span
											class="text-muted-foreground"
											>{number.format(example.v)} · ER {percent.format(example.er)}%</span
										>
									</div>
									<p class="text-sm leading-5">{example.text}</p>
								</a>
							{/each}
						</div>
					</div>
				</details>
			{/each}
		</div>
	</section>

	<section aria-labelledby="structure-emailhero">
		<p class={kickerClass}>03 · Эталон</p>
		<h2 id="structure-emailhero" class="mb-5 {titleClass}">Формула EmailHero</h2>
		<div class="mb-4 {panelClass}">
			<p class="text-center text-lg font-semibold sm:text-2xl">
				{structures.emailHero.formula} = {structures.emailHero.formulaShort}
			</p>
			<blockquote
				class="mx-auto mt-4 max-w-3xl rounded-lg bg-primary/10 px-5 py-4 text-center text-sm leading-6"
			>
				{structures.emailHero.formulaQuote}
			</blockquote>
		</div>
		<div class="grid gap-4 xl:grid-cols-3">
			<div class={panelClass}>
				<h3 class={panelTitleClass}>Эталонная структура</h3>
				<ol class="space-y-3">
					{#each structures.emailHero.structure as item, index (item.name)}
						<li class="grid grid-cols-[28px_1fr] gap-2">
							<span class="font-mono text-xs text-muted-foreground"
								>{String(index + 1).padStart(2, '0')}</span
							><span
								><strong class="block text-sm">{item.name}</strong><small
									class="text-muted-foreground">{item.fn}</small
								></span
							>
						</li>
					{/each}
				</ol>
			</div>
			<div class={panelClass}>
				<h3 class={panelTitleClass}>8 принципов</h3>
				<ol class="space-y-2 text-sm">
					{#each structures.emailHero.principles as item, index}<li class="flex gap-3">
							<span class="font-mono text-xs text-muted-foreground">{index + 1}</span>{item}
						</li>{/each}
				</ol>
			</div>
			<div class={panelClass}>
				<h3 class={panelTitleClass}>5 главных ошибок</h3>
				<ul class="space-y-2 text-sm">
					{#each structures.emailHero.mistakes as item}<li class="flex gap-3">
							<span class="text-red-700">×</span>{item}
						</li>{/each}
				</ul>
			</div>
		</div>
		<div class="mt-4 overflow-hidden rounded-lg border bg-white">
			<div class="border-b px-5 py-3"><h3 class="font-semibold">12 типов заголовков</h3></div>
			<div class="grid sm:grid-cols-2 xl:grid-cols-3">
				{#each structures.emailHero.headlines as headline (headline.n)}
					<div class="grid grid-cols-[28px_1fr] gap-2 border-b p-4 sm:border-r">
						<span class="font-mono text-xs text-muted-foreground"
							>{String(headline.n).padStart(2, '0')}</span
						><span
							><strong class="block text-sm">{headline.type}</strong><small
								class="leading-5 text-muted-foreground">{headline.desc}</small
							></span
						>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section aria-labelledby="structure-effectiveness">
		<p class={kickerClass}>04 · Эффективность</p>
		<div class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
			<h2 id="structure-effectiveness" class={titleClass}>Что работает по данным</h2>
			<span class="text-xs text-muted-foreground"
				>n = {structures.meta.sample}, медиана надёжнее</span
			>
		</div>
		<div class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class={metricClass}>
				<span>Средние просмотры</span><strong
					>{number.format(structures.keyMetrics.avgViews)}</strong
				>
			</div>
			<div class={metricClass}>
				<span>Медиана просмотров</span><strong
					>{number.format(structures.keyMetrics.medViews)}</strong
				>
			</div>
			<div class={metricClass}>
				<span>Средний ER</span><strong>{percent.format(structures.keyMetrics.avgEr)}%</strong>
			</div>
			<div class={metricClass}>
				<span>Медиана ER</span><strong>{percent.format(structures.keyMetrics.medEr)}%</strong>
			</div>
		</div>
		<div class="mb-4 {panelClass}">
			<h3 class={panelTitleClass}>{structures.cta.title}</h3>
			<div class="grid gap-3 md:grid-cols-2">
				{#each structures.cta.rows as row (row.label)}
					<div class="rounded-lg bg-muted/70 p-4">
						<strong>{row.label}</strong>
						<div class="mt-3 flex flex-wrap gap-5 font-mono text-sm">
							<span>n {row.n}</span><span>avg {number.format(row.avg)}</span><span
								>med {number.format(row.med)}</span
							><span>ER {percent.format(row.er)}%</span>
						</div>
					</div>
				{/each}
			</div>
			<p class="mt-4 text-xs leading-5 text-muted-foreground">{structures.cta.note}</p>
		</div>
		<div class="grid gap-4 xl:grid-cols-2">
			<BreakdownTable data={structures.byZachin} /><BreakdownTable
				data={structures.byBody}
			/><BreakdownTable data={structures.byLength} /><BreakdownTable
				data={structures.topByMedian}
			/>
		</div>
	</section>

	<section aria-labelledby="structure-gaps">
		<p class={kickerClass}>05 · Разрыв</p>
		<h2 id="structure-gaps" class="mb-5 {titleClass}">Что хочет гайд и что делает канал</h2>
		<div class="grid gap-5 xl:grid-cols-2">
			<div>
				<h3 class="mb-3 text-sm font-semibold">Чего не хватает в канале</h3>
				<div class="space-y-2">
					{#each structures.gaps as gap (gap.title)}<article class={panelClass}>
							<h4 class="font-semibold">{gap.title}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-foreground">{gap.body}</p>
						</article>{/each}
				</div>
			</div>
			<div>
				<h3 class="mb-3 text-sm font-semibold">Антипаттерны канала</h3>
				<div class="space-y-2">
					{#each structures.antipatterns as item (item.title)}<article class={panelClass}>
							<h4 class="font-semibold">{item.title}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
						</article>{/each}
				</div>
			</div>
		</div>
	</section>

	<section aria-labelledby="structure-templates">
		<p class={kickerClass}>06 · Производство</p>
		<h2 id="structure-templates" class="mb-5 {titleClass}">5 шаблонов для новых постов</h2>
		<div class="space-y-2">
			{#each structures.templates as template (template.n)}
				<details class={disclosureClass} open={template.n === 1}>
					<summary class={summaryClass}
						><span class="font-mono text-xs text-muted-foreground"
							>{String(template.n).padStart(2, '0')}</span
						><span class="min-w-0 flex-1"
							><strong class="block truncate font-medium">{template.title}</strong><small
								class="block truncate text-xs text-muted-foreground">{template.tag}</small
							></span
						></summary
					>
					<div class="grid gap-6 border-t px-5 py-5 xl:grid-cols-[0.8fr_1.2fr]">
						<div>
							<h3 class={panelTitleClass}>Структура</h3>
							<ol class="space-y-3 text-sm">
								{#each template.structure as step, index}<li
										class="grid grid-cols-[28px_1fr] gap-2"
									>
										<span class="font-mono text-xs text-muted-foreground"
											>{String(index + 1).padStart(2, '0')}</span
										><span>{step}</span>
									</li>{/each}
							</ol>
						</div>
						<div>
							<h3 class={panelTitleClass}>Пример</h3>
							<div class="rounded-lg bg-muted/60 p-5">
								<h4 class="font-semibold">{template.headline}</h4>
								{#each template.example.split('\n\n') as paragraph}<p
										class="mt-3 text-sm leading-6 whitespace-pre-line"
									>
										{paragraph}
									</p>{/each}
							</div>
						</div>
					</div>
				</details>
			{/each}
		</div>
	</section>

	<section aria-labelledby="structure-actions">
		<p class={kickerClass}>07 · Действия</p>
		<h2 id="structure-actions" class="mb-5 {titleClass}">Что делать ближайшие 30 постов</h2>
		<div class="grid gap-3 lg:grid-cols-3">
			{#each structures.recommendations as item (item.n)}
				<article class={panelClass}>
					<div class="flex items-center justify-between gap-3">
						<span class={priorityClass(item.prio)}>{priorityLabel(item.prio)}</span><span
							class="font-mono text-xs text-muted-foreground">{item.meta}</span
						>
					</div>
					<h3 class="mt-4 font-semibold">{item.title}</h3>
					<p class="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
				</article>
			{/each}
		</div>
	</section>
</div>
