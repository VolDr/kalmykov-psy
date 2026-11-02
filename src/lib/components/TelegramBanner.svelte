<script lang="ts">
	import { onMount } from 'svelte';
	import { reachGoal } from '#lib/metrika.js';
	import ButtonSvg from './ui/ButtonSvg.svelte';
	import { get } from 'svelte/store';
	import { cookieBannerDone } from '#lib/stores/cookieConsent.js';

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

			// В разделе тарифов оставляем внимание на записи, без промо поверх карточек.
			const pricing = document.getElementById('pricing')?.getBoundingClientRect();
			if (pricing && pricing.top < clientHeight && pricing.bottom > 0) {
				isShowing = false;
				return;
			}

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
		class="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 z-[100] flex min-h-14 w-[calc(100vw-88px)] items-center rounded-2xl bg-lilac sm:bottom-4 sm:left-1/2 sm:h-[70px] sm:w-[600px] sm:max-w-[70vw] sm:-translate-x-1/2 sm:justify-between sm:rounded-none sm:bg-transparent lg:max-w-[550px]"
		inert={!isShowing}
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
			class="pointer-events-none absolute inset-0 hidden h-full w-full drop-shadow-[0_8px_10px_rgba(231,225,244,0.18)] sm:block"
		>
			<path
				fill="#e7e1f4"
				d="M 42 10 C 81 7, 121 8, 162 8 C 205 8, 248 7, 294 8 C 322 9, 337 23, 336 40 C 335 57, 319 69, 291 70 C 245 71, 202 69, 156 70 C 111 71, 74 72, 40 70 C 18 68, 7 55, 7 39 C 7 23, 20 12, 42 10 Z"
			/>
		</svg>

		<button
			type="button"
			onclick={closeBanner}
			class="relative z-10 ml-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground hover:rotate-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:mt-2 sm:ml-2 lg:ml-5"
			aria-label="Закрыть баннер"
		>
			<span class="icon-[lucide--x] h-5 w-5"></span>
		</button>

		<a
			href={link}
			target="_blank"
			rel="noopener noreferrer"
			onclick={handleLinkClick}
			class="relative z-10 flex min-h-14 min-w-0 flex-1 items-center justify-between gap-2 rounded-r-2xl py-2 pr-4 text-[14px] leading-tight font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:hidden"
		>
			Мой Telegram-канал
			<span class="icon-[lucide--arrow-up-right] h-4 w-4 shrink-0" aria-hidden="true"></span>
		</a>

		<div
			class="relative z-10 mx-auto hidden min-w-0 text-center text-[15px] sm:block lg:text-[18px]"
		>
			<p class="pt-[10px]">
				{text}
				<ButtonSvg
					href={link}
					open="blank"
					width="70px"
					onclick={handleLinkClick}
					height="30px"
					variant="3"
					textSize="19px">тык</ButtonSvg
				>
			</p>
		</div>

		<div class="hidden w-6 shrink-0 sm:block"></div>
	</div>
{/if}
