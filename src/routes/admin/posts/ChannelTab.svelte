<script lang="ts">
	import type { AnalyticsPost, ChannelDataset } from './types';

	let { channel, posts }: { channel: ChannelDataset; posts: AnalyticsPost[] } = $props();

	type SortKey =
		| 'telegramMessageId'
		| 'publishedAt'
		| 'theme'
		| 'format'
		| 'views'
		| 'engagementRate'
		| 'score'
		| 'tier';

	let query = $state('');
	let activeTheme = $state<string | null>(null);
	let sortKey = $state<SortKey>('score');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let limit = $state(50);

	const number = new Intl.NumberFormat('ru-RU');
	const percent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

	const themeStats = $derived.by(() => {
		return Object.keys(channel.themeHues)
			.map((theme) => {
				const rows = posts.filter((post) => post.theme === theme);
				return {
					theme,
					count: rows.length,
					avgViews: rows.length
						? Math.round(rows.reduce((sum, post) => sum + post.views, 0) / rows.length)
						: 0,
					avgEr: rows.length
						? rows.reduce((sum, post) => sum + post.engagementRate, 0) / rows.length
						: 0
				};
			})
			.sort((a, b) => b.avgViews - a.avgViews);
	});

	const formatStats = $derived.by(() => {
		return Object.entries(channel.formatNames)
			.map(([format, label]) => {
				const rows = posts.filter((post) => post.format === format);
				return {
					format,
					label,
					count: rows.length,
					avgViews: rows.length
						? Math.round(rows.reduce((sum, post) => sum + post.views, 0) / rows.length)
						: 0
				};
			})
			.filter((item) => item.count > 0)
			.sort((a, b) => b.avgViews - a.avgViews);
	});

	const filteredPosts = $derived.by(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase('ru');
		return [...posts]
			.filter((post) => !activeTheme || post.theme === activeTheme)
			.filter(
				(post) =>
					!normalizedQuery ||
					post.text.toLocaleLowerCase('ru').includes(normalizedQuery) ||
					post.theme.toLocaleLowerCase('ru').includes(normalizedQuery) ||
					String(post.telegramMessageId).includes(normalizedQuery)
			)
			.sort((a, b) => {
				const left = a[sortKey];
				const right = b[sortKey];
				const comparison =
					typeof left === 'number' && typeof right === 'number'
						? left - right
						: String(left).localeCompare(String(right), 'ru');
				return sortDirection === 'desc' ? -comparison : comparison;
			});
	});

	const visiblePosts = $derived(filteredPosts.slice(0, limit));
	const heatmapMax = $derived(Math.max(1, ...Object.values(channel.heatmap).flat()));
	const maxFormatViews = $derived(Math.max(1, ...formatStats.map((item) => item.avgViews)));
	const maxMonthViews = $derived(Math.max(1, ...channel.months.map((month) => month.views)));
	const kickerClass = 'mb-1 text-xs font-medium uppercase tracking-wider text-gray-500';
	const titleClass = 'text-xl font-semibold';
	const metricClass =
		'flex min-h-24 flex-col justify-between rounded-lg border bg-white p-4 [&>span]:text-xs [&>span]:text-gray-500 [&>strong]:font-mono [&>strong]:text-2xl [&>strong]:font-semibold';
	const panelClass = 'rounded-lg border bg-white p-5';
	const secondaryButtonClass =
		'min-h-10 rounded-md border bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50';

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
		else {
			sortKey = key;
			sortDirection = 'desc';
		}
		limit = 50;
	}

	function sortMark(key: SortKey) {
		if (sortKey !== key) return '';
		return sortDirection === 'desc' ? '↓' : '↑';
	}

	function selectTheme(theme: string | null) {
		activeTheme = activeTheme === theme ? null : theme;
		limit = 50;
	}

	function priorityClass(priority: 'high' | 'med' | 'low') {
		const base = 'inline-flex rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide';
		if (priority === 'high') return `${base} bg-red-100 text-red-800`;
		if (priority === 'med') return `${base} bg-amber-100 text-amber-800`;
		return `${base} bg-gray-100 text-gray-600`;
	}
</script>

