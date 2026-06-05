<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import DiplomaModal from '$lib/components/DiplomaModal.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { educationGroups } from '$lib/data/education';
	import { cn } from '$lib/utils';

	let { isOpen = false }: { isOpen?: boolean } = $props();
	let isModalOpen = $state(false);
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
			'Я регулярно почещаю профессиональные встречи и конференции — там психологи обсуждают новые исследования, разбирают сложные случаи и учатся друг у друга.',
		Остальное:
			'Образование, которое напрямую не связано с консультированием, но помогает в работе с людьми..'
	};

	const labelStyles = [
		'bg-primary text-bold text-white',
		'bg-lilac text-bold text-[#322d43]'
	];

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
	<AccordionItem {isOpen}>
		{#snippet header()}
			<Reveal width="full" axis="x">
				<div class="text-left">
					<div class="mb-11 flex items-center gap-4 md:gap-6">
					<h2 class="font-caveat text-4xl font-bold whitespace-nowrap text-navy md:text-[40px]">
						где я учился
					</h2>
					<span class="h-0.5 flex-1">
						<svg viewBox="0 0 600 22" preserveAspectRatio="none" class="block h-[22px] w-full" aria-hidden="true">
							<path d="M2 12 C200 6 400 16 598 10" stroke="var(--color-muted-foreground)" stroke-width="1.5" fill="none" stroke-linecap="round" />
						</svg>
					</span>
				</div>
					<p class="mt-3 max-w-[640px] text-[16px] lg:text-[19px] leading-relaxed text-foreground/55">
						Здесь можно посмотреть мои документы об образовании, если для вас это важно.
					</p>
				</div>
			</Reveal>
		{/snippet}

		<div class="pt-5 md:pt-7">
			{#each educationGroups as group, groupIndex}
				<div class="education-section {groupIndex > 0 ? 'mt-12' : 'mt-2'}">
					<div class="flex items-end justify-between pl-4 {categoryExplanations[group.category] ? 'mb-3' : 'mb-6'}">
						<span class="inline-block rounded-full px-4.5 py-1.5 text-[16px] lg:text-[19px] font-bold {labelStyles[groupIndex % labelStyles.length]}">
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
						<p class="mb-6 max-w-[700px] pr-20 pl-4 text-[16px] lg:text-[19px] leading-relaxed text-foreground/60">
							{categoryExplanations[group.category]}
						</p>
					{/if}

					<div
						class="education-carousel my-scroll flex w-full snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto pt-2 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin] md:[scrollbar-color:var(--color-primary)_var(--color-background)] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-background md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-primary/70 md:hover:[&::-webkit-scrollbar-thumb]:bg-primary"
						onwheel={handleWheelScroll}
					>
						{#each group.items as item, idx}
							<svelte:element
								this={item.diploma ? 'button' : 'div'}
								onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
								class={cn(
									'group relative flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col justify-between rounded-[18px] border p-6 text-left transition-all duration-300 md:p-7',
									item.diploma
										? 'border-navy/10 bg-[#fdfaf3] hover:cursor-pointer hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] focus:outline-primary focus-visible:outline-primary outline-0'
										: 'border-navy/10 bg-background',
									{ 'ml-4': idx === 0, 'mr-4': idx === group.items.length - 1 }
								)}
							>
								<div class="relative z-10 flex w-full flex-col">
									{#if !item.completed}
										<span class="t-badge" data-open="true">
											<span class="t-badge-dot h-2 w-2 rounded-full bg-primary"></span>
										</span>
										<span class="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-card px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-foreground/60 uppercase">
											В процессе
										</span>
									{/if}

									<h5 class={cn('text-[16px] lg:text-[19px] leading-snug font-bold text-navy transition-colors', { 'group-hover:text-primary': item.diploma })}>
										{item.title}
									</h5>
									<p class="mt-3 text-[16px] lg:text-[19px] leading-relaxed text-foreground/60">{item.details}</p>
								</div>

								{#if item.diploma}
									<div class="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
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
