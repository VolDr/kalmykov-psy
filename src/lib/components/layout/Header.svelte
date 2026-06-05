<!--
  ════════════════════════════════════════════════════════════════
  ИСПРАВЛЕНО:  src/lib/components/layout/Header.svelte
  ────────────────────────────────────────────────────────────────
  Полная замена. Что починено:
  1. ПОЛУПРОЗРАЧНОСТЬ (bg-background/90 + backdrop-blur) теперь только
     на ОСНОВНОЙ строке (логотип + меню + «Записаться»), а строка
     якорей (запросы/подход/обо мне/стоимость/вопрос-ответ) висит ПОД
     ней без фона — больше нет высокой «слащавой» плашки.
  2. АКТИВНЫЙ якорь снова явно подсвечивается: navy + жирный +
     жёлтое подчёркивание (раньше было еле заметное muted→navy).
  Логика IntersectionObserver / scroll / мобильное меню — без изменений.
  ════════════════════════════════════════════════════════════════
-->
<script lang="ts">
	import { navigationLinks, anchorLinks } from '$lib/data/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import ButtonSvg from '../ui/ButtonSvg.svelte';

	let {
		initialMenuColor = 'black',
		heroSelector = '[data-hero]'
	}: { initialMenuColor?: 'black' | 'white'; heroSelector?: string } = $props();

	let opened = $state(false);
	let menuColor = $state<'black' | 'white'>(initialMenuColor);
	let scrolled = $state(false);
	let headerElement: HTMLDivElement | null = null;
	let activeAnchor = $state('');
	$effect(() => {
		if (page.url.pathname !== '/') {
			activeAnchor = '';
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeAnchor = entry.target.id;
					} else if (entry.target.id === activeAnchor) {
						activeAnchor = '';
					}
				});
			},
			{ rootMargin: '-50% 0px -50% 0px' }
		);

		anchorLinks.forEach((anchor) => {
			const id = anchor.link.replace('/#', '');
			const element = document.getElementById(id);
			if (element) observer.observe(element);
		});

		return () => observer.disconnect();
	});

	function lockScroll() {
		document.body.style.overflow = 'hidden';
	}

	function unlockScroll() {
		document.body.style.overflow = '';
	}

	function toggle() {
		opened = !opened;
		if (opened) lockScroll();
		else unlockScroll();
	}

	function closeMenu() {
		opened = false;
		unlockScroll();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		} else if (event.key === 'Escape' && opened) {
			closeMenu();
		}
	}

	function handleScroll() {
		const heroElement = document.querySelector(heroSelector);
		scrolled = window.scrollY > 12;

		if (!heroElement || !headerElement) {
			menuColor = initialMenuColor;
			return;
		}
		const scrollY = window.scrollY;
		const heroHeight = heroElement.clientHeight;
		const headerHeight = headerElement.clientHeight;

		const threshold = heroHeight - headerHeight * 0.8;
		menuColor = scrollY > threshold ? 'black' : initialMenuColor;
	}

	afterNavigate(() => {
		closeMenu();
	});

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.body.style.overflow = '';
		};
	});
</script>