<div class="space-y-12">
	<section aria-labelledby="channel-summary">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={kickerClass}>01 · Сводка</p>
				<h2 id="channel-summary" class={titleClass}>Канал в цифрах</h2>
			</div>
			<p class="text-xs text-muted-foreground">Сформировано {channel.meta.generated}</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
			<div class={metricClass}>
				<span>Постов</span><strong>{channel.summary.totalPosts}</strong>
			</div>
			<div class={metricClass}>
				<span>Средние просмотры</span><strong>{number.format(channel.summary.avgViews)}</strong>
			</div>
			<div class={metricClass}>
				<span>Средний ER</span><strong>{percent.format(channel.summary.avgEr)}%</strong>
			</div>
			<div class={metricClass}>
				<span>Лучший пост</span><strong>{number.format(channel.summary.topPostViews)}</strong>
			</div>
			<div class={metricClass}>
				<span>Динамика периода</span><strong class="text-red-700"
					>{percent.format(channel.summary.growth)}%</strong
				>
			</div>
		</div>
	</section>

	<section aria-labelledby="channel-themes">
		<p class={kickerClass}>02 · Темы</p>
		<h2 id="channel-themes" class="mb-5 {titleClass}">Что заходит лучше всего</h2>
		<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
			{#each themeStats as item (item.theme)}
				<button
					type="button"
					aria-pressed={activeTheme === item.theme}
					class="flex min-h-20 items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm hover:bg-gray-50 {activeTheme ===
					item.theme
						? 'border-primary bg-primary/10'
						: 'bg-white'}"
					onclick={() => selectTheme(item.theme)}
				>
					<span class="min-w-0 text-left">
						<strong class="block truncate text-sm font-medium">{item.theme}</strong>
						<span class="text-xs text-muted-foreground"
							>{item.count} постов · ER {percent.format(item.avgEr)}%</span
						>
					</span>
					<span class="shrink-0 text-right font-mono text-sm"
						>{number.format(item.avgViews)}<small class="block text-[10px] text-muted-foreground"
							>ср. просмотров</small
						></span
					>
				</button>
			{/each}
		</div>
	</section>

	<section aria-labelledby="channel-time">
		<p class={kickerClass}>03 · Время</p>
		<h2 id="channel-time" class="mb-5 {titleClass}">Когда публиковать</h2>
		<div class="overflow-x-auto rounded-lg border bg-white p-4">
			<div
				class="grid min-w-[760px] grid-cols-[44px_repeat(24,minmax(24px,1fr))] gap-1 text-center text-[10px]"
			>
				<span></span>
				{#each Array.from({ length: 24 }) as _, hour}
					<span class="py-1 text-muted-foreground">{hour}</span>
				{/each}
				{#each Object.entries(channel.heatmap) as [day, hours] (day)}
					<span class="flex items-center font-medium">{day}</span>
					{#each hours as value, hour (`${day}-${hour}`)}
						<div
							class="h-7 rounded-sm"
							style={`background: color-mix(in oklab, var(--primary) ${Math.max(3, Math.round((value / heatmapMax) * 100))}%, var(--muted))`}
							title={`${day}, ${hour}:00 · ${number.format(value)} ср. просмотров`}
						></div>
					{/each}
				{/each}
			</div>
		</div>
	</section>

	<section id="posts-table" aria-labelledby="channel-posts">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class={kickerClass}>04 · Публикации</p>
				<h2 id="channel-posts" class={titleClass}>Все посты</h2>
			</div>
			<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
				{#if activeTheme}
					<button
						type="button"
						class="inline-flex min-h-10 max-w-64 items-center gap-2 rounded-md bg-primary/10 px-3 text-left text-xs font-medium"
						onclick={() => selectTheme(null)}>{activeTheme}<span aria-hidden="true">×</span></button
					>
				{/if}
				<label class="min-w-[240px] flex-1 sm:flex-none">
					<span class="sr-only">Поиск по постам</span>
					<input
						type="search"
						placeholder="Текст, тема или номер поста"
						class="h-10 w-full rounded-md border bg-white px-3 text-sm focus:border-primary"
						bind:value={query}
						oninput={() => (limit = 50)}
					/>
				</label>
			</div>
		</div>
		<div class="overflow-x-auto rounded-lg border bg-white">
			<table class="w-full min-w-[1040px] text-sm">
				<thead class="border-b bg-gray-50 text-left text-xs text-gray-500">
					<tr>
						{#each [['telegramMessageId', '#'], ['publishedAt', 'Дата'], ['theme', 'Тема'], ['format', 'Формат'], ['views', 'Просмотры'], ['engagementRate', 'ER'], ['score', 'Score'], ['tier', 'Уровень']] as heading}
							<th class="px-3 py-3 font-medium whitespace-nowrap">
								<button
									type="button"
									class="hover:text-foreground"
									onclick={() => toggleSort(heading[0] as SortKey)}
								>
									{heading[1]} <span aria-hidden="true">{sortMark(heading[0] as SortKey)}</span>
								</button>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each visiblePosts as post (post.telegramMessageId)}
						<tr class="hover:bg-gray-50">
							<td class="px-3 py-3 font-mono"
								><a
									class="text-primary underline-offset-4 hover:underline"
									href="https://t.me/{channel.meta.handle}/{post.telegramMessageId}"
									target="_blank"
									rel="noopener noreferrer">{post.telegramMessageId}</a
								></td
							>
							<td class="px-3 py-3 whitespace-nowrap text-muted-foreground">{post.publishedAt}</td>
							<td class="max-w-[320px] px-3 py-3"
								><button
									type="button"
									class="text-left hover:text-primary"
									onclick={() => selectTheme(post.theme)}
									title={post.text}
									>{post.theme}<span class="mt-1 block truncate text-xs text-muted-foreground"
										>{post.text}</span
									></button
								></td
							>
							<td class="px-3 py-3">{channel.formatNames[post.format] ?? post.format}</td>
							<td class="px-3 py-3 text-right font-mono">{number.format(post.views)}</td>
							<td class="px-3 py-3 text-right font-mono">{percent.format(post.engagementRate)}%</td>
							<td class="px-3 py-3 text-right font-mono">{Math.round(post.score)}</td>
							<td class="px-3 py-3 text-xs whitespace-nowrap">{post.tier}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if visiblePosts.length === 0}
				<p class="p-8 text-center text-sm text-muted-foreground">
					По выбранным условиям постов нет.
				</p>
			{/if}
		</div>
		<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
			<span>Показано {visiblePosts.length} из {filteredPosts.length}</span>
			{#if visiblePosts.length < filteredPosts.length}
				<button type="button" class={secondaryButtonClass} onclick={() => (limit += 50)}
					>Показать ещё 50</button
				>
			{:else if limit > 50}
				<button type="button" class={secondaryButtonClass} onclick={() => (limit = 50)}
					>Свернуть</button
				>
			{/if}
		</div>
	</section>

	<section aria-labelledby="channel-formats">
		<p class={kickerClass}>05 · Форматы и динамика</p>
		<h2 id="channel-formats" class="mb-5 {titleClass}">Форматы и просмотры по месяцам</h2>
		<div class="grid gap-5 xl:grid-cols-2">
			<div class={panelClass}>
				<h3 class="mb-5 text-sm font-semibold">Средние просмотры по формату</h3>
				<div class="space-y-3">
					{#each formatStats as item (item.format)}
						<div class="text-sm">
							<div class="flex justify-between gap-4">
								<span>{item.label} <small class="text-muted-foreground">({item.count})</small></span
								><strong class="font-mono">{number.format(item.avgViews)}</strong>
							</div>
							<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full bg-primary"
									style:width={`${(item.avgViews / maxFormatViews) * 100}%`}
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class={panelClass}>
				<h3 class="mb-5 text-sm font-semibold">Средние просмотры по месяцам</h3>
				<div class="flex h-56 items-end gap-1 border-b pb-6">
					{#each channel.months as month (month.month)}
						<div
							class="group relative flex h-full flex-1 items-end"
							title={`${month.month}: ${number.format(month.views)}`}
						>
							<div
								class="w-full rounded-t bg-primary/65 transition-colors duration-200 group-hover:bg-primary"
								style:height={`${Math.max(3, (month.views / maxMonthViews) * 100)}%`}
							></div>
							<span
								class="absolute top-full mt-2 origin-left -rotate-45 text-[9px] whitespace-nowrap text-muted-foreground"
								>{month.month.slice(2)}</span
							>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section aria-labelledby="channel-recommendations">
		<p class={kickerClass}>06 · Рекомендации</p>
		<h2 id="channel-recommendations" class="mb-5 {titleClass}">Что делать дальше</h2>
		<div class="space-y-7">
			{#each channel.recommendations as group (group.group)}
				<div>
					<h3 class="mb-3 text-sm font-semibold">{group.group}</h3>
					<div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
						{#each group.items as item (item.title)}
							<article class={panelClass}>
								<span class={priorityClass(item.prio)}
									>{item.prio === 'high'
										? 'Важно'
										: item.prio === 'med'
											? 'Средне'
											: 'К сведению'}</span
								>
								<h4 class="mt-3 font-semibold">{item.title}</h4>
								<p class="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
								<p class="mt-4 text-xs text-muted-foreground">Основание: {item.basis}</p>
							</article>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
