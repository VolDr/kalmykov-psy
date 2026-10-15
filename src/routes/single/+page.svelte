<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/single/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн страницы оплаты разовой консультации (макет «Оплата
  консультации»). Логика без изменений: POST /api/pay (product:'single')
  → форма Робокассы. Тот же файл годится для /package — поменяйте
  PRICE = 14000 и product: 'package'.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { reachGoal } from '$lib/metrika';
	import PaymentLegalNotice from '$lib/components/PaymentLegalNotice.svelte';

	const PRICE = 4000;
	const PRICE_DISPLAY = PRICE.toLocaleString('ru-RU');

	let email = $state('');
	let loading = $state(false);
	let error = $state('');

	async function pay() {
		if (!email.trim()) return;
		loading = true;
		error = '';
		reachGoal('single_payment_initiated');
		try {
			const res = await fetch('/api/pay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), product: 'single' })
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
	<title>Оплата консультации — {PRICE_DISPLAY} ₽</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen items-center bg-background px-4 py-20">
	<div
		class="mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-[1fr_0.85fr] md:gap-14"
	>
		<!-- левая колонка: заголовок + карточка -->
		<div>
			<div class="mb-7">
				<h1
					class="flex items-center gap-3 font-caveat text-[34px] leading-none font-bold tracking-[0.5px] text-navy md:text-[42px]"
				>
					<svg
						class="h-7 w-7 shrink-0 md:h-9 md:w-9"
						viewBox="0 0 40 40"
						fill="none"
						aria-hidden="true"
						><path
							d="M20 3 C21 13 27 19 37 20 C27 21 21 27 20 37 C19 27 13 21 3 20 C13 19 19 13 20 3 Z"
							fill="var(--color-primary)"
						/></svg
					>
					Оплата консультации
				</h1>
				<p class="mt-2 pl-1 text-center text-[15px] text-foreground/55 lg:text-left">
					Стоимость: {PRICE_DISPLAY} ₽
				</p>
			</div>

			<div
				class="rounded-[20px] border border-[#ece3d1] bg-white p-7 shadow-[0_12px_44px_rgba(43,42,78,0.06)] lg:p-8"
			>
				<div class="space-y-5">
					<label class="block">
						<span class="mb-2 block text-[14px] font-semibold text-navy"
							>Email <span class="font-normal text-foreground/45">(для чека)</span></span
						>
						<input
							type="email"
							bind:value={email}
							placeholder="example@mail.ru"
							autocomplete="email"
							class="w-full rounded-[12px] border border-[#e7ddc7] bg-[#faf7f0] px-4 py-3 text-[15px] text-navy transition outline-none placeholder:text-foreground/35 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
						/>
					</label>

					{#if error}
						<p class="rounded-[12px] bg-red-50 px-4 py-3 text-[14px] text-red-600">{error}</p>
					{/if}

					<button
						onclick={pay}
						disabled={loading || !email.trim()}
						class="w-full rounded-[12px] bg-primary px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(233,184,78,0.3)] transition hover:brightness-[0.97] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
					>
						{loading ? 'Перенаправление…' : `Оплатить ${PRICE_DISPLAY} ₽`}
					</button>
				</div>
				<div class="mt-5">
					<PaymentLegalNotice />
				</div>
			</div>
		</div>

		<!-- правая колонка: иллюстрация-ваза -->
		<div class="hidden items-center justify-center md:flex" aria-hidden="true">
			<svg class="h-auto w-full max-w-[320px]" viewBox="0 0 380 320" fill="none">
				<circle cx="210" cy="170" r="100" fill="#F6E7CF" opacity="0.85" />
				<path
					d="M188 150 C190 110 196 78 214 50"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					stroke-linecap="round"
				/>
				<path
					d="M214 50 C224 38 240 32 256 34"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					stroke-linecap="round"
				/>
				<path
					d="M200 96 C212 84 228 82 242 88"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					stroke-linecap="round"
				/>
				<path
					d="M194 122 C182 116 170 118 160 128"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					stroke-linecap="round"
				/>
				<path
					d="M256 34 C268 26 282 28 288 38 C278 44 264 44 256 34 Z"
					stroke="var(--color-navy)"
					stroke-width="2"
					fill="none"
					stroke-linejoin="round"
				/>
				<path
					d="M242 88 C254 82 268 86 272 96 C261 100 248 97 242 88 Z"
					stroke="var(--color-navy)"
					stroke-width="2"
					fill="none"
					stroke-linejoin="round"
				/>
				<path
					d="M160 128 C148 124 136 128 132 138 C143 142 154 138 160 128 Z"
					stroke="var(--color-navy)"
					stroke-width="2"
					fill="none"
					stroke-linejoin="round"
				/>
				<path
					d="M214 50 C206 38 206 26 214 18 C222 26 222 40 214 50 Z"
					stroke="var(--color-navy)"
					stroke-width="2"
					fill="none"
					stroke-linejoin="round"
				/>
				<path
					d="M174 152 C172 178 178 192 181 206 C166 232 158 252 163 280 C165 298 170 308 186 309 L206 309 C222 308 226 298 228 280 C233 252 224 232 210 206 C213 192 219 178 216 152"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<ellipse
					cx="195"
					cy="152"
					rx="21"
					ry="6"
					stroke="var(--color-navy)"
					stroke-width="2.2"
					fill="none"
				/>
				<path
					d="M173 170 C185 175 205 175 217 170"
					stroke="var(--color-navy)"
					stroke-width="1.6"
					stroke-linecap="round"
					opacity="0.5"
				/>
				<path
					d="M86 312 C150 320 240 314 318 318"
					stroke="var(--color-navy)"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</div>
	</div>
</div>
