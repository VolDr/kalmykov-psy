<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import DiplomaModal from '$lib/components/DiplomaModal.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { educationGroups } from '$lib/data/education';
	import { cn } from '$lib/utils';

	let { isOpen = false, titleClass = '' }: { isOpen?: boolean; titleClass?: string } = $props();
	let openFromHash = $state(false);
	let isModalOpen = $state(false);

	$effect(() => {
		const checkHash = () => {
			if (window.location.hash === '#education') openFromHash = true;
		};
		checkHash();
		window.addEventListener('hashchange', checkHash);
		return () => window.removeEventListener('hashchange', checkHash);
	});
	let selectedDiplomaIndex = $state(0);

	const diplomas = $derived(
		educationGroups
			.flatMap((group) => group.items)
			.filter((item) => item.diploma)
			.map((item) => ({
				imageUrl: item.diploma!,
				title: item.title
			}))
	);

	const categoryExplanations: Record<string, string> = {
		'Основное образование':
			'Дипломы по психологическому консультированию — то, что дает право работать психологом.',
		Подходы:
			'Я работаю конкретными методами, а не интуитивно. Эти методы изучены в тысячах исследований и доказали свою эффективность в работе с психологическими запросами — примерно как доказанные схемы лечения в медицине.',
		Специализации: 'Отдельные темы, в которые я погрузился глубже.',
		Конференции:
			'Я регулярно посещаю профессиональные встречи и конференции — там психологи обсуждают новые исследования, разбирают сложные случаи и учатся друг у друга.',
		Остальное:
			'Образование, которое напрямую не связано с консультированием, но помогает в работе с людьми..'
	};

	const labelStyles = ['bg-primary text-bold text-white', 'bg-lilac text-bold text-[#322d43]'];

	function openDiplomaModal(imageUrl: string) {
		const index = diplomas.findIndex((d) => d.imageUrl === imageUrl);
		selectedDiplomaIndex = index >= 0 ? index : 0;
		isModalOpen = true;
	}

	function scrollCarousel(event: Event, direction: 'left' | 'right') {
		const button = event.currentTarget as HTMLElement;
		const section = button.closest('.education-section');
		const carousel = section?.querySelector('.education-carousel');

		if (carousel) {
			const scrollAmount = 680;
			carousel.scrollBy({
				left: direction === 'left' ? -scrollAmount : scrollAmount,
				behavior: 'smooth'
			});
		}
	}

	function handleWheelScroll(e: WheelEvent) {
		const target = e.currentTarget as HTMLElement;

		if (e.deltaX !== 0) return;

		const isAtLeftEdge = target.scrollLeft <= 0;
		const isAtRightEdge = Math.ceil(target.scrollLeft + target.clientWidth) >= target.scrollWidth;

		if ((e.deltaY < 0 && !isAtLeftEdge) || (e.deltaY > 0 && !isAtRightEdge)) {
			e.preventDefault();

			target.scrollBy({
				left: e.deltaY > 0 ? 200 : -200,
				behavior: 'smooth'
			});
		}
	}
</script>

