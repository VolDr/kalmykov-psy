<script lang="ts">
	import { LineChart } from 'layerchart';
	import dayjs from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';
	import 'dayjs/locale/ru';

	dayjs.extend(customParseFormat);
	dayjs.locale('ru');

	interface Props {
		currentState: Array<{
			datetime: string;
			family: number;
			generally: number;
			individual: number;
			social: number;
		}>;
	}

	let { currentState }: Props = $props();

	const chartData = $derived(
		[...currentState]
			.sort((a, b) => {
				const date1 = dayjs(a.datetime);
				const date2 = dayjs(b.datetime);
				return date1.diff(date2);
			})
			.map(({ datetime, family, generally, individual, social }) => ({
				date: dayjs(datetime).toDate(),
				family,
				generally,
				individual,
				social,
				sum: Math.round((family + generally + individual + social) * 100) / 100
			}))
	);
</script>

<div class="h-96 w-full rounded-md border">
	<LineChart
		data={chartData}
		x="date"
		series={[
			{ key: 'individual', label: 'Индивидуальное', color: '#888411' },
			{ key: 'family', label: 'Семейное', color: '#d18484' },
			{ key: 'social', label: 'Социальное', color: '#8814d8' },
			{ key: 'generally', label: 'Общее', color: '#118418' },
			{ key: 'sum', label: 'Сумма', color: '#8884d1' }
		]}
		yDomain={[0, 40]}
		annotations={[
			{
				type: 'line',
				y: 28,
				label: '',
				labelXOffset: 4,
				labelYOffset: 2,
				props: {
					label: { class: 'fill-orange-600' },
					line: { class: '[stroke-dasharray:4,4] stroke-orange-600' }
				}
			}
		]}
	/>
</div>
