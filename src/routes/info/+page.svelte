<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import DiplomaModal from '$lib/components/DiplomaModal.svelte';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import { educationGroups } from '$lib/data/education';
	import { cn } from '$lib/utils';

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

	function openDiplomaModal(imageUrl: string) {
		const index = diplomas.findIndex((d) => d.imageUrl === imageUrl);
		selectedDiplomaIndex = index >= 0 ? index : 0;
		isModalOpen = true;
	}

	const topics = [
		{
			title: 'выгорание и истощение',
			items: [
				'Работаете на износ, а выходные не восстанавливают',
				'Рабочий день не заканчивается — вы всё ещё на связи и сами не знаете зачем',
				'Всё кажется бессмысленным — делаете, потому что надо'
			]
		},
		{
			title: 'работа и самореализация',
			items: [
				'Прокрастинация, синдром самозванца, ощущение что недостаточно стараетесь',
				'Перфекционизм и страх ошибки, которые мешают двигаться',
				'Старая работа перестала зажигать, но непонятно куда двигаться'
			]
		},
		{
			title: 'эмоции и состояние',
			items: [
				'Тревога, которая не отпускает — фоновая или острая',
				'Не можете отдыхать без чувства вины',
				'Говорите «да», когда хотите сказать «нет»'
			]
		},
		{
			title: 'смыслы и ощущение жизни',
			items: [
				'Живёте от дедлайна к дедлайну — жизнь проходит мимо',
				'Хочется понять, что происходит, но сил разбираться тоже нет',
				'Непонятно, чего хотите и что вам важно'
			]
		}
	];

	const mainDiplomas = educationGroups
		.filter((g) => g.category === 'Основное образование' || g.category === 'Подходы')
		.flatMap((g) => g.items)
		.filter((item) => item.completed || !item.completed);

	const allDiplomaItems = educationGroups
		.flatMap((g) => g.items.map((item) => ({ ...item, category: g.category })))
		.filter((item) => item.diploma);
</script>

<svelte:head>
	<title>О психологе: с чем работаю, образование, стоимость | Андрей Калмыков</title>
	<meta
		name="description"
		content="С чем работает психолог Андрей Калмыков: выгорание, тревога, прокрастинация. Дипломы и документы об образовании. Стоимость консультаций."
	/>
</svelte:head>

