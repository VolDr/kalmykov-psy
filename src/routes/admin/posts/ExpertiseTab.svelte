<script lang="ts">
	import type { ExpertiseDataset, ExpertiseThesis } from './types';

	let { expertise }: { expertise: ExpertiseDataset } = $props();
	let query = $state('');
	let status = $state<'all' | ExpertiseThesis['status']>('all');
	const kickerClass = 'mb-1 text-xs font-medium uppercase tracking-wider text-gray-500';
	const titleClass = 'text-xl font-semibold';
	const metricClass =
		'flex min-h-24 flex-col justify-between rounded-lg border bg-white p-4 [&>span]:text-xs [&>span]:text-gray-500 [&>strong]:font-mono [&>strong]:text-2xl [&>strong]:font-semibold [&_small]:ml-2 [&_small]:text-xs [&_small]:font-normal [&_small]:text-gray-400';
	const panelClass = 'rounded-lg border bg-white p-5';
	const disclosureClass = 'overflow-hidden rounded-lg border bg-white';
	const summaryClass = 'flex min-h-16 cursor-pointer items-center gap-4 px-5 py-3 hover:bg-gray-50';

	const filteredSections = $derived.by(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase('ru');
		return expertise.sections
			.map((section) => ({
				...section,
				subsections: section.subsections
					.map((subsection) => ({
						...subsection,
						theses: subsection.theses.filter(
							(thesis) =>
								(status === 'all' || thesis.status === status) &&
								(!normalizedQuery ||
									thesis.node.toLocaleLowerCase('ru').includes(normalizedQuery) ||
									thesis.tg_description.toLocaleLowerCase('ru').includes(normalizedQuery) ||
									thesis.insta_description.toLocaleLowerCase('ru').includes(normalizedQuery))
						)
					}))
					.filter((subsection) => subsection.theses.length > 0)
			}))
			.filter((section) => section.subsections.length > 0);
	});

	const visibleCount = $derived(
		filteredSections.reduce(
			(total, section) =>
				total +
				section.subsections.reduce(
					(subtotal, subsection) => subtotal + subsection.theses.length,
					0
				),
			0
		)
	);

	function statusLabel(value: ExpertiseThesis['status']) {
		return value === '✅' ? 'Закрыто' : value === '⚠️' ? 'Частично' : 'Не затронуто';
	}

	function cleanConclusion(value: string) {
		return value.replaceAll('**', '');
	}

	function statusClass(value: ExpertiseThesis['status']) {
		const base =
			'inline-flex whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide';
		if (value === '✅') return `${base} bg-green-100 text-green-800`;
		if (value === '⚠️') return `${base} bg-amber-100 text-amber-800`;
		return `${base} bg-red-100 text-red-800`;
	}
</script>

