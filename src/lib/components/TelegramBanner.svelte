<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import MarkdownLink from './MarkdownLink.svelte';

	interface Props {
		text: string;
		link: string;
	}

	let { text, link }: Props = $props();

	let isVisible = $state(false);
	let isShowing = $state(false);

	const STORAGE_KEY = 'telegramBannerClosed';
	const SHOW_THRESHOLD = 0.3; // 30% scroll
	const UP_SCROLL_THRESHOLD = 100; // pixels
	const HIDE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

	onMount(() => {
		// Check if banner was closed recently
		const lastClosed = localStorage.getItem(STORAGE_KEY);
		const hideUntil = Date.now() - HIDE_DURATION_MS;

		if (!lastClosed || parseInt(lastClosed) < hideUntil) {
			isVisible = true;
		}

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

			// Check if absolute threshold is reached
			if (scrollPercent >= SHOW_THRESHOLD) {
				thresholdReached = true;
			}

			// Update scroll counters
			if (isScrollingUp) {
				upScrollCount += lastScrollTop - scrollTop;
			} else if (isScrollingDown) {
				upScrollCount = 0;
			}

			lastScrollTop = scrollTop;

			// Show/hide banner logic
			if (!isShowing && thresholdReached && isScrollingDown) {
				// Show banner when scrolling down after threshold
				isShowing = true;
			} else if (isShowing && isScrollingUp && upScrollCount >= UP_SCROLL_THRESHOLD) {
				// Hide banner when scrolling up enough
				isShowing = false;
			}
		};

		// Initialize
		handleScroll();

		// Add scroll listener
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function closeBanner() {
		isVisible = false;
		localStorage.setItem(STORAGE_KEY, Date.now().toString());
	}

	// Format text with link placeholder
	let formattedText = $derived(text.replace('{link}', link));
</script>

{#if isVisible && isShowing}
	<div
		transition:fly={{ y: 100, duration: 300 }}
		class="fixed bottom-0 left-0 right-0 z-[100] flex min-h-12 max-w-[100vw] items-center justify-between bg-[#F2F0EF] shadow-lg"
	>
		<button
			onclick={closeBanner}
			class="ml-4 cursor-pointer text-[#191919] focus:outline-none"
			aria-label="Закрыть баннер"
		>
			<i class="icon-[lucide--x] h-5 w-5"></i>
		</button>

		<div class="mx-auto max-w-[70vw] text-center">
			<p>
				<MarkdownLink text={formattedText} />
			</p>
		</div>

		<div class="w-6"></div>
	</div>
{/if}