<div class="w-full scroll-mt-24 pt-2 md:pt-4" id="education">
	<AccordionItem isOpen={isOpen || openFromHash} variant="education">
		{#snippet header()}
			<Reveal width="full" axis="x">
				<div class="text-left">
					<h2
						class={cn(
							'relative inline-block whitespace-nowrap pb-1 font-caveat text-[34px] leading-[1.1] font-bold text-navy lg:text-[40px]',
							titleClass
						)}
					>
						где я учился
						<svg
							viewBox="0 0 240 16"
							preserveAspectRatio="none"
							class="pointer-events-none absolute -bottom-1 -left-2 h-[14px] w-[calc(100%+16px)]"
							aria-hidden="true"
						>
							<path
								d="M3 9 C65 5 152 5 237 9"
								stroke="var(--color-marker)"
								stroke-width="5"
								stroke-linecap="round"
								fill="none"
							/>
							<path
								d="M43 12 C91 10 164 9 215 10"
								stroke="var(--color-marker)"
								stroke-width="2"
								stroke-linecap="round"
								fill="none"
								opacity=".6"
							/>
						</svg>
					</h2>
					<p class="mt-4 text-[16px] leading-relaxed text-foreground/55 lg:text-[18px]">
						Здесь можно посмотреть мои документы об образовании, если для вас это важно.
					</p>
				</div>
			</Reveal>
		{/snippet}

		<div class="pt-5 md:pt-7">
			{#each educationGroups as group, groupIndex}
				<div class="education-section {groupIndex > 0 ? 'mt-12' : 'mt-2'}">
					<div
						class="flex items-end justify-between pl-4 {categoryExplanations[group.category]
							? 'mb-3'
							: 'mb-6'}"
					>
						<span
							class="inline-block rounded-full px-4.5 py-1.5 text-[16px] font-bold lg:text-[18px] {labelStyles[
								groupIndex % labelStyles.length
							]}"
						>
							{group.category}
						</span>

						{#if group.items.length > 3}
							<div class="hidden items-center gap-2 pr-1 pb-1 md:flex">
								<button
									onclick={(e) => scrollCarousel(e, 'left')}
									class="flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 text-foreground/40 transition-all hover:border-primary hover:text-primary hover:shadow-sm"
									aria-label="Листать влево"
								>
									<span class="icon-[lucide--chevron-left] h-5 w-5"></span>
								</button>
								<button
									onclick={(e) => scrollCarousel(e, 'right')}
									class="flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 text-foreground/40 transition-all hover:border-primary hover:text-primary hover:shadow-sm"
									aria-label="Листать вправо"
								>
									<span class="icon-[lucide--chevron-right] h-5 w-5"></span>
								</button>
							</div>
						{/if}
					</div>

					{#if categoryExplanations[group.category]}
						<p
							class="mb-6 max-w-[700px] pr-20 pl-4 text-[16px] leading-relaxed text-foreground/60 lg:text-[18px]"
						>
							{categoryExplanations[group.category]}
						</p>
					{/if}

					<div
						class="education-carousel my-scroll flex w-full snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto pt-2 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] md:[scrollbar-color:var(--color-primary)_var(--color-background)] md:[scrollbar-width:thin] [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-primary/70 md:hover:[&::-webkit-scrollbar-thumb]:bg-primary md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-background"
						onwheel={handleWheelScroll}
					>
						{#each group.items as item, idx}
							<svelte:element
								this={item.diploma ? 'button' : 'div'}
								role={item.diploma ? 'button' : undefined}
								onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
								class={cn(
									'group relative flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col justify-between rounded-[18px] border p-6 text-left transition-all duration-300 md:p-7',
									item.diploma
										? 'border-navy/10 bg-[#fdfaf3] outline-0 hover:cursor-pointer hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] focus:outline-primary focus-visible:outline-primary'
										: 'border-navy/10 bg-background',
									{ 'ml-4': idx === 0, 'mr-4': idx === group.items.length - 1 }
								)}
							>
								<div class="relative z-10 flex w-full flex-col">
									{#if !item.completed}
										<span class="t-badge" data-open="true">
											<span class="t-badge-dot h-2 w-2 rounded-full bg-primary"></span>
										</span>
										<span
											class="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-card px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-foreground/60 uppercase"
										>
											В процессе
										</span>
									{/if}

									<h5
										class={cn(
											'text-[16px] leading-snug font-bold text-navy transition-colors lg:text-[18px]',
											{ 'group-hover:text-primary': item.diploma }
										)}
									>
										{item.title}
									</h5>
									<p class="mt-3 text-[16px] leading-relaxed text-foreground/60 lg:text-[18px]">
										{item.details}
									</p>
								</div>

								{#if item.diploma}
									<div
										class="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white"
									>
										<span class="icon-[lucide--file-badge-2] h-5 w-5"></span>
									</div>
								{/if}
							</svelte:element>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</AccordionItem>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />
