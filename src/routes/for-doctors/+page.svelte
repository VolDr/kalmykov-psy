<script lang="ts">
	import { resolve } from '$app/paths';
	import ImageWithShadow from '#lib/components/ImageWithShadow.svelte';
	import MarkdownLink from '#lib/components/MarkdownLink.svelte';
	import Reveal from '#lib/components/Reveal.svelte';
	import SectionHeading from '#lib/components/SectionHeading.svelte';
	import EducationNew from '#lib/components/sections/EducationNew.svelte';
	import {
		communicationPosition,
		contactLinks,
		contactNote,
		doctorBenefits,
		intro,
		outOfScope,
		pharmacotherapyPosition,
		practiceNotes,
		requestGroups
	} from '#lib/data/forDoctors.js';

	const container = 'mx-auto px-5 md:max-w-[760px] lg:max-w-[1200px] xl:px-0';
	const rule = 'border-[#e4dccb]';
	const bullet =
		"relative pl-5.5 before:absolute before:top-[0.7em] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']";
</script>

<svelte:head>
	<title>Совместная работа психолога и психиатра | Андрей Калмыков</title>

	<meta
		name="description"
		content="Психолог Андрей Калмыков (КПТ, ACT). Совместная работа с врачами-психиатрами: повышение приверженности лечению, поддержка пациентов с депрессией и тревожными расстройствами."
	/>

	<meta property="og:title" content="Совместная работа психолога и психиатра | Андрей Калмыков" />
	<meta
		property="og:description"
		content="Поддержка пациентов на всех этапах терапии. Повышение комплаентности, улучшение коммуникации и эффективности медикаментозного лечения."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{import.meta.env.VITE_URL}/for-doctors" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Совместная работа психолога и психиатра | Андрей Калмыков" />
	<meta
		name="twitter:description"
		content="Психолог КПТ/ACT. Совместная работа с психиатрами для поддержки пациентов с депрессивной и тревожной симптоматикой."
	/>
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />
</svelte:head>

<!-- ═══════════════════ ГЕРОЙ ═══════════════════ -->
<section class="bg-background pt-24 lg:pt-32">
	<div
		class="{container} grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-20"
	>
		<Reveal width="full">
			<div class="flex flex-col">
				<h1
					class="mb-7 font-caveat text-[44px] leading-[1.15] font-bold tracking-[0.5px] text-balance text-navy md:text-[52px] lg:text-[64px]"
				>
					Психотерапия для ваших пациентов, в дополнение к лечению
				</h1>
				<p class="mb-9 max-w-[540px] text-lg leading-relaxed text-foreground/75 md:text-[19px]">
					КПТ и ACT для взрослых с депрессией и тревожными расстройствами. Работаю с самим
					расстройством по доказательным протоколам и согласую терапию с вашим лечением.
				</p>
				<a
					href="#contacts"
					class="w-fit text-[17px] font-semibold text-navy underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
				>
					Контакты
				</a>
			</div>
		</Reveal>

		<Reveal width="full">
			<ImageWithShadow
				src="/2.webp"
				srcSmall="/2_small.webp"
				srcSmall1x="/2_small_1x.webp"
				alt="Андрей Калмыков, психолог"
				shadowPosition="bottom-left"
				imgClass="h-[420px] w-full max-w-[360px] rounded-[22px] sm:max-w-[420px] lg:h-[520px]"
				shadowClass="bg-lilac"
				width={420}
				height={520}
			/>
		</Reveal>
	</div>
</section>

