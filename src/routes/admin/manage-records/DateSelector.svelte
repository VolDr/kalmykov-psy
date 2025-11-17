<script lang="ts">
	import { Calendar, Day as CalendarDay } from '$lib/components/ui/calendar';
	import { Card } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import dayjs from 'dayjs';
	import { goto } from '$app/navigation';
	import { CalendarDate, fromDate, toCalendarDate } from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';

	let {
		currentDate = $bindable(),
		dotsPerDate
	}: {
		currentDate: Date | undefined;
		dotsPerDate: Record<string, string[]>;
	} = $props();

	let curDate = $state<DateValue | undefined>(
		currentDate
			? new CalendarDate(
					currentDate.getFullYear(),
					currentDate.getMonth() + 1,
					currentDate.getDate()
				)
			: undefined
	);
	let waitingForDoubleClick = $state(false);
	let clickTimeout: ReturnType<typeof setTimeout> | null = null;
	let pendingClickDate: DateValue | null = null;

	function handleDateClick(dateValue: DateValue | undefined) {
		// undefined = clicked on already selected date
		if (!dateValue) {
			// If we were waiting for double-click - this is the second click!
			if (waitingForDoubleClick && pendingClickDate) {
				if (clickTimeout) {
					clearTimeout(clickTimeout);
					clickTimeout = null;
				}
				waitingForDoubleClick = false;
				const date = new Date(
					pendingClickDate.year,
					pendingClickDate.month - 1,
					pendingClickDate.day
				);
				pendingClickDate = null;
				const targetUrl = `/admin/record/?date=${dayjs(date).startOf('day').add(12, 'hour').format('DD-MM-YYYY-HH-mm')}`;
				goto(targetUrl);
			} else if (curDate) {
				waitingForDoubleClick = true;
				pendingClickDate = curDate;
				if (clickTimeout) {
					clearTimeout(clickTimeout);
				}
				clickTimeout = setTimeout(() => {
					waitingForDoubleClick = false;
					pendingClickDate = null;
					clickTimeout = null;
				}, 700);
			}
			return;
		}

		if (typeof dateValue.day !== 'number') {
			return;
		}

		// Check if this is second click (after undefined) on same date
		const isSameAsPending =
			pendingClickDate &&
			dateValue.day === pendingClickDate.day &&
			dateValue.month === pendingClickDate.month &&
			dateValue.year === pendingClickDate.year;

		if (isSameAsPending && waitingForDoubleClick) {
			if (clickTimeout) {
				clearTimeout(clickTimeout);
				clickTimeout = null;
			}
			waitingForDoubleClick = false;
			const date = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
			pendingClickDate = null;
			const targetUrl = `/admin/record/?date=${dayjs(date).startOf('day').add(12, 'hour').format('DD-MM-YYYY-HH-mm')}`;
			goto(targetUrl);
			return;
		}

		// First click on date or different date - start/restart timer

		waitingForDoubleClick = true;
		pendingClickDate = dateValue;
		if (clickTimeout) {
			clearTimeout(clickTimeout);
		}
		clickTimeout = setTimeout(() => {
			waitingForDoubleClick = false;
			pendingClickDate = null;
			clickTimeout = null;
		}, 700);

		// Update curDate for rendering
		curDate = dateValue;

		// Update current date for parent component
		const date = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
		currentDate = date;
	}

	function handleDayClick(date: DateValue) {
		// Check if this is second click on pending date
		const isSameAsPending =
			pendingClickDate &&
			date.day === pendingClickDate.day &&
			date.month === pendingClickDate.month &&
			date.year === pendingClickDate.year;

		if (isSameAsPending && waitingForDoubleClick) {
			console.log('handleDayClick: Second click detected! Navigating...');
			if (clickTimeout) {
				clearTimeout(clickTimeout);
				clickTimeout = null;
			}
			waitingForDoubleClick = false;
			const jsDate = new Date(date.year, date.month - 1, date.day);
			pendingClickDate = null;
			const targetUrl = `/admin/record/?date=${dayjs(jsDate).startOf('day').add(12, 'hour').format('DD-MM-YYYY-HH-mm')}`;
			goto(targetUrl);
		}
	}

	function computeDotPositions(numOfDots: number): number[] {
		switch (numOfDots) {
			case 1:
				return [52];
			case 2:
				return [32, 72];
			case 3:
				return [2, 52, 102];
			case 4:
				return [-8, 32, 72, 112];
			case 5:
				return [2, 52, 102, 32, 72];
			case 6:
				return [2, 52, 102, 2, 52, 102];
			default:
				return [];
		}
	}

	function invertColor(hex: string): string {
		if (hex.indexOf('#') === 0) {
			hex = hex.slice(1);
		}

		if (hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}

		if (hex.length !== 6) {
			return hex;
		}

		const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16);
		const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16);
		const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);

		const pad = (str: string) => ('00' + str).slice(-2);

		return '#' + pad(r) + pad(g) + pad(b);
	}
</script>

<Card class="w-fit p-4">
	<Calendar value={curDate} onValueChange={handleDateClick} locale="ru">
		{#snippet day({ day: date, outsideMonth })}
			{@const jsDate = new Date(date.year, date.month - 1, date.day)}
			{@const dotTypes = dotsPerDate[dayjs(jsDate).startOf('day').toDate().toISOString()]}
			{@const numOfDots = dotTypes?.length ?? 0}
			{@const isSelected =
				curDate &&
				date.year === curDate.year &&
				date.month === curDate.month &&
				date.day === curDate.day}

			<CalendarDay {date} month={date} onclick={() => handleDayClick(date)}>
				{date.day}
				<div
					class="absolute bottom-[10px] left-1/2 flex h-1 -translate-x-1/2 items-center justify-center"
					style="width: 20px;"
				>
					{#each computeDotPositions(numOfDots) as position, idx}
						<div
							class="absolute rounded-full"
							style="
								height: 0;
								width: 0;
								border: 2px solid;
								right: {position}%;
								top: {idx > 2 && numOfDots > 4 ? 105 : 85}%;
								border-color: {isSelected ? '#ffffff' : (dotTypes?.[idx] ?? '#c6b693')};
								transform: translateX(2px);
							"
						></div>
					{/each}
				</div>
			</CalendarDay>
		{/snippet}
	</Calendar>
</Card>
