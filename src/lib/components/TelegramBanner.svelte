<script lang="ts">
	import { onMount } from 'svelte';
	import { reachGoal } from '$lib/metrika';
	import ButtonSvg from './ui/ButtonSvg.svelte';
	import { get } from 'svelte/store';
	import { cookieBannerDone } from '$lib/stores/cookieConsent';

	interface Props {
		text: string;
		link: string;
	}

	let { text, link }: Props = $props();

	let isVisible = $state(false); // Глобальная видимость (localStorage)
	let isShowing = $state(false); // Видимость при скролле

	const STORAGE_KEY = 'telegramBannerClosed';
	const SHOW_THRESHOLD = 0.3; // 30% scroll
	const UP_SCROLL_THRESHOLD = 100; // pixels
	const HIDE_DURATION_CLOSE_MS = 48 * 60 * 60 * 1000; // 48 hours for close button
	const HIDE_DURATION_CLICK_MS = 14 * 24 * 60 * 60 * 1000; // 14 days for link click

	function closeBanner() {
		isShowing = false;
		setTimeout(() => {
			isVisible = false;
		}, 350); // matches --panel-close-dur
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), type: 'close' }));
	}

	function handleLinkClick() {
		reachGoal('telegram_banner_click');
		setTimeout(() => {
			isVisible = false;
		}, 350);
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), type: 'click' }));
	}

	onMount(() => {
		let scrollCleanup: (() => void) | undefined;

		const startBanner = () => {
			scrollCleanup = initBanner() ?? undefined;
		};

		if (get(cookieBannerDone)) {
			setTimeout(startBanner, 2000);
		} else {
			const unsub = cookieBannerDone.subscribe((done) => {
				if (done) {
					unsub();
					setTimeout(startBanner, 2000);
				}
			});
		}

		return () => {
			scrollCleanup?.();
		};
	});

	function initBanner() {
		// 1. Проверка localStorage
		const storedData = localStorage.getItem(STORAGE_KEY);
		if (storedData) {
			try {
				const { timestamp, type } = JSON.parse(storedData);
				const hideDuration = type === 'click' ? HIDE_DURATION_CLICK_MS : HIDE_DURATION_CLOSE_MS;
				const hideUntil = parseInt(timestamp) + hideDuration;

				if (Date.now() < hideUntil) {
					isVisible = false;
					return; // Если скрыто, обработчики скролла не нужны
				}
			} catch {
				// Ошибка парсинга — считаем, что баннер нужно показать
			}
		}

		isVisible = true;

		// 2. Логика скролла
		let lastScrollTop = 0;
		let upScrollCount = 0;
		let thresholdReached = false;

		const handleScroll = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = document.documentElement.clientHeight;
			const scrollPercent = scrollTop / (scrollHeight - clientHeight);

			const isScrollingUp = scrollTop < lastScrollTop;
			const isScrollingDown = scrollTop > lastScrollTop;

			// Достигли ли порога появления (30% страницы)
			if (scrollPercent >= SHOW_THRESHOLD) {
				thresholdReached = true;
			}

			// Счетчик скролла вверх
			if (isScrollingUp) {
				upScrollCount += lastScrollTop - scrollTop;
			} else if (isScrollingDown) {
				upScrollCount = 0;
			}

			lastScrollTop = scrollTop;

			// Логика показа/скрытия
			// Если скроллим вниз и прошли порог — показываем
			if (!isShowing && thresholdReached && isScrollingDown) {
				isShowing = true;
			}
			// Если активно скроллим вверх — скрываем (чтобы не мешал)
			else if (isShowing && isScrollingUp && upScrollCount >= UP_SCROLL_THRESHOLD) {
				isShowing = false;
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // Initial check

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}
</script>

{#if isVisible}
	<div
		class="fixed bottom-4 left-1/2 z-[100] flex h-[70px] min-h-12 w-[600px] max-w-[70vw] -translate-x-1/2 items-center justify-between lg:max-w-[550px]"
		style="transition: transform 400ms cubic-bezier(0.22,1,0.36,1), opacity 400ms cubic-bezier(0.22,1,0.36,1), filter 400ms; transform: translateY({isShowing
			? '0px'
			: '90px'}); opacity: {isShowing ? 1 : 0}; filter: blur({isShowing
			? '0px'
			: '2px'}); pointer-events: {isShowing ? 'auto' : 'none'};"
	>
		<svg
			viewBox="0 0 340 68"
			preserveAspectRatio="none"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgba(231,225,244,0.18)]"
		>
			<path
				fill="#e7e1f4"
				d="M 42 10 C 81 7, 121 8, 162 8 C 205 8, 248 7, 294 8 C 322 9, 337 23, 336 40 C 335 57, 319 69, 291 70 C 245 71, 202 69, 156 70 C 111 71, 74 72, 40 70 C 18 68, 7 55, 7 39 C 7 23, 20 12, 42 10 Z"
			/>
		</svg>

		<button
			onclick={closeBanner}
			class="relative z-10 mt-2 ml-4 rotate-2 cursor-pointer pt-[5px] text-foreground hover:rotate-4 focus:outline-none lg:ml-7"
			aria-label="Закрыть баннер"
		>
			<span class="icon-[lucide--x] h-5 w-5"></span>
		</button>

		<div class="relative z-10 mx-auto max-w-[80vw] text-center text-[15px] lg:text-[18px]">
			<p class="pt-[10px]">
				{text}
				<ButtonSvg
					href={link}
					open="blank"
					width="70px"
					onclick={handleLinkClick}
					height="30px"
					style="3"
					textSize="19px">тык</ButtonSvg
				>
			</p>
		</div>

		<div class="w-6"></div>
	</div>
{/if}