<!-- ═══════════════════ О СЕБЕ И ФОРМАТ ═══════════════════ -->
<section class="bg-background pt-20 md:pt-24">
	<div
		class="{container} grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20"
	>
		<Reveal width="full">
			<div
				class="flex max-w-[680px] flex-col gap-5 text-[16px] leading-relaxed text-foreground/80 lg:text-[18px]"
			>
				{#each intro as paragraph (paragraph)}
					<p><MarkdownLink text={paragraph} /></p>
				{/each}
			</div>
		</Reveal>

		<Reveal width="full">
			<div>
				<h3 class="mb-4 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
					Организационные моменты
				</h3>
				<ul class="flex flex-col gap-3">
					{#each practiceNotes as note (note)}
						<li class="{bullet} text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
							{note}
						</li>
					{/each}
				</ul>
			</div>
		</Reveal>
	</div>
</section>

<!-- ═══════════════════ ПРИНЦИПЫ И ГРАНИЦЫ ═══════════════════ -->
<section class="bg-background pt-20 md:pt-28">
	<div class={container}>
		<Reveal>
			<SectionHeading class="mb-12 md:mb-14">
				принципы взаимодействия и границы компетенций
			</SectionHeading>
		</Reveal>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-8">
			<Reveal width="full" class="h-full">
				<div class="h-full rounded-[28px] bg-lilac px-7 py-8 lg:px-9 lg:py-9">
					<h3 class="mb-4 font-caveat text-[28px] leading-tight font-bold text-navy lg:text-[32px]">
						Позиция по фармакотерапии
					</h3>
					<p class="text-[16px] leading-relaxed text-[#4a3f6b] lg:text-[18px]">
						<MarkdownLink text={pharmacotherapyPosition} />
					</p>
				</div>
			</Reveal>
			<Reveal width="full" class="h-full">
				<div class="h-full rounded-[28px] bg-card px-7 py-8 lg:px-9 lg:py-9">
					<h3 class="mb-4 font-caveat text-[28px] leading-tight font-bold text-navy lg:text-[32px]">
						Коммуникация и мониторинг
					</h3>
					<p class="text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
						{communicationPosition}
					</p>
				</div>
			</Reveal>
		</div>
	</div>
</section>

<!-- ═══════════════════ ЧЕМ ПОЛЕЗЕН ВРАЧУ ═══════════════════ -->
<section class="bg-background pt-20 md:pt-28">
	<div class={container}>
		<Reveal>
			<SectionHeading class="mb-12 md:mb-14">какие проблемы я помогаю решить врачу</SectionHeading>
		</Reveal>

		<ol class="border-b {rule}">
			{#each doctorBenefits as benefit, i (benefit.title)}
				<li
					class="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 border-t py-6 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1.25fr)] md:gap-x-8 lg:py-8 {rule}"
				>
					<span
						class="font-caveat text-[34px] leading-none font-bold text-primary lg:text-[44px]"
						aria-hidden="true">{String(i + 1).padStart(2, '0')}</span
					>
					<h3 class="text-[18px] leading-snug font-extrabold text-navy md:pt-1 lg:text-[20px]">
						{benefit.title}
					</h3>
					<p
						class="col-start-2 mt-2 text-[16px] leading-relaxed text-foreground/70 md:col-start-3 md:mt-0 md:pt-1 lg:text-[18px]"
					>
						{benefit.text}
					</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- ═══════════════════ ЗАПРОСЫ ═══════════════════ -->
<section class="bg-background pt-20 md:pt-28">
	<div class={container}>
		<Reveal>
			<SectionHeading class="mb-12 md:mb-14">
				основные группы запросов для совместной работы
			</SectionHeading>
		</Reveal>

		<div class="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2 lg:gap-x-20">
			{#each requestGroups as group (group.title)}
				<Reveal width="full">
					<div class="border-t pt-6 {rule}">
						<h3 class="mb-4 text-[18px] leading-snug font-extrabold text-navy lg:text-[20px]">
							{group.title}
						</h3>
						<ul class="flex flex-col gap-2.5">
							{#each group.points as point (point)}
								<li class="{bullet} text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]">
									{point}
								</li>
							{/each}
						</ul>
					</div>
				</Reveal>
			{/each}
		</div>

		<Reveal width="full">
			<div
				class="mt-14 grid grid-cols-1 gap-5 rounded-[24px] bg-card px-7 py-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:gap-12 lg:px-9"
			>
				<h3
					class="font-caveat text-[28px] leading-tight font-bold text-navy md:whitespace-nowrap lg:text-[32px]"
				>
					С чем я не работаю
				</h3>
				<ul class="grid grid-cols-1 gap-x-10 gap-y-2.5 sm:grid-cols-2 md:pt-1.5">
					{#each outOfScope as item (item)}
						<li
							class="flex items-start gap-3 text-[16px] leading-relaxed text-foreground/75 lg:text-[18px]"
						>
							<span
								class="mt-[0.4em] icon-[lucide--x] h-4 w-4 shrink-0 text-foreground/35"
								aria-hidden="true"
							></span>
							{item}
						</li>
					{/each}
				</ul>
			</div>
		</Reveal>
	</div>
</section>

<!-- ═══════════════════ ОБРАЗОВАНИЕ ═══════════════════ -->
<section class="bg-background pt-16 md:pt-20">
	<div class="mx-auto md:max-w-[760px] lg:max-w-[1200px]">
		<EducationNew />
	</div>
</section>

<!-- ═══════════════════ КОНТАКТЫ ═══════════════════ -->
<section class="scroll-mt-24 bg-background pt-20 pb-24 md:pt-28 md:pb-32" id="contacts">
	<div class={container}>
		<Reveal width="full">
			<div class="mb-12 text-center md:mb-14">
				<SectionHeading>как со мной связаться</SectionHeading>
			</div>
		</Reveal>

		<Reveal width="full">
			<div
				class="mx-auto max-w-[760px] rounded-[24px] bg-card px-7 py-8 text-center md:px-12 md:py-10"
			>
				<p class="text-[17px] leading-relaxed font-medium text-foreground lg:text-[18px]">
					{contactNote}
				</p>
				<!-- Контакты внешние (t.me, WhatsApp), resolve() к ним неприменим -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<ul
					class="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10"
				>
					{#each contactLinks as link (link.href)}
						<li>
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex min-h-11 items-center gap-2.5 text-[16px] font-semibold text-navy transition-colors hover:text-primary"
							>
								<span class="{link.icon} h-5 w-5 text-primary" aria-hidden="true"></span>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<p class="mt-4 text-[15px] leading-relaxed text-foreground/65">
					<a
						href={resolve('/online-therapy')}
						class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition-colors hover:text-primary"
						>Условия работы для клиентов</a
					>
				</p>
			</div>
		</Reveal>
	</div>
</section>
