<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/booking/success/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн экрана успешной оплаты (макет «Оплата прошла успешно»).
  · Логика polling статуса платежа сохранена полностью.
  · Состояние confirmed/paid — двухколоночный макет с иллюстрацией-вазой
    и сердечком; остальные состояния (ожидание/возврат/таймаут) —
    центрированный компактный вид.
  ════════════════════════════════════════════════════════════════
-->
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
						return;
					}
				}
			} catch {
				// network hiccup — schedule retry
			}
			if (active) nextPoll = setTimeout(poll, 2000);
		};

		nextPoll = setTimeout(poll, 2000);
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

	const isSuccess = $derived(status === 'confirmed' || status === 'paid');
	const bookedLabel = $derived(
		data.bookedAt
			? new Date(data.bookedAt).toLocaleString('ru-RU', {
					day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
				})
			: ''
	);
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

<div class="flex min-h-screen items-center bg-background px-4 py-20">
	{#if isSuccess}
		<!-- ═══ УСПЕХ: две колонки ═══ -->
		<div class="mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-[1fr_0.85fr] md:gap-14">
			<div>
				<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
					<svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
				</div>
				<h1 class="font-caveat text-[36px] leading-tight font-bold tracking-[0.5px] text-navy md:text-[44px]">
					Оплата прошла успешно
				</h1>
				{#if data.description}
					<p class="mt-3 text-[16px] font-semibold text-foreground/70">{data.description}</p>
				{/if}
				{#if bookedLabel}
					<p class="mt-2 text-[18px] font-bold text-navy">{bookedLabel}</p>
				{/if}
				<p class="mt-4 max-w-[440px] text-[16px] leading-relaxed text-foreground/70">
					Свяжусь с вами в течение дня для подтверждения деталей. Можно также
					<a href="https://t.me/m/LMOE2JTtMDcy" class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition hover:text-primary">написать мне в Telegram</a>.
				</p>
				<a href="/" class="mt-8 inline-flex items-center justify-center rounded-[12px] border border-[#e0d4ba] bg-white px-6 py-3 text-[15px] font-bold text-navy transition hover:border-primary hover:bg-primary/[0.06]">
					На главную
				</a>
			</div>

			<!-- ваза + сердечко -->
			<div class="hidden items-center justify-center md:flex" aria-hidden="true">
				<svg class="h-auto w-full max-w-[320px]" viewBox="0 0 380 320" fill="none">
					<circle cx="210" cy="170" r="100" fill="#F6E7CF" opacity="0.85" />
					<path d="M338 110 C342 100 356 100 358 112 C360 100 374 100 376 110 C378 122 360 134 357 136 C354 134 336 122 338 110 Z" fill="none" stroke="var(--color-primary)" stroke-width="2.4" stroke-linejoin="round" />
					<path d="M150 64 L150 90 M137 77 L163 77" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" />
					<path d="M188 150 C190 110 196 78 214 50" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
					<path d="M214 50 C224 38 240 32 256 34" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
					<path d="M200 96 C212 84 228 82 242 88" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
					<path d="M194 122 C182 116 170 118 160 128" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
					<path d="M256 34 C268 26 282 28 288 38 C278 44 264 44 256 34 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
					<path d="M242 88 C254 82 268 86 272 96 C261 100 248 97 242 88 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
					<path d="M160 128 C148 124 136 128 132 138 C143 142 154 138 160 128 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
					<path d="M214 50 C206 38 206 26 214 18 C222 26 222 40 214 50 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
					<path d="M174 152 C172 178 178 192 181 206 C166 232 158 252 163 280 C165 298 170 308 186 309 L206 309 C222 308 226 298 228 280 C233 252 224 232 210 206 C213 192 219 178 216 152" stroke="var(--color-navy)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
					<ellipse cx="195" cy="152" rx="21" ry="6" stroke="var(--color-navy)" stroke-width="2.2" fill="none" />
					<path d="M173 170 C185 175 205 175 217 170" stroke="var(--color-navy)" stroke-width="1.6" stroke-linecap="round" opacity="0.5" />
					<path d="M86 312 C150 320 240 314 318 318" stroke="var(--color-navy)" stroke-width="2" stroke-linecap="round" />
				</svg>
			</div>
		</div>
	{:else}
		<!-- ═══ остальные состояния: центрированно ═══ -->
		<div class="mx-auto w-full max-w-md text-center">
			<div class="mb-6 flex justify-center">
				{#if status === 'requires_refund'}
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ecdc]">
						<svg class="h-8 w-8 text-foreground/55" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
					</div>
				{:else}
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ecdc]">
						<svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
					</div>
				{/if}
			</div>

			{#if status === 'requires_refund'}
				<h1 class="font-caveat text-[34px] font-bold text-navy">Оплата прошла, но слот занят</h1>
				{#if data.invId}<p class="mt-2 text-[14px] text-foreground/45">Номер платежа: {data.invId}</p>{/if}
				<p class="mt-4 text-[16px] leading-relaxed text-foreground/70">К сожалению, пока вы оплачивали, это время заняли. Я свяжусь с вами для возврата средств или переноса на другое время.</p>
			{:else if polling}
				<h1 class="font-caveat text-[34px] font-bold text-navy">Проверяем оплату…</h1>
				<p class="mt-4 text-[16px] leading-relaxed text-foreground/70">Подождите несколько секунд — подтверждаем платёж.</p>
			{:else}
				<h1 class="font-caveat text-[34px] font-bold text-navy">Оплата получена</h1>
				{#if data.invId}<p class="mt-2 text-[14px] text-foreground/45">Номер платежа: {data.invId}</p>{/if}
				<p class="mt-4 text-[16px] leading-relaxed text-foreground/70">Подтверждение обрабатывается. Если запись не появится в течение нескольких минут — напишите мне, я всё проверю.</p>
			{/if}

			{#if status !== 'pending_payment' || !polling}
				<a href="/" class="mt-8 inline-flex items-center justify-center rounded-[12px] border border-[#e0d4ba] bg-white px-6 py-3 text-[15px] font-bold text-navy transition hover:border-primary hover:bg-primary/[0.06]">
					На главную
				</a>
			{/if}
		</div>
	{/if}
</div>
