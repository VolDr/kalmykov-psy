<script lang="ts">
	import { LineChart } from 'layerchart';
	import dayjs from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';
	import 'dayjs/locale/ru';

	dayjs.extend(customParseFormat);
	dayjs.locale('ru');

	interface Props {
		feedback: Array<{
			datetime: string;
			attitude: number;
			generally: number;
			goals: number;
			method: number;
		}>;
	}

	let { feedback }: Props = $props();

	const chartData = $derived(
		[...feedback]
			.sort((a, b) => {
				const date1 = dayjs(a.datetime);
				const date2 = dayjs(b.datetime);
				return date1.diff(date2);
			})
			.map(({ attitude, generally, goals, method, datetime }) => ({
				date: dayjs(datetime).toDate(),
				attitude,
				goals,
				method,
				generally,
				sum: Math.round((method + generally + goals + attitude) * 100) / 100
			}))
	);
</script>

<div class="h-96 w-full border rounded-sm">
	<LineChart
		data={chartData}
		x="date"
		series={[
			{ key: 'attitude', label: 'Отношение', color: '#888411' },
			{ key: 'goals', label: 'Цели', color: '#d18484' },
			{ key: 'method', label: 'Метод', color: '#8814d8' },
			{ key: 'generally', label: 'Общее', color: '#118418' },
			{ key: 'sum', label: 'Сумма', color: '#8884d8' }
		]}
		yDomain={[0, 40]}
		annotations={[

			{
				type: 'line',
				y: 36,
				label: '',
				labelXOffset: 4,
				labelYOffset: 2,
				props: {
					label: { class: 'fill-red-600' },
					line: { class: '[stroke-dasharray:4,4] stroke-red-600' }
				}
			}
		]}
	/>
</div>
