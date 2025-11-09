<script lang="ts">
	import { socialLinks, footerInfo } from '$lib/data/navigation';

	const iconMap: Record<string, string> = {
		WhatsApp: 'icon-[ri--whatsapp-line]',
		Telegram: 'icon-[ri--telegram-line]'
	};
</script>

<footer class="w-full bg-[#F2F0EF] mt-[100px] lg:mt-[200px]">
	<div class="bg-[#F2F0EF] max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto py-4">
		<div class="lg:grid md:grid-cols-12 gap-y-8 lg:gap-y-4 items-center w-full">
			<div class="flex gap-3 lg:gap-2 justify-center lg:justify-end flex-nowrap lg:col-start-11">
				{#each socialLinks as social}
					<a
						href={social.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={social.ariaLabel}
						class="rounded-full hover:cursor-pointer">
						<span
							class="{iconMap[social.label]} bg-[#191919] hover:bg-[#cfc1a3] hover:opacity-100 w-6 h-6 lg:w-5 lg:h-5 opacity-50"
							aria-hidden="true"></span>
					</a>
				{/each}
			</div>
			<div
				class="text-xs text-[#191919] opacity-50 text-center lg:text-right lg:col-start-8 lg:col-end-12 mt-4 lg:mt-0">
				{footerInfo.name}<br />
				{footerInfo.inn}
			</div>
		</div>
	</div>
</footer>
