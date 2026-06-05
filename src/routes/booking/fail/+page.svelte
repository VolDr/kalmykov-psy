<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/booking/fail/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн экрана неуспешной оплаты. Центрированный вид в тёплой теме.
  ════════════════════════════════════════════════════════════════
-->
<svelte:head>
	<title>Оплата не прошла | Андрей Калмыков</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-20">
	<div class="w-full max-w-md text-center">
		<div class="mb-6 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ecdc]">
				<svg class="h-8 w-8 text-foreground/50" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>

		<h1 class="font-caveat text-[36px] font-bold tracking-[0.5px] text-navy">Оплата не прошла</h1>
		<p class="mt-4 text-[16px] leading-relaxed text-foreground/70">
			Время записи освободилось — попробуйте выбрать снова.
		</p>

		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a href="/booking" class="inline-flex items-center justify-center rounded-[12px] bg-primary px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(233,184,78,0.3)] transition hover:brightness-[0.97] active:scale-[0.99]">
				Попробовать снова
			</a>
			<a href="/" class="inline-flex items-center justify-center rounded-[12px] border border-[#e0d4ba] bg-white px-6 py-3 text-[15px] font-bold text-navy transition hover:border-primary hover:bg-primary/[0.06]">
				На главную
			</a>
		</div>
	</div>
</div>
