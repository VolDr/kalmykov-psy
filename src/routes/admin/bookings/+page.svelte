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

	onMount(() => {
		const t = setInterval(() => {
			now = Date.now();
			// Reload page shortly after any lock expires so statuses update
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
	<h1 class="mb-6 text-2xl font-semibold">Бронирования ({data.bookings.length})</h1>

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
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.bookings as b}
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
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
