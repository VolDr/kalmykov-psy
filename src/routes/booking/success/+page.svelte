<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	let status = $state(data.bookingStatus);
	let polling = $state(data.bookingStatus === 'pending_payment');

	function fireAnalytics() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ym = (window as any).ym;
		if (typeof ym === 'function') ym(105424317, 'reachGoal', 'booking_payment_success');
	}

	onMount(() => {
		if (status === 'confirmed' || status === 'paid') {
			fireAnalytics();
			return;
		}
		if (status !== 'pending_payment' || !data.invId) return;

		let active = true;
		let nextPoll: ReturnType<typeof setTimeout>;

		const poll = async () => {
			if (!active) return;
			try {
				const res = await fetch(`/api/booking/status?invId=${data.invId}`);
				if (res.ok) {
					const body = await res.json();
					if (body.status !== 'pending_payment') {
						status = body.status;
						polling = false;
						active = false;
						if (body.status === 'confirmed' || body.status === 'paid') fireAnalytics();
						return; // done — no next poll scheduled
					}
				}
			} catch {
				// network hiccup — schedule retry
			}
			// Schedule the NEXT poll only after this one finished (no overlapping requests)
			if (active) nextPoll = setTimeout(poll, 2000);
		};

		// First poll after 2 s
		nextPoll = setTimeout(poll, 2000);

		// Safety stop after 30 s regardless
		const safety = setTimeout(() => {
			active = false;
			polling = false;
			clearTimeout(nextPoll);
		}, 30_000);

		return () => {
			active = false;
			clearTimeout(nextPoll);
			clearTimeout(safety);
		};
	});
</script>

<svelte:head>
	<title>
		{status === 'confirmed'
			? 'Запись подтверждена'
			: status === 'paid'
				? 'Оплата прошла успешно'
				: status === 'requires_refund'
					? 'Требуется возврат'
					: 'Проверка оплаты...'}
	</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-50 px-4">
	<div class="w-full max-w-md text-center">
		<div class="mb-6 flex justify-center">
			{#if status === 'confirmed' || status === 'paid'}
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			{:else if status === 'requires_refund'}
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
					<svg class="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
					</svg>
				</div>
			{:else}
				<!-- pending_payment or unknown — spinner -->
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
					<svg class="h-8 w-8 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				</div>
			{/if}
		</div>

		{#if status === 'confirmed' || status === 'paid'}
			<h1 class="font-display text-2xl font-medium text-stone-800">Оплата прошла успешно!</h1>
			<p class="mt-4 text-stone-600">
				Я свяжусь с вами для подтверждения деталей сессии или
				<a href="https://t.me/m/HK_tu_dOMDli" class="text-stone-800 underline underline-offset-2 hover:text-stone-600">напишите мне в Telegram</a>.
			</p>
		{:else if status === 'requires_refund'}
			<h1 class="font-display text-2xl font-medium text-stone-800">Оплата прошла, но слот занят</h1>
			{#if data.invId}
				<p class="mt-2 text-sm text-stone-400">Номер платежа: {data.invId}</p>
			{/if}
			<p class="mt-4 text-stone-600">
				К сожалению, пока вы оплачивали, это время заняли. Я свяжусь с вами для возврата средств
				или переноса на другое время.
			</p>
		{:else if polling}
			<h1 class="font-display text-2xl font-medium text-stone-800">Проверяем оплату…</h1>
			<p class="mt-4 text-stone-600">Подождите несколько секунд — подтверждаем платёж.</p>
		{:else}
			<!-- Timeout or unknown: payment went through on Robokassa side but webhook delayed -->
			<h1 class="font-display text-2xl font-medium text-stone-800">Оплата получена</h1>
			{#if data.invId}
				<p class="mt-2 text-sm text-stone-400">Номер платежа: {data.invId}</p>
			{/if}
			<p class="mt-4 text-stone-600">
				Подтверждение обрабатывается. Если запись не появится в течение нескольких минут — напишите
				мне, я всё проверю.
			</p>
		{/if}

		{#if status !== 'pending_payment' || !polling}
			<a
				href="/"
				class="mt-8 inline-block rounded-lg bg-stone-800 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
			>
				На главную
			</a>
		{/if}
	</div>
</div>
