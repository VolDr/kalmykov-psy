<script lang="ts">
	import { navigationLinks, anchorLinks } from '$lib/data/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	let {
		initialMenuColor = 'white',
		heroSelector = '[data-hero]'
	}: { initialMenuColor?: 'black' | 'white'; heroSelector?: string } = $props();

	let opened = $state(false);
	let menuColor = $state<'black' | 'white'>(initialMenuColor);
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

	function toggle() {
		opened = !opened;
		if (opened) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	function closeMenu() {
		opened = false;
		document.body.style.overflow = '';
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

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.body.style.overflow = '';
		};
	});
</script>

<div
	bind:this={headerElement}
	class={cn('fixed z-20 hidden w-full md:flex', menuColor === 'black' && 'bg-[#f7f5f0]')}
>
	<div
		class="relative mx-auto flex h-12 w-full max-w-full items-center md:max-w-[760px] lg:max-w-[960px]"
	>
		<nav aria-label="Главная навигация" class="ml-auto">
			<ul class="m-0 flex list-none items-center p-0">
				{#each navigationLinks as link}
					<li>
						<a
							href={link.link}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
							class={cn(
								'nav-link relative block px-3 py-2 text-[20px] no-underline select-none lg:text-[22px] xl:text-[22px]',
								menuColor === 'white' && 'text-white',
								menuColor === 'black' && 'text-[#191919]',
								link.link === page.url.pathname && 'active'
							)}
						>
							{link.label}
						</a>
					</li>
				{/each}
				<Button
					href="https://t.me/m/cRvQa0zAMTJi"
					target="_blank"
					rel="noopener noreferrer"
					variant="primary"
					class="block rounded-3xl bg-[#B8A98A] px-3 py-0 text-[22px] text-white transition-colors duration-200 hover:brightness-95"
					>Записаться</Button
				>
			</ul>

			{#if page.url.pathname === '/'}
				<ul class="absolute right-0 mt-3 ml-6 flex list-none items-center gap-4 p-0">
					{#each anchorLinks as anchor}
						{@const isActive = activeAnchor === anchor.link.replace('/#', '')}
						<li>
							<a
								href={anchor.link}
								class={cn(
									'block rounded-3xl px-3 py-0 text-[22px] transition-colors duration-200',
									isActive && 'bg-white text-[#191919]',
									!isActive &&
										menuColor === 'black' &&
										'bg-[#B8A98A] text-white hover:brightness-95',
									!isActive && menuColor === 'white' && 'text-white hover:opacity-80'
								)}
							>
								{anchor.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</nav>
	</div>
</div>

<div class="fixed top-0 left-0 z-50 flex h-12 w-full items-center justify-between px-4 md:hidden">
	<span
		class={cn(
			'text-xl font-medium transition-colors duration-200',
			(opened || menuColor === 'black') && 'text-[#191919]',
			!opened && menuColor === 'white' && 'text-white'
		)}
	>
		&#12644;
	</span>

	<button
		aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
		aria-expanded={opened}
		onclick={toggle}
		onkeydown={handleKeydown}
		class="relative h-5 w-6 pr-6 focus:outline-none"
	>
		<span
			class={cn(
				'absolute top-0 left-0 h-0.5 w-6 transition-all duration-200',
				(opened || menuColor === 'black') && 'bg-black',
				!opened && menuColor !== 'black' && 'bg-white',
				opened && 'translate-y-2 rotate-45'
			)}
		></span>
		<span
			class={cn(
				'absolute top-2 left-0 h-0.5 w-6 transition-all duration-200',
				(opened || menuColor === 'black') && 'bg-black',
				!opened && menuColor !== 'black' && 'bg-white',
				opened && 'opacity-0'
			)}
		></span>
		<span
			class={cn(
				'absolute top-4 left-0 h-0.5 w-6 transition-all duration-200',
				(opened || menuColor === 'black') && 'bg-black',
				!opened && menuColor !== 'black' && 'bg-white',
				opened && '-translate-y-2 -rotate-45'
			)}
		></span>
	</button>
</div>

{#if opened}
	<button
		aria-label="Закрыть меню"
		onclick={closeMenu}
		onkeydown={handleKeydown}
		class="fixed inset-0 z-30 animate-in bg-black/40 transition-opacity duration-200 fade-in sm:hidden"
	></button>
{/if}

<div
	role="dialog"
	aria-modal="true"
	aria-label="Мобильное меню"
	class={cn(
		'fixed top-0 right-0 z-40 h-full w-[80%] max-w-[300px] bg-white shadow-xl transition-transform duration-200 ease-out sm:hidden',
		opened ? 'translate-x-0' : 'translate-x-full'
	)}
>
	<nav aria-label="Меню навигации мобильное">
		<ul class="m-0 flex list-none flex-col p-0 px-4 pt-16">
			{#each navigationLinks as link}
				<li>
					<a
						href={link.link}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
						onclick={link.link === '/' ? undefined : closeMenu}
						class={cn(
							'flex min-h-[44px] items-center rounded px-4 py-3 text-lg text-[#191919] transition-colors duration-200 hover:bg-gray-100',
							link.link === page.url.pathname && 'bg-gray-100 font-medium'
						)}
					>
						{link.label}
					</a>
					{#if link.link === '/'}
						<ul class="mb-2 ml-4 flex flex-col border-l-2 border-gray-100 pl-4">
							{#each anchorLinks as anchor}
								<li>
									<a
										href={anchor.link}
										onclick={closeMenu}
										class="block py-2 text-base text-[#191919]/70 transition-colors duration-200 hover:text-[#B8A98A]"
									>
										{anchor.label}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}

            <Button
                href="https://t.me/m/cRvQa0zAMTJi"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                class="self-start rounded-3xl bg-[#B8A98A] px-5 py-2 text-base text-white transition-colors duration-200 hover:brightness-95 sm:self-auto"
            >
                Записаться
            </Button>
		</ul>
	</nav>
</div>

<style>
	.nav-link::after {
		content: '';
		position: absolute;
		width: 100%;
		transform: scaleX(0);
		height: 1px;
		bottom: 4px;
		left: 0;
		background-color: currentColor;
		transform-origin: bottom right;
		transition: transform 0.25s ease-out;
	}
	.nav-link:hover::after {
		transform: scaleX(1);
		transform-origin: bottom left;
	}
	.nav-link.active {
		font-weight: 500;
	}
	.nav-link.active::after {
		transform: scaleX(1);
	}
</style>
