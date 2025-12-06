<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { DateValue } from '@internationalized/date';
	import { CalendarDate } from '@internationalized/date';

	let {
		value = $bindable(''),
		class: className
	}: {
		value?: string;
		class?: string;
	} = $props();

	// Parse initial value if provided (format: YYYY-MM-DDTHH:MM)
	let selectedDate = $state<DateValue | undefined>(
		value && value.trim()
			? (() => {
					const [datePart] = value.split('T');
					const [year, month, day] = datePart.split('-').map(Number);
					return new CalendarDate(year, month, day);
				})()
			: (() => {
					const now = new Date();
					return new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
				})()
	);

	let selectedTime = $state<string>(
		value && value.trim()
			? (() => {
					const [, timePart] = value.split('T');
					return timePart;
				})()
			: ''
	);

	// Generate time slots from 8:00 to 23:00
	const timeSlots = $derived.by(() => {
		const slots: string[] = [];
		for (let hour = 8; hour <= 23; hour++) {
			slots.push(`${hour.toString().padStart(2, '0')}:00`);
			if (hour < 23) {
				slots.push(`${hour.toString().padStart(2, '0')}:30`);
			}
		}
		return slots;
	});

	function handleDateChange(newDate: DateValue | undefined) {
		selectedDate = newDate;
		updateValue();
	}

	function handleTimeClick(time: string) {
		selectedTime = time;
		updateValue();
	}

	function updateValue() {
		if (selectedDate && selectedTime) {
			const year = selectedDate.year;
			const month = selectedDate.month.toString().padStart(2, '0');
			const day = selectedDate.day.toString().padStart(2, '0');
			value = `${year}-${month}-${day}T${selectedTime}`;
		}
	}
</script>

<div class={cn('flex flex-col gap-4 lg:flex-row', className)}>
	<Card class="w-fit p-4">
		<div class="mb-3 text-sm font-medium">Выберите дату</div>
		<Calendar value={selectedDate} onValueChange={handleDateChange} locale="ru" />
	</Card>

	<Card class="flex-1 p-4">
		<div class="mb-3 text-sm font-medium">Выберите время</div>
		<div class="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-2">
			{#each timeSlots as time}
				<Button
					type="button"
					variant={selectedTime === time ? 'default' : 'outline'}
					class={cn(
						'w-full justify-center',
						selectedTime === time && 'bg-primary text-primary-foreground'
					)}
					onclick={() => handleTimeClick(time)}
				>
					{time}
				</Button>
			{/each}
		</div>
	</Card>
</div>