<!-- ====================== DESKTOP ====================== -->
<!-- Внешний контейнер теперь ПРОЗРАЧНЫЙ — фон только на верхней строке -->
<div bind:this={headerElement} class="fixed top-0 left-0 z-20 hidden w-full flex-col md:flex">
	<!-- ОСНОВНАЯ строка: логотип + меню + кнопка — только ей даём фон/блюр -->
	<div
		class={cn(
			'w-full transition-colors duration-200',
			scrolled && 'bg-background/90 backdrop-blur-sm'
		)}
	>
		<div
			class="mx-auto flex w-full max-w-full items-center justify-between gap-8 px-5 py-3 md:max-w-[760px] lg:max-w-[1600px] xl:px-0"
		>
			<!-- логотип -->
			<a href="/" class="hide flex shrink-0 items-center gap-3 no-underline select-none">

				<span class="hidden md:flex flex-col leading-none">
					<span class="font-caveat text-[28px] leading-none font-bold text-navy">Андрей Калмыков</span>
					<span class="mt-0.5 text-[11px] tracking-[0.14em] text-muted-foreground lowercase"
						>психолог-консультант</span
					>
				</span>
			</a>

			<!-- главное меню -->
			<nav aria-label="Главная навигация">
				<ul class="m-0 flex list-none items-center gap-7 p-0">
					{#each navigationLinks as link}
						<li>
							<a
								href={link.link}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
								class={cn(
									'nav-link relative block py-1.5 text-[16px] whitespace-nowrap text-foreground no-underline transition-colors select-none hover:text-navy lg:text-[19px]',
									link.link === page.url.pathname && 'active'
								)}
							>
								{link.label}
							</a>
						</li>
					{/each}
					<ButtonSvg
				width="180px"
								href="/booking"
                           variant="2"
						>Записаться</ButtonSvg>
					
				</ul>
			</nav>
		</div>
	</div>

	<!-- строка ЯКОРЕЙ: без фона, висит под основной строкой -->
	{#if page.url.pathname === '/'}
		<div class="w-full">
			<div
				class="mx-auto flex w-full max-w-full justify-end px-5 pt-2 md:max-w-[760px] lg:max-w-[1600px] xl:px-0"
			>
				<ul class="m-0 flex list-none items-center gap-7  bg-background/90 backdrop-blur-sm px-2 py-1 rounded-sm">
					{#each anchorLinks as anchor}
						{@const isActive = activeAnchor === anchor.link.replace('/#', '')}
						<li>
							<a
								href={anchor.link}
								class={cn(
									'anchor-link relative block py-0.5 text-[14px] whitespace-nowrap transition-colors duration-200',
									isActive
										? 'font-bold text-navy active'
										: 'font-medium text-muted-foreground hover:text-navy'
								)}
							>
								{anchor.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<!-- ====================== MOBILE BAR ====================== -->
<div
	class={cn(
		'fixed top-0 left-0 z-50 flex h-14 w-full items-center justify-between px-4 transition-colors duration-200 md:hidden',
		(scrolled || opened) && 'bg-background/95 backdrop-blur-sm'
	)}
>
	<!-- мобильный логотип -->
	<a
		href="/"
		onclick={opened ? (e) => { e.preventDefault(); closeMenu(); } : closeMenu}
		class="flex items-center gap-2 no-underline select-none"
	>
		
		<span class="font-caveat text-[24px] leading-none font-bold text-navy">Андрей Калмыков, психолог</span>
	</a>

	<button
		aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
		aria-expanded={opened}
		onclick={toggle}
		onkeydown={handleKeydown}
		class="relative h-6 w-6 text-navy focus:outline-none"
	>
		<div class="t-icon-swap" data-state={opened ? 'b' : 'a'}>
			<span class="t-icon" data-icon="a">
				<span class="icon-[lucide--menu] h-6 w-6"></span>
			</span>
			<span class="t-icon" data-icon="b">
				<span class="icon-[lucide--x] h-6 w-6"></span>
			</span>
		</div>
	</button>
</div>

<!-- ====================== MOBILE OVERLAY ====================== -->
<button
	aria-label="Закрыть меню"
	tabindex={opened ? 0 : -1}
	aria-hidden={!opened}
	onclick={(e) => { e.preventDefault(); e.stopPropagation(); closeMenu(); }}
	ontouchend={(e) => { e.preventDefault(); closeMenu(); }}
	onkeydown={handleKeydown}
	class={cn(
		'fixed inset-x-0 top-0 z-30 h-dvh bg-black/40 transition-opacity duration-200 md:hidden overscroll-none touch-none',
		opened ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
	)}
></button>

<!-- ====================== MOBILE PANEL ====================== -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Мобильное меню"
	class="t-panel-slide-x fixed top-0 right-0 z-40 flex h-dvh w-[84%] max-w-[320px] flex-col bg-background shadow-xl md:hidden"
	data-open={opened ? 'true' : 'false'}
>


	<nav aria-label="Меню навигации мобильное" class="flex-1 overflow-y-auto px-4">
		<ul class="mt-14 flex list-none flex-col gap-1 p-0">
			{#each navigationLinks as link}
				<li>
					<a
						href={link.link}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
						onclick={closeMenu}
						class={cn(
							'flex min-h-[48px] items-center rounded-xl px-4 text-[17px] font-semibold text-foreground transition-colors duration-200 hover:bg-card',
							link.link === page.url.pathname && 'bg-card text-navy'
						)}
					>
						{link.label}
					</a>

					{#if link.link === '/' && page.url.pathname === '/'}
						<ul class="mt-1 mb-2 ml-4 flex list-none flex-col border-l border-border pl-5">
							{#each anchorLinks as anchor}
								{@const isActive = activeAnchor === anchor.link.replace('/#', '')}
								<li>
									<a
										href={anchor.link}
										onclick={closeMenu}
										class={cn(
											'block py-2 text-[15px] transition-colors duration-200',
											isActive ? 'font-bold text-navy' : 'text-muted-foreground hover:text-navy'
										)}
									>
										{anchor.label}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	<!-- кнопка снизу -->
	<div class="px-4 pt-3 pb-6">
		<Button
			href="/booking"
			variant="primary"
			class="block w-full rounded-full bg-primary px-5 py-3 text-center text-[16px] font-bold text-white shadow-[0_6px_16px_rgba(233,184,78,0.28)] transition-all duration-200 hover:brightness-95"
		>
			Записаться
		</Button>
	</div>
</div>

<style>
	/* подчёркивание активного пункта главного меню — жёлтым, как в макете */
	.nav-link::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 3px;
		border-radius: 3px;
		background-color: var(--color-primary);
		transform: scaleX(0);
		transform-origin: bottom right;
		transition: transform 0.25s ease-out;
	}
	.nav-link:hover::after {
		transform: scaleX(1);
		transform-origin: bottom left;
	}
	.nav-link.active {
		font-weight: 700;
	}
	.nav-link.active::after {
		transform: scaleX(1);
	}

	/* активный ЯКОРЬ — жёлтое подчёркивание под текущим разделом */
	.anchor-link::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -2px;
		width: 100%;
		height: 2px;
		border-radius: 2px;
		background-color: var(--color-primary);
		transform: scaleX(0);
		transform-origin: bottom right;
		transition: transform 0.25s ease-out;
	}
	.anchor-link:hover::after,
	.anchor-link.active::after {
		transform: scaleX(1);
		transform-origin: bottom left;
	}
</style>
