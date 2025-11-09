<script lang="ts">
	import dayjs from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';
	import 'dayjs/locale/ru';
	import { PUBLIC_SITE_URL } from '$env/static/public';

	dayjs.extend(customParseFormat);
	dayjs.locale('ru');

	interface Props {
		currentState: Array<{
			id: string;
			smallId: string;
			datetime: string;
			family: number;
			generally: number;
			individual: number;
			social: number;
		}>;
	}

	let { currentState }: Props = $props();

	let copiedId = $state<string | null>(null);

	const sortedData = $derived(
		[...currentState].sort((a, b) => {
			const date1 = dayjs(a.datetime);
			const date2 = dayjs(b.datetime);
			return date2.diff(date1);
		})
	);

	function copyToClipboard(smallId: string) {
		const url = `${PUBLIC_SITE_URL}/${smallId}`;
		navigator.clipboard.writeText(url);
		copiedId = smallId;
		setTimeout(() => {
			copiedId = null;
		}, 2000);
	}
</script>

<div class="overflow-x-auto mt-4">
	<table class="w-full text-xs">
		<thead>
			<tr class="border-b">
				<th class="text-left py-2 px-2">Дата</th>
				<th class="text-left py-2 px-2">Индив.</th>
				<th class="text-left py-2 px-2">Личн.</th>
				<th class="text-left py-2 px-2">Соц.</th>
				<th class="text-left py-2 px-2">Общее</th>
				<th class="text-left py-2 px-2 w-[60px]">Ссылка</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedData as item}
				<tr class="border-b hover:bg-gray-50">
					<td class="py-2 px-2">{dayjs(item.datetime).format('DD.MM.YY')}</td>
					<td class="py-2 px-2">{item.individual}</td>
					<td class="py-2 px-2">{item.family}</td>
					<td class="py-2 px-2">{item.social}</td>
					<td class="py-2 px-2">{item.generally}</td>
					<td class="py-2 px-2">
						<button
							onclick={() => copyToClipboard(item.smallId)}
							class="p-1 hover:bg-gray-200 rounded"
							title={copiedId === item.smallId ? 'Copied' : 'Copy'}
						>
							{#if copiedId === item.smallId}
								<span class="icon-[lucide--check] w-4 h-4 text-teal-600"></span>
							{:else}
								<span class="icon-[lucide--copy] w-4 h-4 text-gray-600"></span>
							{/if}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
