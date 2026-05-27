<script lang="ts">
	import { enhance } from '$app/forms';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	let { data } = $props();

	let selectedDate = $state<string>('');
	let startHour = $state(9);
	let endHour = $state(18);
	let error = $state('');

	const MSK_TZ = 'Europe/Moscow';

	function handleDateChange(date: DateValue | undefined) {
		if (!date) return;
		selectedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	}

	const calendarValue = $derived.by(() => {
		if (!selectedDate) return undefined;
		const [y, m, d] = selectedDate.split('-').map(Number);
		return new CalendarDate(y, m, d);
	});

	const hours = Array.from({ length: 24 }, (_, i) => i);

	function mskDate(iso: string) {
		return new Date(iso).toLocaleDateString('ru-RU', {
			timeZone: MSK_TZ,
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function mskTime(iso: string) {
		return new Date(iso).toLocaleTimeString('ru-RU', {
			timeZone: MSK_TZ,
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Управление расписанием</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Расписание доступности</h1>

	<div class="mb-8 grid gap-6 lg:grid-cols-2">
		<div class="rounded-xl border bg-white p-4">
			<p class="mb-3 text-sm font-medium text-stone-600">Выберите дату (по МСК)</p>
			<Calendar type="single" value={calendarValue} onValueChange={handleDateChange} locale="ru" />
		</div>

		{#if selectedDate}
			<div class="rounded-xl border bg-white p-4">
				<p class="mb-4 text-sm font-medium text-stone-600">
					Добавить слот на <span class="font-semibold text-stone-800">{selectedDate}</span> МСК
				</p>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						error = '';
						return async ({ result, update }) => {
							if (result.type === 'failure') {
								error = (result.data?.error as string) ?? 'Ошибка';
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="date" value={selectedDate} />

					<div class="flex gap-3">
						<label class="flex-1">
							<span class="mb-1 block text-sm text-stone-600">С (МСК)</span>
							<select
								name="startHour"
								bind:value={startHour}
								class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
							>
								{#each hours as h}
									<option value={h}>{String(h).padStart(2, '0')}:00</option>
								{/each}
							</select>
						</label>

						<label class="flex-1">
							<span class="mb-1 block text-sm text-stone-600">До (МСК)</span>
							<select
								name="endHour"
								bind:value={endHour}
								class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
							>
								{#each hours as h}
									<option value={h}>{String(h).padStart(2, '0')}:00</option>
								{/each}
							</select>
						</label>
					</div>

					{#if error}
						<p class="text-sm text-red-500">{error}</p>
					{/if}

					<button
						type="submit"
						class="w-full rounded-lg bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-700"
					>
						Добавить слот
					</button>
				</form>
			</div>
		{:else}
			<div class="flex items-center justify-center rounded-xl border bg-stone-50 p-4 text-sm text-stone-400">
				Выберите дату на календаре
			</div>
		{/if}
	</div>

	<div class="rounded-xl border bg-white">
		<div class="border-b px-4 py-3">
			<p class="font-medium">Все слоты ({data.availabilities.length})</p>
		</div>

		{#if data.availabilities.length === 0}
			<p class="px-4 py-8 text-center text-sm text-stone-400">Слотов пока нет</p>
		{:else}
			<div class="divide-y">
				{#each data.availabilities as slot}
					<div class="flex items-center justify-between px-4 py-3">
						<div>
							<span class="font-medium">{mskDate(slot.startAt)}</span>
							<span class="ml-3 text-sm text-stone-500">
								{mskTime(slot.startAt)} — {mskTime(slot.endAt)} МСК
							</span>
						</div>

						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={slot.id} />
							<button type="submit" class="text-sm text-red-500 hover:text-red-700">
								Удалить
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
