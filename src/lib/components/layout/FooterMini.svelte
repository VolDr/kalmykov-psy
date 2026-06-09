<script lang="ts">
	import { footerInfo } from '$lib/data/navigation';
</script>

<footer class="w-full border-t border-navy/10 bg-background py-5">
	<div class="mx-auto flex flex-col items-center gap-2 px-5 text-center sm:flex-row sm:justify-between md:max-w-[760px] xl:px-0">
		<div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
			<a href="/oferta" target="_blank" class="text-[12px] text-foreground/40 transition-colors hover:text-foreground/70 hover:underline">Договор оферты</a>
			<a href="/privacy" target="_blank" class="text-[12px] text-foreground/40 transition-colors hover:text-foreground/70 hover:underline">Политика конфиденциальности</a>
		</div>
		<div class="flex flex-wrap justify-center gap-x-1.5 text-[12px] text-foreground/35">
			<span>{footerInfo.name}</span>
			<span class="opacity-40">·</span>
			<span>{footerInfo.inn}</span>
		</div>
	</div>
</footer>
