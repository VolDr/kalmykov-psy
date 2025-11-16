<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		title: string;
		phone: string;
		link: string;
		minHeight?: string;
		class?: string;
	}

	let { title, phone, link, minHeight = '220px', class: className = '' }: Props = $props();
</script>

<div class={cn(`min-h-[${minHeight}]`, className)}>
	<div class="flex h-full min-h-[180px] flex-col justify-end rounded-lg bg-[#F2F0EF] p-6">
		<div class="mb-4 flex items-center gap-3">
			<h2 class="text-[#191919]">{title}</h2>
		</div>
		<div class="mb-4 flex items-center gap-3 font-semibold">
			<a href={link}>{phone}</a>
		</div>
	</div>
</div>
