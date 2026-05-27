<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	const MSK = 'Europe/Moscow';
	const PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 min — matches releaseExpiredPayments

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
		pending: 'Ожидает',
		paid: 'Оплачено',
		failed: 'Ошибка'
	};

	const STATUS_COLOR: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-700',
		paid: 'bg-green-100 text-green-700',
		failed: 'bg-red-100 text-red-600'
	};

	let now = $state(Date.now());

	onMount(() => {
		const t = setInterval(() => {
			now = Date.now();
			const anyJustExpired = data.payments.some(
				(p) => p.status === 'pending' &&
					expiresAt(p.createdAt) < now &&
					expiresAt(p.createdAt) > now - 3000
			);
			if (anyJustExpired) setTimeout(() => location.reload(), 5000);
		}, 1000);
		return () => clearInterval(t);
	});

	function expiresAt(createdAt: string): number {
		return new Date(createdAt).getTime() + PAYMENT_TTL_MS;
	}

	function countdown(createdAt: string): string | null {
		const ms = expiresAt(createdAt) - now;
		if (ms <= 0) return 'истёк';
		const m = Math.floor(ms / 60000);
		const s = Math.floor((ms % 60000) / 1000);
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Платежи</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Платежи ({data.payments.length})</h1>

	<div class="overflow-x-auto rounded-xl border bg-white">
		{#if data.payments.length === 0}
			<p class="px-4 py-8 text-center text-sm text-stone-400">Платежей пока нет</p>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
					<tr>
						<th class="px-4 py-3">Дата (МСК)</th>
						<th class="px-4 py-3">Описание</th>
						<th class="px-4 py-3">Сумма</th>
						<th class="px-4 py-3">Email</th>
						<th class="px-4 py-3">Статус</th>
						<th class="px-4 py-3">№</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.payments as p}
						<tr class="hover:bg-stone-50">
							<td class="whitespace-nowrap px-4 py-3 text-stone-600">{fmt(p.createdAt)}</td>
							<td class="px-4 py-3 text-stone-700">{p.description}</td>
							<td class="whitespace-nowrap px-4 py-3 font-medium text-stone-800">
								{Number(p.outSum).toLocaleString('ru-RU')} ₽
							</td>
							<td class="px-4 py-3 text-stone-500">{p.email ?? '—'}</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_COLOR[p.status] ?? ''}">
									{STATUS_LABEL[p.status] ?? p.status}
								</span>
								{#if p.status === 'pending'}
									{@const t = countdown(p.createdAt)}
									<span class="ml-1.5 text-xs tabular-nums {t === 'истёк' ? 'text-red-400' : 'text-yellow-600'}">
										{t}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-stone-400">{p.id}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