<div class="mx-auto max-w-[760px] px-5 pb-20 pt-28 xl:px-0">

	<!-- БЛОК 1: С чем работаю -->
	<Reveal width="full">
		<div class="mb-3 flex items-center gap-4">
			<h1 class="font-caveat text-[36px] font-bold text-navy lg:text-[45px]">с чем работаю</h1>
			<span class="h-0.5 flex-1">
				<svg viewBox="0 0 600 22" preserveAspectRatio="none" class="block h-[22px] w-full" aria-hidden="true">
					<path d="M2 12 C200 6 400 16 598 10" stroke="var(--color-muted-foreground)" stroke-width="1.5" fill="none" stroke-linecap="round" />
				</svg>
			</span>
		</div>
		<p class="mb-8 text-[16px] leading-relaxed text-foreground/60 lg:text-[18px]">
			Работаю с профессионалами цифровых профессий — IT, маркетинг, управление. Методы: КПТ и ACT (доказательные подходы).
		</p>
	</Reveal>

	<div class="mb-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
		{#each topics as topic, i}
			<Reveal width="full">
				<div class="rounded-[18px] border border-navy/10 bg-card p-6">
					<div class="mb-4 flex items-center gap-2.5">
						<span class="font-caveat text-[26px] font-bold leading-none text-primary">0{i + 1}</span>
						<h2 class="text-[16px] font-extrabold leading-snug text-navy lg:text-[18px]">{topic.title}</h2>
					</div>
					<ul class="flex flex-col gap-2.5">
						{#each topic.items as item}
							<li class="relative pl-5 text-[15px] leading-relaxed text-foreground/70 before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-[''] lg:text-[16px]">
								{item}
							</li>
						{/each}
					</ul>
				</div>
			</Reveal>
		{/each}
	</div>

	<!-- БЛОК 2: Образование и дипломы -->
	<Reveal width="full">
		<div class="mb-3 flex items-center gap-4">
			<h2 class="font-caveat text-[36px] font-bold text-navy lg:text-[45px]">образование</h2>
			<span class="h-0.5 flex-1">
				<svg viewBox="0 0 600 22" preserveAspectRatio="none" class="block h-[22px] w-full" aria-hidden="true">
					<path d="M2 12 C200 6 400 16 598 10" stroke="var(--color-muted-foreground)" stroke-width="1.5" fill="none" stroke-linecap="round" />
				</svg>
			</span>
		</div>
		<p class="mb-8 text-[16px] leading-relaxed text-foreground/60 lg:text-[18px]">
			Карточки с документом — кликабельны, можно посмотреть скан диплома.
		</p>
	</Reveal>

	<div class="mb-14 flex flex-col gap-10">
		{#each educationGroups as group}
			{#if group.items.some((item) => item.diploma || !item.completed)}
				<div>
					<span class="mb-4 inline-block rounded-full bg-primary px-4 py-1 text-[14px] font-bold text-white">
						{group.category}
					</span>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each group.items as item}
							<Reveal width="full">
								<svelte:element
									this={item.diploma ? 'button' : 'div'}
									onclick={item.diploma ? () => openDiplomaModal(item.diploma!) : undefined}
									class={cn(
										'group flex w-full items-start gap-4 rounded-[14px] border p-4 text-left transition-all duration-200',
										item.diploma
											? 'border-navy/10 bg-[#fdfaf3] hover:cursor-pointer hover:border-primary/50 hover:shadow-sm focus:outline-primary'
											: 'border-navy/8 bg-background'
									)}
								>
									<div class="flex-1">
										{#if !item.completed}
											<span class="mb-1.5 inline-block rounded-md bg-card px-2 py-0.5 text-[10px] font-bold tracking-wider text-foreground/50 uppercase">В процессе</span>
										{/if}
										<p class={cn('text-[15px] font-bold leading-snug text-navy lg:text-[16px]', { 'group-hover:text-primary': item.diploma })}>
											{item.title}
										</p>
										<p class="mt-1 text-[13px] leading-relaxed text-foreground/55 lg:text-[14px]">{item.details}</p>
									</div>
									{#if item.diploma}
										<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white">
											<span class="icon-[lucide--file-badge-2] h-4 w-4"></span>
										</div>
									{/if}
								</svelte:element>
							</Reveal>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- БЛОК 3: Стоимость -->
	<Reveal width="full">
		<div class="mb-3 flex items-center gap-4">
			<h2 class="font-caveat text-[36px] font-bold text-navy lg:text-[45px]">стоимость</h2>
			<span class="h-0.5 flex-1">
				<svg viewBox="0 0 600 22" preserveAspectRatio="none" class="block h-[22px] w-full" aria-hidden="true">
					<path d="M2 12 C200 6 400 16 598 10" stroke="var(--color-muted-foreground)" stroke-width="1.5" fill="none" stroke-linecap="round" />
				</svg>
			</span>
		</div>
		<p class="mb-7 text-[16px] leading-relaxed text-foreground/60 lg:text-[18px]">
			Индивидуальные консультации онлайн. Одна встреча — 50 минут.
		</p>
	</Reveal>

	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
		<Reveal width="full">
			<div class="flex h-full flex-col rounded-[22px] border border-navy/12 bg-[#fdfaf3] p-6">
				<h3 class="font-caveat text-[30px] font-bold text-navy">Разовая сессия</h3>
				<div class="mt-1.5 text-[20px] font-extrabold text-navy">4 000 ₽</div>
				<p class="mt-4 text-[15px] leading-relaxed text-foreground/70 lg:text-[16px]">
					Разобраться в конкретной ситуации или познакомиться с подходом.
				</p>
				<ul class="mt-4 flex flex-col gap-2 text-[14px] text-foreground/70">
					<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-primary"></span>50 минут</li>
					<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Онлайн</li>
				</ul>
				<div class="mt-auto flex justify-center pt-6">
					<ButtonSvg variant="1" href="/booking" mobileHeight="55px" width="220px" height="60px">Записаться</ButtonSvg>
				</div>
			</div>
		</Reveal>

		<Reveal width="full">
			<div class="relative flex h-full flex-col rounded-[22px] bg-navy p-6 text-white">
				<span class="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold tracking-[0.07em] text-navy uppercase">
					Рекомендуемый формат
				</span>
				<h3 class="font-caveat text-[30px] font-bold text-white">Регулярные встречи</h3>
				<div class="mt-1.5 flex items-baseline gap-2">
					<span class="text-[20px] font-extrabold">14 000 ₽</span>
					<span class="text-[15px] text-white/55">/ 4 сессии</span>
				</div>
				<p class="mt-4 text-[15px] leading-relaxed text-white/75 lg:text-[16px]">
					Для устойчивых изменений, а не временного облегчения.
				</p>
				<ul class="mt-4 flex flex-col gap-2 text-[14px] text-white/85">
					<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Система трекинга прогресса</li>
					<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Обратная связь по сессиям</li>
					<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-primary"></span>Онлайн, гибкое расписание</li>
				</ul>
				<div class="mt-auto flex justify-center pt-6">
					<ButtonSvg variant="4" href="/booking?type=package" mobileHeight="55px" width="220px" height="60px">Записаться</ButtonSvg>
				</div>
			</div>
		</Reveal>
	</div>
</div>

<DiplomaModal bind:isOpen={isModalOpen} {diplomas} initialIndex={selectedDiplomaIndex} />
