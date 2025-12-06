<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import { swipe } from '$lib/actions/swipe';

	interface Diploma {
		imageUrl: string;
		title: string;
	}

	let {
		isOpen = $bindable(false),
		diplomas,
		initialIndex = 0
	}: {
		isOpen: boolean;
		diplomas: Diploma[];
		initialIndex: number;
	} = $props();

	let currentIndex = $state(initialIndex);
	let loadedImages = $state(new Set<string>());
	let direction = $state(1);
	let isFirstOpen = $state(true);

	const currentDiploma = $derived(diplomas[currentIndex]);

	function close() {
		isOpen = false;
	}

	function goToNext() {
		if (diplomas.length <= 1) return;
		isFirstOpen = false;
		direction = 1;
		currentIndex = (currentIndex + 1) % diplomas.length;
	}

	function goToPrevious() {
		if (diplomas.length <= 1) return;
		isFirstOpen = false;
		direction = -1;
		currentIndex = (currentIndex - 1 + diplomas.length) % diplomas.length;
	}

	function goToIndex(index: number) {
		if (index === currentIndex) return;
		isFirstOpen = false;
		direction = index > currentIndex ? 1 : -1;
		currentIndex = index;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowRight') {
			goToNext();
		} else if (e.key === 'ArrowLeft') {
			goToPrevious();
		}
	}

	function handleImageLoad(imageUrl: string) {
		loadedImages = new Set([...loadedImages, imageUrl]);
	}

	function preloadAdjacentImages() {
		if (diplomas.length <= 1) return;

		const nextIndex = (currentIndex + 1) % diplomas.length;
		const prevIndex = (currentIndex - 1 + diplomas.length) % diplomas.length;

		[diplomas[nextIndex], diplomas[prevIndex]].forEach((diploma) => {
			if (!loadedImages.has(diploma.imageUrl)) {
				const img = new Image();
				img.src = diploma.imageUrl;
			}
		});
	}

	$effect(() => {
		currentIndex = initialIndex;
		isFirstOpen = true;
	});

	$effect(() => {
		if (isOpen) {
			const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.overflow = 'hidden';
			document.body.style.paddingRight = `${scrollbarWidth}px`;

			window.addEventListener('keydown', handleKeydown);

			return () => {
				document.body.style.overflow = '';
				document.body.style.paddingRight = '';
				window.removeEventListener('keydown', handleKeydown);
			};
		}
	});

	$effect(() => {
		if (isOpen) {
			preloadAdjacentImages();
		}
	});
</script>

{#if isOpen && diplomas.length > 0}
	<!-- Backdrop -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 bg-[#000000ab]"
		onclick={close}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				close();
			}
		}}
		role="button"
		tabindex="0"
		aria-label="Закрыть модальное окно"
	>
		<!-- Content wrapper - centered -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Modal content -->
			<div
				class="relative flex flex-col gap-6"
				use:swipe={{ onSwipeLeft: goToNext, onSwipeRight: goToPrevious }}
				role="dialog"
				aria-modal="true"
				aria-label="Просмотр диплома"
			>
				<!-- Close button -->
				<button
					onclick={close}
					class="absolute -top-10 right-0 z-10 cursor-pointer p-2 text-white transition-colors hover:text-[#cfc1a3]"
					aria-label="Закрыть"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<!-- Image area with navigation -->
				<div class="relative flex items-center justify-center gap-4 select-none">
					<!-- Previous button -->
					{#if diplomas.length > 1}
						<button
							onclick={(e) => {
								e.stopPropagation();
								goToPrevious();
							}}
							class="hidden cursor-pointer rounded-lg border border-[#cfc1a3] bg-white/90 p-2 transition-all hover:bg-[#cfc1a3] hover:text-white md:flex"
							aria-label="Предыдущий диплом"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>
					{/if}

					<!-- Image -->
					<div
						class="relative flex h-[50vh] w-[min(90vw,1200px)] items-center justify-center overflow-hidden md:h-[70vh]"
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => e.stopPropagation()}
						role="img"
						aria-label={currentDiploma.title}
					>
						{#key currentIndex}
							<div
								class="absolute inset-0 flex items-center justify-center"
								in:fly={{
									x: isFirstOpen ? 0 : direction * 300,
									duration: isFirstOpen ? 0 : 300,
									easing: cubicOut
								}}
								out:fly={{
									x: isFirstOpen ? 0 : direction * -300,
									duration: isFirstOpen ? 0 : 300,
									easing: cubicOut
								}}
							>
								<img
									src={currentDiploma.imageUrl}
									alt={currentDiploma.title}
									class={cn(
										'h-auto max-h-full w-auto max-w-full transition-opacity',
										loadedImages.has(currentDiploma.imageUrl) ? 'opacity-100' : 'opacity-0'
									)}
									onload={() => handleImageLoad(currentDiploma.imageUrl)}
									loading="eager"
								/>
							</div>
						{/key}

						<!-- Loading spinner -->
						{#if !loadedImages.has(currentDiploma.imageUrl)}
							<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
								<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-[#cfc1a3]"></div>
							</div>
						{/if}
					</div>

					<!-- Next button -->
					{#if diplomas.length > 1}
						<button
							onclick={(e) => {
								e.stopPropagation();
								goToNext();
							}}
							class="hidden cursor-pointer rounded-lg border border-[#cfc1a3] bg-white/90 p-2 transition-all hover:bg-[#cfc1a3] hover:text-white md:flex"
							aria-label="Следующий диплом"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Indicators -->
				{#if diplomas.length > 1}
					<div
						class="flex items-center justify-center gap-2"
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => e.stopPropagation()}
						role="group"
						aria-label="Навигация по дипломам"
					>
						{#each diplomas as _, index}
							<button
								onclick={() => goToIndex(index)}
								class={cn(
									'cursor-pointer rounded-full transition-all duration-200',
									index === currentIndex
										? 'h-2 w-8 bg-[#cfc1a3]'
										: 'h-2 w-2 bg-gray-300 hover:bg-gray-400'
								)}
								aria-label="Перейти к диплому {index + 1}"
							></button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
