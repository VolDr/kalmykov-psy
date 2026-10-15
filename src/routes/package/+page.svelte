<script lang="ts">
	import PaymentLegalNotice from '$lib/components/PaymentLegalNotice.svelte';

	const PRICE = 14000;
	const PRICE_DISPLAY = PRICE.toLocaleString('ru-RU');

	let email = $state('');
	let loading = $state(false);
	let error = $state('');

	async function pay() {
		if (!email.trim()) return;
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/pay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), product: 'package' })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Ошибка создания платежа');

			const form = document.createElement('form');
			form.method = 'POST';
			form.action = data.url;
			for (const [key, val] of Object.entries(data.fields as Record<string, string>)) {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = key;
				input.value = val;
				form.appendChild(input);
			}
			document.body.appendChild(form);
			form.submit();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Пакет консультаций — {PRICE_DISPLAY} ₽</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-16">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="font-display text-3xl font-medium text-stone-800">Пакет консультаций</h1>
			<p class="mt-2 text-stone-500">Стоимость: {PRICE_DISPLAY} ₽</p>
		</div>

		<div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
			<div class="space-y-5">
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium text-stone-700">
						Email <span class="font-normal text-stone-400">(для чека)</span>
					</span>
					<input
						type="email"
						bind:value={email}
						placeholder="example@mail.ru"
						autocomplete="email"
						class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
					/>
				</label>

				{#if error}
					<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
				{/if}

				<button
					onclick={pay}
					disabled={loading || !email.trim()}
					class="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? 'Перенаправление...' : `Оплатить ${PRICE_DISPLAY} ₽`}
				</button>
			</div>

			<div class="mt-6">
				<PaymentLegalNotice />
			</div>
		</div>
	</div>
</div>
