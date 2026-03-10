<script lang="ts">
	import dayjs from 'dayjs';

	interface Props {
		client: {
			name: string;
			nick?: string;
		};
		datetime: string;
	}

	let { client, datetime }: Props = $props();
</script>

<div class="mx-auto flex max-w-[500px] items-center justify-between pt-8 select-none">
	<p class="text-xl">
		{client.nick !== undefined ? client.nick : client.name}
	</p>
	<p class="text-xl">
		{dayjs(datetime, 'DD-MM-YYYY-HH-mm').format('DD MMM YY HH:mm')}
	</p>
</div>
