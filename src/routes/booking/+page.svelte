<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import type { SlotInfo } from '$lib/server/booking.server';

	let { data } = $props();

	type Step = 1 | 2;
	let step = $state<Step>(1);
	let selectedDate = $state('');
	let selectedSlot = $state<{ startAt: string; availabilityId: number; status: SlotInfo['status'] } | null>(null);
	let telegram = $state('');
	let email = $state('');
	let loading = $state(false);
	let error = $state('');

	const MSK_TZ = 'Europe/Moscow';

	function localDateStr(iso: string): string {
		return new Date(iso).toLocaleDateString('sv');
	}

	const slotsByLocalDate = $derived.by(() => {
		const map = new Map<string, { startAt: string; availabilityId: number; status: SlotInfo['status'] }[]>();
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
		(slotsByLocalDate.get(selectedDate) ?? []).filter(s => s.status === 'available')
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

	function handleSlotSelect(slot: { startAt: string; availabilityId: number; status: SlotInfo['status'] }) {
		if (slot.status !== 'available') return;
		selectedSlot = slot;
		trackGoal('booking_hour_selected');
	}

	function goToPayment() {
		if (!selectedSlot) return;
		step = 2;
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
		if (!selectedSlot || !telegram.trim() || !email.trim()) return;
		loading = true;
		error = '';
		trackGoal('booking_payment_initiated');
		try {
			const res = await fetch('/api/booking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					availabilityId: selectedSlot.availabilityId,
					bookedAt: selectedSlot.startAt,
					telegram: telegram.trim(),
					email: email.trim(),
					type: data.type
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Ошибка');

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
	<title>Запись на консультацию</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 px-4 py-16">
	<div class="mx-auto max-w-3xl">
		<div class="mb-8 text-center">
			<h1 class="font-display text-3xl font-medium text-stone-800">Запись на консультацию</h1>
			<p class="mt-2 text-stone-500">Стоимость: {Number(data.price).toLocaleString('ru-RU')} ₽</p>
		</div>

		<!-- Steps -->
		<div class="mb-8 flex items-center justify-center gap-2 text-sm">
			<!-- Step 1 -->
			<button
				type="button"
				onclick={() => { if (step1Clickable) step = 1; }}
				class={cn(
					'flex items-center gap-1.5',
					step === 1 ? 'font-medium text-foreground' : 'text-muted-foreground',
					step1Clickable ? 'cursor-pointer hover:text-foreground' : 'cursor-default'
				)}
			>
				<span class={cn(
					'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition',
					step === 1 ? 'bg-primary text-primary-foreground' : step1Clickable ? 'bg-primary/30 text-primary-foreground/80 hover:bg-primary/50' : 'bg-stone-200 text-stone-500'
				)}>1</span>
				Дата и время
			</button>

			<span class="text-stone-200">—</span>

			<!-- Step 2 -->
			<button
				type="button"
				onclick={() => { if (step2Clickable) goToPayment(); }}
				class={cn(
					'flex items-center gap-1.5',
					step === 2 ? 'font-medium text-foreground' : 'text-muted-foreground',
					step2Clickable ? 'cursor-pointer hover:text-foreground' : 'cursor-default'
				)}
			>
				<span class={cn(
					'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition',
					step === 2 ? 'bg-primary text-primary-foreground' : step2Clickable ? 'bg-primary/30 text-foreground/70 hover:bg-primary/50' : 'bg-stone-200 text-stone-500'
				)}>2</span>
				Оплата
			</button>
		</div>

		<div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">

			<!-- Step 1: Calendar + slots -->
			{#if step === 1}
				{#if data.availabilities.length === 0}
					<p class="py-8 text-center text-stone-400">Нет доступных дат. Попробуйте позже.</p>
				{:else}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
						<!-- Calendar -->
						<div class="flex justify-center md:justify-start">
							<Calendar
								type="single"
								locale="ru"
								{isDateUnavailable}
								onValueChange={handleDateChange}
							/>
						</div>

						<!-- Slots -->
						<div class="flex flex-col">
							{#if !selectedDate}
								<p class="mt-4 text-sm text-stone-400 md:mt-8">Выберите дату на календаре</p>
							{:else if slotsForSelectedDate.length === 0}
								<p class="mt-4 text-sm text-stone-400 md:mt-8">Нет свободных слотов на эту дату.</p>
							{:else}
								<p class="mb-3 text-sm font-medium text-stone-600">
									{new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
									— выберите время
									{#if showMsk}<span class="font-normal text-stone-400">(ваше время)</span>{/if}
								</p>
								<div class="grid grid-cols-3 gap-2">
									{#each slotsForSelectedDate as slot}
										<button
											onclick={() => handleSlotSelect(slot)}
											class={cn(
												'rounded-lg border py-3 text-sm font-medium transition',
												selectedSlot?.startAt === slot.startAt
													? 'border-primary bg-primary text-primary-foreground'
													: 'border-stone-200 bg-white hover:border-primary/40 hover:bg-primary/5'
											)}
										>
											{localTime(slot.startAt)}
											{#if showMsk}
												<span class="block text-xs font-normal opacity-60">{mskTime(slot.startAt)} МСК</span>
											{/if}
										</button>
									{/each}
								</div>
								{#if selectedSlot}
									<button
										onclick={goToPayment}
										class="mt-4 w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
									>
										Перейти к оплате
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{/if}

			<!-- Step 2: Payment form -->
			{:else if step === 2 && selectedSlot}
				<div class="mb-6">
					<button onclick={() => { step = 1; }} class="text-sm text-stone-400 hover:text-stone-600">← Назад</button>
					<p class="mt-1 text-sm font-medium text-stone-700">
						{localDateLabel(selectedSlot.startAt)}, {localTime(selectedSlot.startAt)}
						{#if showMsk}
							<span class="font-normal text-stone-400">({mskTime(selectedSlot.startAt)} МСК)</span>
						{/if}
					</p>
				</div>

				<div class="space-y-4">
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium text-stone-700">Telegram <span class="font-normal text-stone-400">(для связи по деталям сессии)</span></span>
						<input
							type="text"
							bind:value={telegram}
							placeholder="@username"
							autocomplete="off"
							class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
						/>
					</label>

					<label class="block">
						<span class="mb-1.5 block text-sm font-medium text-stone-700">Email <span class="font-normal text-stone-400">(для чека)</span></span>
						<input
							type="email"
							bind:value={email}
							placeholder="example@mail.ru"
							class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
						/>
					</label>

					{#if error}
						<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
					{/if}

					<button
						onclick={handlePay}
						disabled={loading || !telegram.trim() || !email.trim()}
						class="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? 'Перенаправление...' : 'Оплатить'}
					</button>

					<p class="text-center text-xs text-stone-400">
						После оплаты слот закрепляется за вами. Оплата через Робокассу.
					</p>
				</div>
			{/if}

		</div>
	</div>
</div>
