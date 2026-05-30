<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	const MSK = 'Europe/Moscow';

	function fmt(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: MSK,
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const STATUS_LABEL: Record<string, string> = {
		pending_payment: 'Ожидает оплаты',
		confirmed: 'Подтверждено',
		cancelled: 'Отменено',
		requires_refund: 'Нужен возврат'
	};

	const STATUS_COLOR: Record<string, string> = {
		pending_payment: 'bg-yellow-100 text-yellow-700',
		confirmed: 'bg-green-100 text-green-700',
		cancelled: 'bg-stone-100 text-stone-500',
		requires_refund: 'bg-red-100 text-red-600'
	};

	let now = $state(Date.now());
	let hideCancelled = $state(true);

	function toggleHideCancelled() {
		hideCancelled = !hideCancelled;
		localStorage.setItem('admin_hideCancelled', String(hideCancelled));
	}

	onMount(() => {
		const saved = localStorage.getItem('admin_hideCancelled');
		if (saved !== null) hideCancelled = saved === 'true';

		const t = setInterval(() => {
			now = Date.now();
			const anyJustExpired = data.bookings.some(
				(b) => b.status === 'pending_payment' && b.lockedUntil &&
					new Date(b.lockedUntil).getTime() < now &&
					new Date(b.lockedUntil).getTime() > now - 3000
			);
			if (anyJustExpired) setTimeout(() => location.reload(), 5000);
		}, 1000);
		return () => clearInterval(t);
	});

	function countdown(lockedUntil: string | null): string | null {
		if (!lockedUntil) return null;
		const ms = new Date(lockedUntil).getTime() - now;
		if (ms <= 0) return 'истёк';
		const m = Math.floor(ms / 60000);
		const s = Math.floor((ms % 60000) / 1000);
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Бронирования</title>
</svelte:head>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Бронирования ({data.bookings.length})</h1>
		<button
			type="button"
			onclick={toggleHideCancelled}
			class="rounded-lg border px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-50"
		>
			{hideCancelled ? 'Показать отменённые' : 'Скрыть отменённые'}
		</button>
	</div>

	<form
		method="POST"
		action="?/create"
		class="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
	>
		<div class="flex flex-col gap-1">
			<label for="bookedAt" class="text-xs font-medium text-stone-500">Дата и время</label>
			<input
				id="bookedAt"
				name="bookedAt"
				type="datetime-local"
				required
				class="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label for="telegram" class="text-xs font-medium text-stone-500">Telegram</label>
			<input
				id="telegram"
				name="telegram"
				type="text"
				placeholder="@username"
				required
				class="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label for="email" class="text-xs font-medium text-stone-500">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				placeholder="client@example.com"
				required
				class="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
			/>
		</div>
		<button
			type="submit"
			class="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
		>Добавить</button>
	</form>

	<div class="overflow-x-auto rounded-xl border bg-white">
		{#if data.bookings.length === 0}
			<p class="px-4 py-8 text-center text-sm text-stone-400">Бронирований пока нет</p>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
					<tr>
						<th class="px-4 py-3">Дата записи (МСК)</th>
						<th class="px-4 py-3">Telegram</th>
						<th class="px-4 py-3">Email</th>
						<th class="px-4 py-3">Статус</th>
						<th class="px-4 py-3">Платёж №</th>
					<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.bookings.filter(b => !hideCancelled || b.status !== 'cancelled') as b}
						<tr class="hover:bg-stone-50">
							<td class="whitespace-nowrap px-4 py-3 font-medium text-stone-800">
								{fmt(b.bookedAt)}
							</td>
							<td class="px-4 py-3 text-stone-700">
								{#if b.clientName}
									<a
										href="https://t.me/{b.clientName.replace(/^@/, '')}"
										target="_blank"
										rel="noopener"
										class="hover:underline"
									>{b.clientName}</a>
								{:else}
									<span class="text-stone-400">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-stone-600">{b.email || '—'}</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_COLOR[b.status] ?? ''}">
									{STATUS_LABEL[b.status] ?? b.status}
								</span>
								{#if b.status === 'pending_payment' && b.lockedUntil}
									{@const t = countdown(b.lockedUntil)}
									<span class="ml-1.5 text-xs tabular-nums {t === 'истёк' ? 'text-red-400' : 'text-yellow-600'}">
										{t}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-stone-400">{b.paymentId ?? '—'}</td>
							<td class="px-4 py-3">
								{#if b.status !== 'cancelled'}
									<form method="POST" action="?/cancel">
										<input type="hidden" name="id" value={b.id} />
										<button
											type="submit"
											class="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
										>Отменить</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
