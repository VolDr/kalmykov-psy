<!--
  ════════════════════════════════════════════════════════════════
  ПОРТ: полная замена  src/routes/booking/+page.svelte
  ────────────────────────────────────────────────────────────────
  Редизайн страницы записи (макет «Запись на консультацию»).
  · Та же логика и контракт данных, что и в оригинале:
      data.availabilities / data.price / data.type,
      POST /api/booking → форма Робокассы (form.submit),
      аналитика trackGoal(...), вычисление МСК-времени.
  · Используется штатный Bits-UI <Calendar> (как в оригинале): locale="ru",
      isDateUnavailable / onValueChange. Он сам красит выбранный день в
      --primary (золотой), подсвечивает «сегодня» и зачёркивает недоступные.
      Контракт логики тот же: availableDatesSet / slotsByLocalDate.
  · Токены: font-caveat / text-navy / bg-primary — из app.css.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import type { DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import type { SlotInfo } from '$lib/server/booking.server';

	let { data } = $props();

	type Step = 1 | 2;
	type Slot = { startAt: string; availabilityId: number; status: SlotInfo['status'] };

	const isAcquaintance = $derived(data.type === 'acquaintance');

	let step = $state<Step>(1);
	let bookingSuccess = $state(false);
	let selectedDate = $state('');
	let selectedSlot = $state<Slot | null>(null);
	let telegram = $state('');
	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let formStarted = $state(false);

	function handleFormFocus() {
		if (formStarted) return;
		formStarted = true;
		trackGoal('booking_form_started');
	}

	const MSK_TZ = 'Europe/Moscow';

	function localDateStr(iso: string): string {
		return new Date(iso).toLocaleDateString('sv');
	}

	const slotsByLocalDate = $derived.by(() => {
		const map = new Map<string, Slot[]>();
		for (const av of data.availabilities) {
			for (const slot of av.slots) {
				const d = localDateStr(slot.startAt);
				if (!map.has(d)) map.set(d, []);
				map.get(d)!.push({ ...slot, availabilityId: av.id });
			}
		}
		return map;
	});

	const availableDatesSet = $derived(new Set(slotsByLocalDate.keys()));
	const slotsForSelectedDate = $derived(
		(slotsByLocalDate.get(selectedDate) ?? []).filter((s) => s.status === 'available')
	);

	function isDateUnavailable(date: DateValue): boolean {
		const s = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		return !availableDatesSet.has(s);
	}

	function trackGoal(goal: string) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ym = (window as any).ym;
		if (typeof ym === 'function') ym(105424317, 'reachGoal', goal);
	}

	function handleDateChange(date: DateValue | undefined) {
		if (!date) return;
		const s = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		if (!availableDatesSet.has(s)) return;
		selectedDate = s;
		selectedSlot = null;
		trackGoal('booking_date_selected');
	}

	function handleSlotSelect(slot: Slot) {
		if (slot.status !== 'available') return;
		selectedSlot = slot;
		trackGoal('booking_hour_selected');
	}

	function goToPayment() {
		if (!selectedSlot) return;
		step = 2;
		trackGoal('booking_step2_reached');
	}

	const step1Clickable = $derived(step === 2);
	const step2Clickable = $derived(step === 1 && !!selectedSlot);

	function localTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	}
	function mskTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK_TZ });
	}
	function localDateLabel(iso: string): string {
		return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	const showMsk = $derived.by(() => {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone !== MSK_TZ;
		} catch {
			return false;
		}
	});

	async function handlePay() {
		if (!selectedSlot || !telegram.trim() || (!isAcquaintance && !email.trim())) return;
		loading = true;
		error = '';
		trackGoal(isAcquaintance ? 'acquaintance_booking_initiated' : 'booking_payment_initiated');
		const endpoint = isAcquaintance ? '/api/booking/acquaintance' : '/api/booking';
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					availabilityId: selectedSlot.availabilityId,
					bookedAt: selectedSlot.startAt,
					telegram: telegram.trim(),
					email: email.trim(),
					...(isAcquaintance ? {} : { type: data.type }),
					...(data.sbClientId ? { sbClientId: data.sbClientId } : {})
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Ошибка');

			if (isAcquaintance) {
				bookingSuccess = true;
				loading = false;
				trackGoal('acquaintance_booking_confirmed');
				return;
			}

			const form = document.createElement('form');
			form.method = 'POST';
			form.action = json.url;
			for (const [key, val] of Object.entries(json.fields as Record<string, string>)) {
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
	<title>{isAcquaintance ? 'Встреча-знакомство' : 'Запись на консультацию'} | Андрей Калмыков</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-20 lg:py-28">
	<div class="mx-auto max-w-3xl">
		<!-- заголовок -->
		<div class="mb-7 text-center relative">
			<img src="/star_1.webp" class="pointer-events-none absolute left-[24px] top-[29px] lg:top-3 left-1 lg:left-[301px] h-6 w-6" alt="" aria-hidden="true" />
			<h1 class="flex items-center justify-center gap-3 font-caveat text-[34px] leading-none font-bold tracking-[0.5px] text-navy md:text-[40px]">
				{isAcquaintance ? 'Встреча-знакомство' : 'Запись на консультацию'}
			</h1>
			{#if !isAcquaintance}
				<p class="mt-2 text-[15px] text-foreground/55">
					Стоимость: {Number(data.price).toLocaleString('ru-RU')} ₽
				</p>
			{:else}
				<p class="mt-2 text-[15px] text-foreground/55">Бесплатная ознакомительная встреча</p>
			{/if}
		</div>

		<!-- шаги (не показываем при успешной записи знакомства) -->
		{#if !bookingSuccess}
		<div class="mb-8 flex items-center justify-center gap-3 text-[15px]">
			<button
				type="button"
				onclick={() => { if (step1Clickable) step = 1; }}
				class={cn('flex items-center gap-2', step === 1 ? 'font-bold text-navy' : 'text-foreground/45', step1Clickable ? 'cursor-pointer hover:text-navy' : 'cursor-default')}
			>
				<span class={cn('flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold transition', step === 1 ? 'bg-primary text-white' : step1Clickable ? 'bg-primary/30 text-navy hover:bg-primary/50' : 'bg-[#e7ddc7] text-foreground/45')}>1</span>
				Дата и время
			</button>
			<span class="text-[#d8cfbc]">—</span>
			<button
				type="button"
				onclick={() => { if (step2Clickable) goToPayment(); }}
				class={cn('flex items-center gap-2', step === 2 ? 'font-bold text-navy' : 'text-foreground/45', step2Clickable ? 'cursor-pointer hover:text-navy' : 'cursor-default')}
			>
				<span class={cn('flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold transition', step === 2 ? 'bg-primary text-white' : step2Clickable ? 'bg-primary/30 text-navy hover:bg-primary/50' : 'bg-[#e7ddc7] text-foreground/45')}>2</span>
				{isAcquaintance ? 'Ваши данные' : 'Оплата'}
			</button>
		</div>
		{/if}

		<div class="rounded-[20px] border border-[#ece3d1] bg-white p-6 shadow-[0_12px_44px_rgba(43,42,78,0.06)] lg:p-8">
			<!-- УСПЕХ (только для встречи-знакомства) -->
			{#if bookingSuccess && selectedSlot}
				<div class="py-8 text-center">
					<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
						<svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					</div>
					<h2 class="mb-2 font-caveat text-[28px] font-bold text-navy">Встреча забронирована!</h2>
					<p class="mb-1 text-[15px] font-semibold text-navy">
						{localDateLabel(selectedSlot.startAt)}, {localTime(selectedSlot.startAt)}
						{#if showMsk}<span class="font-normal text-foreground/40">({mskTime(selectedSlot.startAt)} МСК)</span>{/if}
					</p>
					<p class="mt-4 max-w-[360px] mx-auto text-[15px] leading-relaxed text-foreground/70">
						Свяжусь с вами в течение дня для подтверждения деталей. Можно также
						<a href="https://t.me/m/LMOE2JTtMDcy" class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition hover:text-primary">написать мне в Telegram</a>.
					</p>
				</div>
			{:else}
			<!-- ШАГ 1: календарь + слоты -->
			{#if step === 1}
				{#if data.availabilities.length === 0}
					<p class="py-10 text-center text-foreground/40">Нет доступных дат. Попробуйте позже.</p>
				{:else}
					<div class="grid grid-cols-1 gap-7 md:grid-cols-[300px_1fr] md:gap-9">
						<!-- календарь (стандартный Bits-UI Calendar) -->
						<div class="flex justify-center md:justify-start">
							<Calendar
								type="single"
								locale="ru"
								{isDateUnavailable}
								onValueChange={handleDateChange}
							/>
						</div>

						<!-- слоты -->
						<div class="flex flex-col">
							{#if !selectedDate}
								<p class="text-[15px] text-foreground/40 md:mt-1">Выберите дату на календаре</p>
							{:else if slotsForSelectedDate.length === 0}
								<p class="text-[15px] text-foreground/40 md:mt-1">Нет свободных слотов на эту дату.</p>
							{:else}
								<p class="mb-3 text-[15px] font-semibold text-navy">
									{new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
									— выберите время
									{#if showMsk}<span class="font-normal text-foreground/40">(ваше время)</span>{/if}
								</p>
								<div class="grid grid-cols-3 gap-2.5">
									{#each slotsForSelectedDate as slot}
										<button
											onclick={() => handleSlotSelect(slot)}
											class={cn(
												'rounded-[12px] border py-3 text-[15px] font-semibold transition',
												selectedSlot?.startAt === slot.startAt
													? 'border-primary bg-primary text-white'
													: 'border-[#e7ddc7] bg-white text-navy hover:border-primary/50 hover:bg-primary/5'
											)}
										>
											{localTime(slot.startAt)}
											{#if showMsk}<span class="block text-[11px] font-normal opacity-60">{mskTime(slot.startAt)} МСК</span>{/if}
										</button>
									{/each}
								</div>
								{#if selectedSlot}
									<button onclick={goToPayment} class="mt-5 w-full rounded-[12px] bg-primary px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(233,184,78,0.3)] transition hover:brightness-[0.97] active:scale-[0.99]">
										{isAcquaintance ? 'Далее' : 'Перейти к оплате'}
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{/if}

			<!-- ШАГ 2: оплата -->
			{:else if step === 2 && selectedSlot}
				<div class="mb-6">
					<button onclick={() => { step = 1; }} class="inline-flex items-center gap-1.5 text-[14px] text-foreground/50 transition hover:text-navy">
						<span class="icon-[lucide--arrow-left] h-4 w-4"></span> Назад
					</button>
					<p class="mt-2 text-[16px] font-semibold text-navy">
						{localDateLabel(selectedSlot.startAt)}, {localTime(selectedSlot.startAt)}
						{#if showMsk}<span class="font-normal text-foreground/40">({mskTime(selectedSlot.startAt)} МСК)</span>{/if}
					</p>
				</div>

				<div class="space-y-5">
					<label class="block">
						<span class="mb-2 block text-[14px] font-semibold text-navy">Telegram <span class="font-normal text-foreground/45">{isAcquaintance ? '(напишу вам перед встречей)' : '(для связи по деталям сессии)'}</span></span>
						<input type="text" bind:value={telegram} placeholder="@username" autocomplete="off" onfocus={handleFormFocus}
							class="w-full rounded-[12px] border border-[#e7ddc7] bg-[#faf7f0] px-4 py-3 text-[15px] text-navy outline-none transition placeholder:text-foreground/35 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20" />
					</label>
					{#if !isAcquaintance}
					<label class="block">
						<span class="mb-2 block text-[14px] font-semibold text-navy">Email <span class="font-normal text-foreground/45">(для чека)</span></span>
						<input type="email" bind:value={email} placeholder="example@mail.ru" onfocus={handleFormFocus}
							class="w-full rounded-[12px] border border-[#e7ddc7] bg-[#faf7f0] px-4 py-3 text-[15px] text-navy outline-none transition placeholder:text-foreground/35 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20" />
					</label>
					{/if}

					{#if error}
						<p class="rounded-[12px] bg-red-50 px-4 py-3 text-[14px] text-red-600">{error}</p>
					{/if}

					<button onclick={handlePay} disabled={loading || !telegram.trim() || (!isAcquaintance && !email.trim())}
						class="w-full rounded-[12px] bg-primary px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(233,184,78,0.3)] transition hover:brightness-[0.97] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none">
						{#if loading}
							{isAcquaintance ? 'Записываем…' : 'Перенаправление…'}
						{:else}
							{isAcquaintance ? 'Записаться' : 'Оплатить'}
						{/if}
					</button>
					{#if !isAcquaintance}
						<p class="text-center text-[13px] text-foreground/45">
							После оплаты слот закрепляется за вами. Оплата через Робокассу.
						</p>
					{/if}
				</div>
			{/if}
			{/if}
		</div>
	</div>
</div>
