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

<div class="mt-4 overflow-x-auto">
	<table class="w-full text-xs">
		<thead>
			<tr class="border-b">
				<th class="px-2 py-2 text-left">Дата</th>
				<th class="px-2 py-2 text-left">Индив.</th>
				<th class="px-2 py-2 text-left">Личн.</th>
				<th class="px-2 py-2 text-left">Соц.</th>
				<th class="px-2 py-2 text-left">Общее</th>
				<th class="w-[60px] px-2 py-2 text-left">Ссылка</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedData as item}
				<tr class="border-b hover:bg-gray-50">
					<td class="px-2 py-2">{dayjs(item.datetime).format('DD.MM.YY')}</td>
					<td class="px-2 py-2">{item.individual}</td>
					<td class="px-2 py-2">{item.family}</td>
					<td class="px-2 py-2">{item.social}</td>
					<td class="px-2 py-2">{item.generally}</td>
					<td class="px-2 py-2">
						<button
							onclick={() => copyToClipboard(item.smallId)}
							class="rounded p-1 hover:bg-gray-200"
							title={copiedId === item.smallId ? 'Copied' : 'Copy'}
						>
							{#if copiedId === item.smallId}
								<span class="icon-[lucide--check] h-4 w-4 text-teal-600"></span>
							{:else}
								<span class="icon-[lucide--copy] h-4 w-4 text-gray-600"></span>
							{/if}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
