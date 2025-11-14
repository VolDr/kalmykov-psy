<script lang="ts">
	import { navigationLinks } from '$lib/data/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let {
		initialMenuColor = 'white',
		heroSelector = '[data-hero]'
	}: { initialMenuColor?: 'black' | 'white'; heroSelector?: string } = $props();

	let opened = $state(false);
	let menuColor = $state<'black' | 'white'>(initialMenuColor);
	let headerElement: HTMLDivElement | null = null;

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
		font-weight: 600;
	}

	.nav-link.active::after {
		transform: scaleX(1);
	}
</style>

<!-- Desktop Menu -->
<div
	bind:this={headerElement}
	class={cn('hidden md:flex fixed w-full z-20  ', {
		'bg-[#F2F0EF]': menuColor === 'black'
	})}>
	<div
		class="max-w-full mx-auto h-12 flex items-center">
		<nav aria-label="Основная навигация">
			<ul class="flex items-center list-none p-0 m-0">
				{#each navigationLinks as link}
					<li>
						<a
							href={link.link}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
							class={cn(
								'nav-link block no-underline px-3 py-2 select-none text-[13px] lg:text-[16px] xl:text-[22px] relative',
								{
									'text-white': menuColor === 'white',
									'text-[#191919]': menuColor === 'black',
									active: link.link === page.url.pathname
								}
							)}>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</div>

<!-- Mobile Menu Header -->
<div class="md:hidden fixed w-full z-50 left-0 top-0 h-12 flex justify-between items-center px-4">
	<span
		class={cn('text-xl font-medium transition-colors duration-200', {
			'text-[#191919]': opened || menuColor === 'black',
			'text-white': !opened && menuColor === 'white'
		})}>
		&#12644;
	</span>
	<button
		aria-label={opened ? 'Закрыть контекстное меню' : 'Открыть контекстное меню'}
		aria-expanded={opened}
		onclick={toggle}
		onkeydown={handleKeydown}
		class="pr-6 focus:outline-none relative w-6 h-5">
		<span
			class={cn('absolute top-0 left-0 w-6 h-0.5 transition-all duration-200', {
				'bg-black': opened || menuColor === 'black',
				'bg-white': !opened && menuColor !== 'black',
				'rotate-45 translate-y-2': opened
			})}></span>
		<span
			class={cn('absolute top-2 left-0 w-6 h-0.5 transition-all duration-200', {
				'bg-black': opened || menuColor === 'black',
				'bg-white': !opened && menuColor !== 'black',
				'opacity-0': opened
			})}></span>
		<span
			class={cn('absolute top-4 left-0 w-6 h-0.5 transition-all duration-200', {
				'bg-black': opened || menuColor === 'black',
				'bg-white': !opened && menuColor !== 'black',
				'-rotate-45 -translate-y-2': opened
			})}></span>
	</button>
</div>

<!-- Mobile Menu Backdrop -->
{#if opened}
	<button
		aria-label="Закрыть меню"
		onclick={closeMenu}
		onkeydown={handleKeydown}
		class="sm:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 animate-in fade-in">
	</button>
{/if}

<!-- Mobile Menu Drawer -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Навигационное меню"
	class={cn(
		'sm:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-40',
		'transition-transform duration-200 ease-out',
		{
			'translate-x-0': opened,
			'translate-x-full': !opened
		}
	)}>
	<nav aria-label="Основная навигация">
		<ul class="flex flex-col pt-16 px-4 list-none p-0 m-0">
			{#each navigationLinks as link}
				<li>
					<a
						href={link.link}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
						onclick={closeMenu}
						class={cn(
							'text-lg text-[#191919] py-3 px-4 min-h-[44px] flex items-center',
							'hover:bg-gray-100 transition-colors duration-200 rounded',
							{
								'bg-gray-100 font-medium': link.link === page.url.pathname
							}
						)}>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>
