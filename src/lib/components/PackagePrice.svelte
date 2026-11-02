<script lang="ts">
	import { formatRubles } from '#lib/pricing.js';

	let { price }: { price: number } = $props();
</script>

<div class="mt-3 flex flex-col gap-1">
	<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
		<span class="text-[26px] leading-tight font-extrabold whitespace-nowrap lg:text-[28px]">
			{formatRubles(price)}
		</span>
		<span class="text-[16px] font-medium whitespace-nowrap text-white/75">/ 4 сессии</span>
	</div>
	<p class="text-[14px] leading-relaxed text-white/65 lg:text-[15px]">
		<span class="whitespace-nowrap">{formatRubles(Math.round(price / 4))}</span> за сессию
	</p>
</div>
