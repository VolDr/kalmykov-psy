<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		const timer = setInterval(() => {
			if (data.accessCheck.status === 'running') void invalidateAll();
		}, 2_000);
		return () => clearInterval(timer);
	});

	function displayName(c: {
		username: string | null;
		firstName: string | null;
		lastName: string | null;
	}) {
		const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
		if (full && c.username) return `${full} (@${c.username})`;
		if (full) return full;
		if (c.username) return `@${c.username}`;
		return 'Без имени';
	}

	function formatDate(iso: string | null) {
		if (!iso) return '—';
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/** Источник для людей: cp_<id> кнопки поста → подпись поста */
	function sourceLabel(key: string | null) {
		if (!key) return null;
		return data.postSources[key] ?? key;
	}

	/** Где человек сейчас относительно шлагбаума подписки */
	function gateState(c: { gateShownAt: string | null; gatePassedAt: string | null }) {
		if (c.gatePassedAt) return { label: 'подписался', class: 'text-emerald-700' };
		if (c.gateShownAt) return { label: 'не подписался', class: 'text-amber-700' };
		return { label: 'без шлагбаума', class: 'text-stone-400' };
	}

	function pageHref(page: number): `/${string}` {
		const params: string[] = [];
		if (data.archived) params.push('view=archive');
		if (data.search) params.push(`search=${encodeURIComponent(data.search)}`);
		if (page > 1) params.push(`page=${page}`);
		const query = params.join('&');
		return `/admin/bot/contacts${query ? `?${query}` : ''}`;
	}

	function contactsViewHref(archived: boolean): `/${string}` {
		return archived ? '/admin/bot/contacts?view=archive' : '/admin/bot/contacts';
	}

	function contactHref(id: number) {
		const href = resolve('/admin/bot/contacts/[id]', { id: String(id) });
		return data.archived ? `${href}?from=archive` : href;
	}

	function paginationItems(current: number, total: number): Array<number | string> {
		if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

		const pages = new Set([1, total, current - 1, current, current + 1]);
		const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
		const items: Array<number | string> = [];
		for (const page of sorted) {
			const previous = items.at(-1);
			if (typeof previous === 'number' && page - previous > 1) items.push(`gap-${page}`);
			items.push(page);
		}
		return items;
	}
</script>

<svelte:head>
	<title>Контакты бота</title>
</svelte:head>

<div class="p-6">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold">
				{data.archived ? 'Архив отписавшихся' : 'Контакты Telegram-бота'}
			</h1>
			<p class="mt-1 text-sm text-stone-500">
				{data.archived
					? 'Скрыты из общего списка и исключены из рассылок'
					: 'По последней активности, новые сверху'}
			</p>
		</div>
		<div class="flex flex-wrap items-center justify-end gap-2">
			<a
				href={resolve(contactsViewHref(!data.archived))}
				class="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
			>
				{data.archived ? 'К активным контактам' : `Архив: ${data.chainStats.blocked}`}
			</a>
		</div>
	</div>

	{#if data.accessCheck.status === 'running'}
		<div class="mb-4 text-sm" aria-live="polite">
			<p class="text-amber-700">
				Идёт автоматическая проверка отписок. Новые отписавшиеся будут перенесены в архив.
			</p>
		</div>
	{/if}

	<section
		class="mb-6 grid max-w-4xl grid-cols-2 overflow-hidden rounded-xl border border-stone-200 bg-white lg:grid-cols-4"
		aria-label="Состояние цепочек контактов"
	>
		<div class="min-w-0 border-r border-b border-stone-200 px-4 py-3 lg:border-b-0">
			<p class="text-xs font-medium text-stone-500">Активных контактов</p>
			<p class="mt-1 text-xl font-semibold text-stone-900 tabular-nums">{data.chainStats.total}</p>
		</div>
		<div class="min-w-0 border-b border-stone-200 px-4 py-3 lg:border-r lg:border-b-0">
			<p class="text-xs font-medium text-stone-500">С активной цепочкой</p>
			<p class="mt-1 text-xl font-semibold text-emerald-700 tabular-nums">
				{data.chainStats.active}
			</p>
		</div>
		<div class="min-w-0 border-r border-stone-200 bg-stone-50/70 px-4 py-3">
			<p class="text-xs font-medium text-stone-500">Без активной цепочки</p>
			<p class="mt-1 text-xl font-semibold text-stone-700 tabular-nums">{data.chainStats.idle}</p>
		</div>
		<div class="min-w-0 bg-red-50/40 px-4 py-3">
			<p class="text-xs font-medium text-stone-500">Отписались от бота</p>
			<p class="mt-1 text-xl font-semibold text-red-700 tabular-nums">{data.chainStats.blocked}</p>
		</div>
	</section>

	{#if data.funnel.length > 0}
		<section class="mb-6 rounded-xl border bg-white p-4">
			<h2 class="mb-3 text-sm font-semibold text-stone-600">Воронка бота за 30 дней</h2>
			<table class="text-sm">
				<thead>
					<tr class="text-left text-xs text-stone-400 uppercase">
						<th class="pr-6 pb-2 font-medium">Источник</th>
						<th class="pr-6 pb-2 text-right font-medium">Дошли до бота</th>
						<th class="pr-6 pb-2 text-right font-medium">Упёрлись в подписку</th>
						<th class="pr-6 pb-2 text-right font-medium">Подписались</th>
						<th class="pb-2 text-right font-medium">С ClientID</th>
					</tr>
				</thead>
				<tbody>
					{#each data.funnel as row (row.sourceKey ?? '—')}
						<tr class="border-t">
							<td class="py-2 pr-6 font-medium" title={row.sourceKey ?? undefined}>
								{sourceLabel(row.sourceKey) ?? 'без метки'}
							</td>
							<td class="py-2 pr-6 text-right tabular-nums">{row.started}</td>
							<td class="py-2 pr-6 text-right text-amber-700 tabular-nums">{row.gateShown}</td>
							<td class="py-2 pr-6 text-right text-emerald-700 tabular-nums">
								{row.gatePassed}
								{#if row.gateShown > 0}
									<span class="ml-1 text-xs font-normal text-stone-400">
										{Math.round((row.gatePassed / row.gateShown) * 100)}%
									</span>
								{/if}
							</td>
							<td class="py-2 text-right text-stone-500 tabular-nums">{row.withClientId}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-3 text-xs text-stone-400">
				«Упёрлись в подписку» минус «подписались» — те, кого шлагбаум отсёк. «С ClientID» — сколько
				контактов связаны с визитом на сайте и могут уехать в Директ офлайн-конверсией.
			</p>
		</section>
	{/if}

	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<form method="GET" class="flex w-full max-w-lg gap-2">
			{#if data.archived}<input type="hidden" name="view" value="archive" />{/if}
			<input
				type="search"
				name="search"
				value={data.search}
				placeholder="Поиск по имени или username"
				class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
			/>
			<button
				type="submit"
				class="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
			>
				Найти
			</button>
		</form>
		{#if data.pagination.total > 0}
			<p class="text-sm text-stone-500 tabular-nums">
				{data.pagination.from}–{data.pagination.to} из {data.pagination.total}
			</p>
		{/if}
	</div>

	{#if data.contacts.length === 0}
		<p class="text-sm text-stone-400">
			{data.archived
				? 'В архиве нет отписавшихся контактов.'
				: 'Контактов пока нет — они появятся после первого сообщения боту.'}
		</p>
	{:else}
		<div class="overflow-x-auto rounded-xl border border-stone-200 bg-white">
			<table class="w-full min-w-[1080px] text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs text-stone-500 uppercase">
					<tr>
						<th class="px-4 py-2 font-medium">Контакт</th>
						<th class="px-4 py-2 font-medium">Источник</th>
						<th class="px-4 py-2 font-medium">Активная цепочка</th>
						<th class="px-4 py-2 font-medium">Подписка</th>
						<th class="px-4 py-2 font-medium">id для /go/</th>
						<th class="px-4 py-2 font-medium">Этап</th>
						<th class="px-4 py-2 font-medium">Теги</th>
						<th class="px-4 py-2 font-medium">Последняя активность</th>
					</tr>
				</thead>
				<tbody>
					{#each data.contacts as contact (contact.id)}
						{@const gate = gateState(contact)}
						<tr class="group border-b last:border-0 focus-within:bg-stone-50 hover:bg-stone-50">
							<td class="p-0 font-medium text-stone-900">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}>
									{displayName(contact)}
									{#if contact.botBlocked}
										<span class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
											заблокировал бота
										</span>
									{/if}
								</a>
							</td>
							<td class="p-0 text-stone-600" title={contact.sourceKey ?? undefined}>
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}>
									{sourceLabel(contact.sourceKey) ?? '—'}
								</a>
							</td>
							<td class="p-0">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}>
									{#if contact.hasActiveChain}
										<span
											class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Есть
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-stone-400"></span>Нет
										</span>
									{/if}
								</a>
							</td>
							<td class="p-0 {gate.class}">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}
									>{gate.label}</a
								>
							</td>
							<td class="p-0 font-mono text-xs text-stone-500">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}>
									{contact.publicId}
									{#if contact.metrikaClientId}
										<span class="ml-1 text-emerald-600" title="ClientID Метрики привязан">●</span>
									{/if}
								</a>
							</td>
							<td class="p-0 text-stone-600">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}
									>{contact.stage}</a
								>
							</td>
							<td class="p-0 text-stone-600">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}>
									{contact.tags.length ? contact.tags.join(', ') : '—'}
								</a>
							</td>
							<td class="p-0 whitespace-nowrap text-stone-500">
								<a class="block px-4 py-3 focus:outline-none" href={contactHref(contact.id)}
									>{formatDate(contact.lastInteractionAt)}</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.pagination.totalPages > 1}
			<nav
				class="mt-5 flex flex-wrap items-center justify-between gap-3"
				aria-label="Страницы контактов"
			>
				<p class="text-sm text-stone-500 tabular-nums">
					Страница {data.pagination.page} из {data.pagination.totalPages}
				</p>
				<div class="flex items-center gap-1">
					{#if data.pagination.page > 1}
						<a
							class="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50"
							href={resolve(pageHref(data.pagination.page - 1))}>Назад</a
						>
					{/if}
					{#each paginationItems(data.pagination.page, data.pagination.totalPages) as item (item)}
						{#if typeof item === 'number'}
							<a
								href={resolve(pageHref(item))}
								aria-current={item === data.pagination.page ? 'page' : undefined}
								class="min-w-10 rounded-lg px-3 py-2 text-center text-sm {item ===
								data.pagination.page
									? 'bg-primary font-medium text-primary-foreground'
									: 'border border-stone-300 bg-white hover:bg-stone-50'}">{item}</a
							>
						{:else}
							<span class="px-1 text-stone-400" aria-hidden="true">…</span>
						{/if}
					{/each}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							class="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50"
							href={resolve(pageHref(data.pagination.page + 1))}>Дальше</a
						>
					{/if}
				</div>
			</nav>
		{/if}
	{/if}
</div>
