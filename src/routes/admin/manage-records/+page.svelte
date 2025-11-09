<script lang="ts">
	import DateSelector from './DateSelector.svelte';
	import RecordTable from './RecordTable.svelte';
	import StatsCards from './StatsCards.svelte';
	import WeeklyChart from './WeeklyChart.svelte';
	import dayjs from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';
	import 'dayjs/locale/ru';

	dayjs.extend(customParseFormat);
	dayjs.locale('ru');

	let { data } = $props();

	let currentDate = $state<Date | undefined>(dayjs().startOf('day').toDate());

	const dotsPerDate = $derived.by(() => {
		const colors = {
			black: '#cfc1a3',
			grey: '#e1d6be'
		};
		const result: Record<string, string[]> = {};

		data.countByDate.forEach((count) => {
			const serializedDate = count.scheduledDay;
			const prevDay = dayjs(serializedDate).startOf('day').isBefore(dayjs().startOf('day'));

			result[new Date(serializedDate).toISOString()] = Array.from({ length: count._count }).map(
				() => (prevDay ? colors.grey : colors.black)
			);
		});

		return result;
	});
</script>

<div class="container mx-auto px-4">
	<div class="mb-8 flex justify-center">
		<DateSelector {dotsPerDate} bind:currentDate />
	</div>

	<RecordTable {currentDate} activities={data.activities} />

	<div class="mt-8 space-y-4">
		<StatsCards activities={data.activities} />
		<WeeklyChart activities={data.activities} />
	</div>
</div>