<div class="space-y-12">
	<section aria-labelledby="expertise-summary">
		<p class={kickerClass}>01 · Покрытие</p>
		<h2 id="expertise-summary" class="mb-5 {titleClass}">Карта экспертизы</h2>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class={metricClass}>
				<span>Всего тезисов</span><strong>{expertise.summary.total}</strong>
			</div>
			<div class={metricClass}>
				<span>Закрыто</span><strong class="text-emerald-700"
					>{expertise.summary.closed}<small
						>{Math.round((expertise.summary.closed / expertise.summary.total) * 100)}%</small
					></strong
				>
			</div>
			<div class={metricClass}>
				<span>Раскрыто частично</span><strong class="text-amber-700"
					>{expertise.summary.weak}<small
						>{Math.round((expertise.summary.weak / expertise.summary.total) * 100)}%</small
					></strong
				>
			</div>
			<div class={metricClass}>
				<span>Не затронуто</span><strong class="text-red-700"
					>{expertise.summary.empty}<small
						>{Math.round((expertise.summary.empty / expertise.summary.total) * 100)}%</small
					></strong
				>
			</div>
		</div>
	</section>

	<section aria-labelledby="expertise-tree">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class={kickerClass}>02 · Структура</p>
				<h2 id="expertise-tree" class={titleClass}>Дерево экспертизы</h2>
			</div>
			<p class="text-xs text-muted-foreground">
				Показано {visibleCount} из {expertise.summary.total}
			</p>
		</div>
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<label class="min-w-[260px] flex-1 md:max-w-md">
				<span class="sr-only">Поиск по тезисам</span>
				<input
					type="search"
					placeholder="Поиск по тезисам и идеям"
					class="h-10 w-full rounded-md border bg-white px-3 text-sm focus:border-primary"
					bind:value={query}
				/>
			</label>
			<div class="flex flex-wrap gap-1" aria-label="Фильтр статуса">
				{#each [{ value: 'all', label: 'Все' }, { value: '✅', label: 'Закрыто' }, { value: '⚠️', label: 'Частично' }, { value: '❌', label: 'Не затронуто' }] as option (option.value)}
					<button
						type="button"
						aria-pressed={status === option.value}
						class="min-h-10 rounded-md px-3 text-xs font-medium {status === option.value
							? 'bg-gray-100 text-gray-900'
							: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}"
						onclick={() => (status = option.value as typeof status)}>{option.label}</button
					>
				{/each}
			</div>
		</div>

		{#if filteredSections.length === 0}
			<div class="rounded-lg border bg-white p-10 text-center text-sm text-gray-500">
				По выбранным условиям тезисов нет.
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredSections as section, sectionIndex (section.title)}
					<details
						class={disclosureClass}
						open={sectionIndex === 0 || query.length > 0 || status !== 'all'}
					>
						<summary class={summaryClass}>
							<span class="font-mono text-xs text-muted-foreground"
								>{String(sectionIndex + 1).padStart(2, '0')}</span
							>
							<span class="min-w-0 flex-1"
								><strong class="block truncate text-sm font-semibold">{section.title}</strong><span
									class="mt-2 block h-1.5 max-w-xs rounded-full bg-muted"
									><span
										class="block h-full rounded-full bg-primary"
										style:width={`${((section.closed + section.weak) / section.total) * 100}%`}
									></span></span
								></span
							>
							<span class="hidden gap-4 font-mono text-xs sm:flex"
								><span class="text-emerald-700">✅ {section.closed}</span><span
									class="text-amber-700">⚠️ {section.weak}</span
								><span class="text-red-700">❌ {section.empty}</span></span
							>
						</summary>
						<div class="border-t">
							{#each section.subsections as subsection (subsection.title)}
								<div class="border-b last:border-b-0">
									<h3 class="bg-muted/45 px-5 py-2.5 text-xs font-semibold tracking-wide uppercase">
										{subsection.title}
									</h3>
									<div class="overflow-x-auto">
										<table class="w-full min-w-[820px] text-sm">
											<thead class="text-left text-xs text-muted-foreground"
												><tr
													><th class="px-5 py-2 font-medium">Тезис</th><th
														class="px-3 py-2 font-medium">Статус</th
													><th class="px-3 py-2 font-medium">Лучший пост</th><th
														class="px-3 py-2 text-right font-medium">Просмотры</th
													><th class="px-5 py-2 text-right font-medium">ER</th></tr
												></thead
											>
											<tbody class="divide-y">
												{#each subsection.theses as thesis (thesis.node)}
													<tr
														><td class="px-5 py-3">{thesis.node}</td><td class="px-3 py-3"
															><span class={statusClass(thesis.status)}
																>{thesis.status} {statusLabel(thesis.status)}</span
															></td
														><td class="px-3 py-3"
															>{#if thesis.best_post_id}<a
																	class="text-primary hover:underline"
																	href="https://t.me/kalmykov_psy/{thesis.best_post_id}"
																	target="_blank"
																	rel="noopener noreferrer">#{thesis.best_post_id} ↗</a
																>{:else}<span class="text-muted-foreground">—</span>{/if}</td
														><td class="px-3 py-3 text-right font-mono">{thesis.views ?? '—'}</td
														><td class="px-5 py-3 text-right font-mono"
															>{thesis.er == null ? '—' : `${thesis.er.toFixed(1)}%`}</td
														></tr
													>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							{/each}
						</div>
					</details>
				{/each}
			</div>
		{/if}
	</section>

	<section aria-labelledby="expertise-plan">
		<p class={kickerClass}>03 · Контент-план</p>
		<h2 id="expertise-plan" class="mb-5 {titleClass}">Идеи для незакрытых тезисов</h2>
		<div class="overflow-x-auto rounded-lg border bg-white">
			<table class="w-full min-w-[1180px] text-sm">
				<thead class="border-b bg-gray-50 text-left text-xs text-gray-500"
					><tr
						><th class="px-4 py-3 font-medium">Раздел</th><th class="px-4 py-3 font-medium"
							>Тезис</th
						><th class="px-4 py-3 font-medium">Статус</th><th class="px-4 py-3 font-medium"
							>Telegram</th
						><th class="px-4 py-3 font-medium">Instagram</th><th class="px-4 py-3 font-medium"
							>Описание</th
						></tr
					></thead
				>
				<tbody class="divide-y">
					{#each filteredSections as section (section.title)}
						{#each section.subsections as subsection (subsection.title)}
							{#each subsection.theses.filter((thesis) => thesis.status !== '✅') as thesis (thesis.node)}
								<tr class="align-top hover:bg-muted/35"
									><td class="max-w-48 px-4 py-3 text-xs text-muted-foreground"
										><strong class="block text-foreground">{section.title}</strong><span
											class="mt-1 block">{subsection.title}</span
										></td
									><td class="max-w-64 px-4 py-3 font-medium">{thesis.node}</td><td
										class="px-4 py-3"
										><span class={statusClass(thesis.status)}
											>{thesis.status} {statusLabel(thesis.status)}</span
										></td
									><td class="px-4 py-3">{thesis.tg_format || '—'}</td><td class="px-4 py-3"
										>{thesis.insta_format || '—'}</td
									><td class="max-w-xl px-4 py-3 leading-5 text-muted-foreground"
										>{thesis.tg_description || thesis.insta_description || '—'}</td
									></tr
								>
							{/each}
						{/each}
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="expertise-conclusions">
		<p class={kickerClass}>04 · Выводы</p>
		<h2 id="expertise-conclusions" class="mb-5 {titleClass}">Приоритеты контент-плана</h2>
		<div class="grid gap-5 xl:grid-cols-2">
			<div class={panelClass}>
				<h3 class="mb-4 text-sm font-semibold">Крупнейшие пробелы</h3>
				<ol class="space-y-3">
					{#each expertise.top_sections_gaps as item, index}<li
							class="grid grid-cols-[28px_1fr] gap-3 text-sm"
						>
							<span class="font-mono text-xs text-muted-foreground"
								>{String(index + 1).padStart(2, '0')}</span
							><span>{cleanConclusion(item)}</span>
						</li>{/each}
				</ol>
			</div>
			<div class={panelClass}>
				<h3 class="mb-4 text-sm font-semibold">Темы с высоким потенциалом</h3>
				<ol class="space-y-3">
					{#each expertise.top_potential as item, index}<li
							class="grid grid-cols-[28px_1fr] gap-3 text-sm"
						>
							<span class="font-mono text-xs text-muted-foreground"
								>{String(index + 1).padStart(2, '0')}</span
							><span>{cleanConclusion(item)}</span>
						</li>{/each}
				</ol>
			</div>
		</div>
	</section>
</div>
