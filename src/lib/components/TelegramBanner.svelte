<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { reachGoal } from '$lib/metrika';

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
		// Даем время анимации исчезновения перед полным скрытием
		setTimeout(() => {
			isVisible = false;
		}, 300);
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), type: 'close' }));
	}

	function handleLinkClick() {
		reachGoal('telegram_banner_click');
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), type: 'click' }));
	}

	onMount(() => {
		// 1. Проверка localStorage
		const storedData = localStorage.getItem(STORAGE_KEY);
		if (storedData) {
			try {
				const { timestamp, type } = JSON.parse(storedData);
				const hideDuration =
					type === 'click' ? HIDE_DURATION_CLICK_MS : HIDE_DURATION_CLOSE_MS;
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
	});
</script>

{#if isVisible && isShowing}
	<div
		transition:fly={{ y: 100, duration: 300 }}
		class="fixed bottom-0 left-0 right-0 z-[100] flex min-h-12 max-w-[100vw] items-center justify-between bg-card shadow-lg"
	>
		<button
			onclick={closeBanner}
			class="ml-4 cursor-pointer text-foreground focus:outline-none"
			aria-label="Закрыть баннер"
		>
			<span class="icon-[lucide--x] h-5 w-5"></span>
		</button>

		<div class="mx-auto max-w-[70vw] text-center">
			<p>
				{text}
				<a
					target="_blank"
					rel="noopener noreferrer"
					href={link}
					onclick={handleLinkClick}
					class="nav-link relative inline-flex select-none items-start font-semibold text-foreground/70 no-underline hover:text-foreground/50"
				>
					тык
					<span class="icon-[lucide--external-link] ml-1 text-xs"></span>
				</a>
			</p>
		</div>

		<div class="w-6"></div>
	</div>
{/if}

