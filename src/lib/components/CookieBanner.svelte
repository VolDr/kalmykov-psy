<script lang="ts">
	import { onMount } from 'svelte';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import { cookieBannerDone } from '$lib/stores/cookieConsent';

	const STORAGE_KEY = 'cookie_consent';

	let visible = $state(false);
	let open = $state(false);

	onMount(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			cookieBannerDone.set(true);
		} else {
			visible = true;
			requestAnimationFrame(() => {
				open = true;
			});
		}
	});

	function dismiss() {
		open = false;
		setTimeout(() => {
			visible = false;
			cookieBannerDone.set(true);
		}, 350);
	}

	function accept() {
		localStorage.setItem(STORAGE_KEY, 'accepted');
		dismiss();
	}

	function decline() {
		localStorage.setItem(STORAGE_KEY, 'declined');
		dismiss();
	}
</script>

{#if visible}
	<div
		role="dialog"
		aria-label="Согласие на использование cookies"
		aria-modal="false"
		data-open={open ? 'true' : 'false'}
		class="t-panel-slide fixed bottom-4 left-1/2 z-[300] w-[520px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2"
		style="--panel-translate-y: 80px;"
	>
		<svg
			viewBox="0 0 260 100"
			preserveAspectRatio="none"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgba(231,225,244,0.18)]"
		>
			<path
				fill="#e7e1f4"
				d="M 22 6 C 70 2, 160 3, 220 4 C 248 5, 257 18, 257 35 C 257 60, 257 78, 238 90 C 200 97, 130 97, 70 97 C 35 97, 6 88, 4 70 C 2 52, 4 10, 22 6 Z"
			/>
		</svg>

		<div class="relative z-10 z-[999] flex items-center gap-3 px-5 py-4 sm:px-7">
			<p class="flex-1 text-[15px] leading-snug text-foreground/80">
				На сайте используются cookies для улучшения работы.
				<a href="/privacy" class="underline hover:text-foreground/60">Подробнее</a>
			</p>
			<div class="flex shrink-0 flex-col items-center gap-2">
				<ButtonSvg
					mode="button"
					onclick={accept}
					width="83px"
					height="36px"
					variant="3"
					textSize="15px"
				>
					Согласен
				</ButtonSvg>
				<button
					onclick={decline}
					class="mb-1 text-[14px] text-foreground/70 transition-colors hover:text-foreground/70"
				>
					Отказаться
				</button>
			</div>
		</div>
	</div>
{/if}
