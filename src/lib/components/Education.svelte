<script lang="ts">
	import AccordionItem from './AccordionItem.svelte';
	import DiplomaModal from './DiplomaModal.svelte';
	import Reveal from './Reveal.svelte';

	let isModalOpen = $state(false);
	let selectedDiplomaIndex = $state(0);

	const educationItems = [
		{
			title: 'Прикладная математика и информатика',
			details: 'Тульский государственный университет, 2013 - 2019',
			completed: true
		},
		{
			title: 'Мастерство психологического консультирования',
			details: '500 часов, Психодемия, 2023 - 2024',
			diploma: '/mpk.webp',
			completed: true
		},
		{
			title: "Док Пси Фест'23",
			details: '7 дней, ноябрь 2023',
			diploma:
				'https://fs.getcourse.ru/fileservice/file/download/a/314400/sc/192/h/7fd890c0ac548933e83615abe2bb74b0.png?gcmes=47406609818',
			completed: true
		},
		{
			title: 'Конференция "Гештальт-мозаика"',
			details: '96 часов, январь 2024',
			diploma:
				'https://fs-thb03.getcourse.ru/fileservice/file/download/h/9c50da232eeca46c405bdee7a7db0133.png/s/800x/a/6110/sc/317',
			completed: true
		},
		{
			title: 'Introduction to Psychology',
			details: '14 часов, Yale University, март 2024',
			diploma: '/Coursera-YZHHWWXP725Z.webp',
			completed: true
		},
		{
			title: 'Док Пси Фест.Мини',
			details: '2 дня, март 2024',
			diploma:
				'https://fs-thb03.getcourse.ru/fileservice/file/download/h/eeb71b40751adfe0a4bb513aa3860807.png/s/800x/a/314400/sc/219',
			completed: true
		},
		{
			title: 'Когнитивно-поведенческая терапия',
			details: '262 часа, Психодемия, 2024',
			diploma: '/kpt.webp',
			completed: true
		},
		{
			title: "Док Пси Фест'24",
			details: '10 дней, сентябрь 2024',
			diploma:
				'https://fs.getcourse.ru/fileservice/file/download/h/91f91829bb6004b5256d88c4a330625b.png/s/800x/a/314400/sc/0',
			completed: true
		},
		{
			title: 'Когнитивно-поведенческая терапия: теория, стратегия, техники',
			details: '72 часа, Спб ИДПО для психологов и психотерапевтов, 2024',
			completed: true
		},
		{
			title:
				'V International Science and Practice Oriented Conference "CBT Approach in Counseling and Psychotherapy: Trends and Innovations in Research and Practice"',
			details: '3 дня, ноябрь 2024',
			diploma: '/Certificate-2024_8116415.webp',
			completed: true
		},
		{
			title: 'Теория Реляционных Фреймов',
			details: '11 часов, Чистые Когниции, 2025',
			diploma: '/rft.webp',
			completed: true
		},
		{
			title: "Док Пси Фест'25",
			details: '10 дней, июнь 2025',
			diploma:
				'https://fs.getcourse.ru/fileservice/file/download/a/314400/sc/191/h/170da841fe8af65927a03af2a2e238e7.png',
			completed: true
		},
		{
			title: 'Психология личности',
			details: 'РАНХиГС, 2025 - н.в.',
			completed: false
		},
		{
			title: 'ACT для всех',
			details: 'Академия Современной Психологии, 2025 - н.в.',
			completed: false
		},
		{
			title: 'Сексология',
			details: 'Академия Современной Психологии, 2025 - н.в.',
			completed: false
		}
	];

	const diplomas = $derived(
		educationItems.filter((item) => item.diploma).map((item) => ({
			imageUrl: item.diploma!,
			title: item.title
		}))
	);

	function openDiplomaModal(imageUrl: string) {
		const index = diplomas.findIndex((d) => d.imageUrl === imageUrl);
		selectedDiplomaIndex = index >= 0 ? index : 0;
		isModalOpen = true;
	}
</script>

<div class="w-full">
	<AccordionItem>
		{#snippet header()}
			<Reveal width="full" axis="x">
				<div class="subtitle">где я учился</div>
			</Reveal>
		{/snippet}
		{#snippet children()}
			<div class="grid grid-cols-1 gap-x-8 pl-[10px] lg:pl-[120px]">
				<div>
					<div class="relative pl-6">
						<!-- Vertical line -->
						<div
							class="absolute left-[2px] sm:left-[7px] md:left-[11px] lg:left-[17px] top-[10px] bottom-[calc(100%-22px)] border-l-2 border-[#F2F0EF] h-[96%]"
						></div>

						{#each educationItems as item}
							<div class="mb-8 relative lg:mb-10">
								<!-- Bullet point -->
								<div
									class="absolute -left-[39px] top-[10px] flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F0EF]"
								>
									{#if item.completed}
										<svg
											class="w-5 h-5"
											fill="none"
											stroke="black"
											viewBox="0 0 24 24"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="1.5" fill="black" />
											<circle cx="6" cy="12" r="1.5" fill="black" />
											<circle cx="18" cy="12" r="1.5" fill="black" />
										</svg>
									{/if}
								</div>
								<div class="ml-[15px]">
									{#if item.diploma}
										<button
											onclick={() => item.diploma && openDiplomaModal(item.diploma)}
											class="underline hover:no-underline font-medium text-left"
										>
											{item.title}
										</button>
									{:else}
										<p class={item.completed ? '' : 'font-medium'}>{item.title}</p>
									{/if}
									<p>{item.details}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/snippet}
	</AccordionItem>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />
