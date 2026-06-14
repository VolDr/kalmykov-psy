<script lang="ts">
	import { enhance } from '$app/forms';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	let { data } = $props();

	let selectedDates = $state<Set<string>>(new Set());
	let startHour = $state(9);
	let endHour = $state(18);
	let error = $state('');

	let bulkText = $state('');
	let bulkError = $state('');
	let bulkResult = $state<{ added: number; removed: number; skipped: number } | null>(null);

	const MSK_TZ = 'Europe/Moscow';

	function dateStr(d: DateValue): string {
		return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
	}

	function handleCalendarChange(dates: DateValue[] | undefined) {
		if (!dates) { selectedDates = new Set(); return; }
		selectedDates = new Set(dates.map(dateStr));
	}

	// Convert selectedDates back to CalendarDate[] for the Calendar value prop
	const calendarValue = $derived(
		[...selectedDates].map((s) => {
			const [y, m, d] = s.split('-').map(Number);
			return new CalendarDate(y, m, d);
		})
	);

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
			<p class="mb-1 text-sm font-medium text-stone-600">Выберите даты (МСК)</p>
			<p class="mb-3 text-xs text-stone-400">Кликайте по датам для выбора/снятия</p>
			<Calendar type="multiple" value={calendarValue} onValueChange={handleCalendarChange} locale="ru" />
			{#if selectedDates.size > 0}
				<button
					type="button"
					onclick={() => (selectedDates = new Set())}
					class="mt-3 text-xs text-stone-400 hover:text-red-500"
				>Сбросить все ({selectedDates.size})</button>
			{/if}
		</div>

		<div class="rounded-xl border bg-white p-4">
			{#if selectedDates.size === 0}
				<div class="flex h-full items-center justify-center text-sm text-stone-400">
					Выберите даты на календаре
				</div>
			{:else}
				<p class="mb-4 text-sm font-medium text-stone-600">
					Добавить слот на <span class="font-semibold text-stone-800">{selectedDates.size} {selectedDates.size === 1 ? 'дату' : 'дат'}</span>
				</p>

				<div class="mb-4 flex flex-wrap gap-1.5">
					{#each [...selectedDates].sort() as d}
						<span class="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">{d}</span>
					{/each}
				</div>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						error = '';
						return async ({ result, update }) => {
							if (result.type === 'failure') {
								error = (result.data?.error as string) ?? 'Ошибка';
							} else {
								selectedDates = new Set();
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					{#each [...selectedDates] as d}
						<input type="hidden" name="date" value={d} />
					{/each}

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
						Добавить слот{selectedDates.size > 1 ? ` (${selectedDates.size} дни)` : ''}
					</button>
				</form>
			{/if}
		</div>
	</div>

	<div class="mb-8 rounded-xl border bg-white p-4">
		<p class="mb-1 text-sm font-medium text-stone-600">Массовый ввод</p>
		<p class="mb-3 text-xs text-stone-400">
			Формат: <code class="rounded bg-stone-100 px-1">ADD</code> или <code class="rounded bg-stone-100 px-1">REMOVE</code>, затем строки «дата часы-часы»
		</p>

		<form
			method="POST"
			action="?/bulk"
			use:enhance={() => {
				bulkError = '';
				bulkResult = null;
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						bulkError = (result.data?.bulkError as string) ?? 'Ошибка';
					} else if (result.type === 'success' && result.data) {
						bulkResult = {
							added: result.data.added as number,
							removed: result.data.removed as number,
							skipped: result.data.skipped as number
						};
						bulkText = '';
					}
					await update();
				};
			}}
			class="space-y-3"
		>
			<textarea
				name="text"
				bind:value={bulkText}
				rows={8}
				placeholder={"ADD\n14.06 10-18\n15.06 9-17\n\nREMOVE\n13.06 10-18"}
				class="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-sm focus:border-stone-400 focus:outline-none"
			></textarea>

			{#if bulkError}
				<p class="text-sm text-red-500">{bulkError}</p>
			{/if}

			{#if bulkResult}
				<p class="text-sm text-stone-600">
					Добавлено: <span class="font-semibold text-green-700">{bulkResult.added}</span>
					&nbsp;· Удалено: <span class="font-semibold text-red-600">{bulkResult.removed}</span>
					{#if bulkResult.skipped > 0}
						&nbsp;· Пропущено (пересечение): <span class="font-semibold text-stone-500">{bulkResult.skipped}</span>
					{/if}
				</p>
			{/if}

			<button
				type="submit"
				disabled={!bulkText.trim()}
				class="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
			>
				Применить
			</button>
		</form>
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
