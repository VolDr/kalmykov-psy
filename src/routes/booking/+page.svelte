<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import type { SlotInfo } from '$lib/server/booking.server';

	let { data } = $props();

	type Step = 1 | 2 | 3;
	let step = $state<Step>(1);
	let selectedDate = $state('');
	let selectedSlot = $state<{ startAt: string; availabilityId: number; status: SlotInfo['status'] } | null>(null);
	let telegram = $state('');
	let email = $state('');
	let loading = $state(false);
	let error = $state('');

	const MSK_TZ = 'Europe/Moscow';

	// YYYY-MM-DD string in the user's local timezone
	function localDateStr(iso: string): string {
		return new Date(iso).toLocaleDateString('sv'); // 'sv' locale gives YYYY-MM-DD
	}

	// All available slots grouped by local date
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

	const slotsForSelectedDate = $derived(slotsByLocalDate.get(selectedDate) ?? []);

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
		step = 2;
		trackGoal('booking_date_selected');
	}

	function handleSlotSelect(slot: { startAt: string; availabilityId: number; status: SlotInfo['status'] }) {
		if (slot.status !== 'available') return;
		selectedSlot = slot;
		step = 3;
		trackGoal('booking_hour_selected');
	}

	function goBack() {
		if (step === 3) { step = 2; return; }
		if (step === 2) { step = 1; selectedDate = ''; selectedSlot = null; }
	}

	function localTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	}

	function mskTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK_TZ });
	}

	function localDateLabel(iso: string): string {
		return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	// Show MSK suffix only when user's timezone differs from Moscow
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
	<div class="mx-auto max-w-2xl">
		<div class="mb-8 text-center">
			<h1 class="font-display text-3xl font-medium text-stone-800">Запись на консультацию</h1>
			<p class="mt-2 text-stone-500">Стоимость: {Number(data.price).toLocaleString('ru-RU')} ₽</p>
		</div>

		<!-- Steps indicator -->
		<div class="mb-8 flex items-center justify-center gap-2 text-sm">
			{#each [['1', 'Дата'], ['2', 'Время'], ['3', 'Оплата']] as [num, label], i}
				<div class={cn(
					'flex items-center gap-1.5',
					step === i + 1 ? 'text-stone-800 font-medium' : 'text-stone-400'
				)}>
					<span class={cn(
						'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
						step === i + 1 ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
					)}>{num}</span>
					{label}
				</div>
				{#if i < 2}
					<span class="text-stone-200">—</span>
				{/if}
			{/each}
		</div>

		<div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">

			<!-- Step 1: Calendar -->
			{#if step === 1}
				<p class="mb-4 text-sm text-stone-500">Выберите удобную дату. Подсвечены только доступные дни.</p>
				{#if data.availabilities.length === 0}
					<p class="py-8 text-center text-stone-400">Нет доступных дат. Попробуйте позже.</p>
				{:else}
					<div class="flex justify-center">
						<Calendar
							type="single"
							locale="ru"
							{isDateUnavailable}
							onValueChange={handleDateChange}
						/>
					</div>
				{/if}

			<!-- Step 2: Slot selection -->
			{:else if step === 2 && slotsForSelectedDate.length === 0}
				<div class="py-8 text-center">
					<p class="text-stone-400">Слоты недоступны для этой даты.</p>
					<button onclick={() => { step = 1; selectedDate = ''; }} class="mt-3 text-sm text-stone-600 underline">
						Выбрать другую дату
					</button>
				</div>
			{:else if step === 2}
				<div class="mb-4">
					<button onclick={goBack} class="text-sm text-stone-400 hover:text-stone-600">← Назад</button>
					<p class="mt-1 text-sm font-medium text-stone-700">
						{selectedDate} — выберите время
						{#if showMsk}<span class="font-normal text-stone-400">(ваше время)</span>{/if}
					</p>
				</div>

				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{#each slotsForSelectedDate.filter(s => s.status === 'available') as slot}
						<button
							onclick={() => handleSlotSelect(slot)}
							class={cn(
								'rounded-lg border py-3 text-sm font-medium transition',
								'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50',
								selectedSlot?.startAt === slot.startAt && 'border-stone-800 bg-stone-800 text-white'
							)}
						>
							{localTime(slot.startAt)}
							{#if showMsk}
								<span class="block text-xs font-normal opacity-60">{mskTime(slot.startAt)} МСК</span>
							{/if}
						</button>
					{/each}
				</div>

			<!-- Step 3: Contact details -->
			{:else if step === 3 && selectedSlot}
				<div class="mb-4">
					<button onclick={goBack} class="text-sm text-stone-400 hover:text-stone-600">← Назад</button>
					<p class="mt-1 text-sm font-medium text-stone-700">
						{localDateLabel(selectedSlot.startAt)}, {localTime(selectedSlot.startAt)}
						{#if showMsk}
							<span class="font-normal text-stone-400">({mskTime(selectedSlot.startAt)} МСК)</span>
						{/if}
					</p>
				</div>

				<div class="space-y-4">
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium text-stone-700">Telegram</span>
						<input
							type="text"
							bind:value={telegram}
							placeholder="@username"
							autocomplete="off"
							class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-200"
						/>
					</label>

					<label class="block">
						<span class="mb-1.5 block text-sm font-medium text-stone-700">Email <span class="font-normal text-stone-400">(для чека)</span></span>
						<input
							type="email"
							bind:value={email}
							placeholder="example@mail.ru"
							class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-200"
						/>
					</label>

					{#if error}
						<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
					{/if}

					<button
						onclick={handlePay}
						disabled={loading || !telegram.trim() || !email.trim()}
						class="w-full rounded-lg bg-stone-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? 'Перенаправление...' : `Оплатить ${Number(data.price).toLocaleString('ru-RU')} ₽`}
					</button>

					<p class="text-center text-xs text-stone-400">
						После оплаты слот закрепляется за вами. Оплата через Робокассу.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
