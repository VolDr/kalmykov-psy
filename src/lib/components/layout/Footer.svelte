<script lang="ts">
	import { socialLinks, footerInfo } from '$lib/data/navigation';

	const iconMap: Record<string, string> = {
		WhatsApp: 'icon-[ri--whatsapp-line]',
		Telegram: 'icon-[ri--telegram-line]'
	};
</script>

<footer class="mt-[100px] w-full bg-[#F2F0EF] lg:mt-[200px]">
	<div class="mx-auto max-w-[720px] bg-[#F2F0EF] py-4 md:max-w-[960px] lg:max-w-[1200px]">
		<div class="w-full items-center gap-y-8 md:grid-cols-12 lg:grid lg:gap-y-4">
			<div class="flex flex-nowrap justify-center gap-3 lg:col-start-11 lg:justify-end lg:gap-2">
				{#each socialLinks as social}
					<a
						href={social.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={social.ariaLabel}
						class="rounded-full hover:cursor-pointer"
					>
						<span
							class="{iconMap[
								social.label
							]} h-6 w-6 bg-[#191919] opacity-50 hover:bg-[#cfc1a3] hover:opacity-100 lg:h-5 lg:w-5"
							aria-hidden="true"
						></span>
					</a>
				{/each}
			</div>
			<div
				class="mt-4 text-center text-xs text-[#191919] opacity-50 lg:col-start-8 lg:col-end-12 lg:mt-0 lg:text-right"
			>
				{footerInfo.name}<br />
				{footerInfo.inn}
			</div>
		</div>
	</div>
</footer>
