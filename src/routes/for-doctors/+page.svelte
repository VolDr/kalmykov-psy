<script lang="ts">
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';

	// Исправлена опечатка "с с врачом"
	export const items = [
		{
			highlight: 'снижение риска преждевременного прекращения терапии',
			text: 'Совместная работа с врачом и психологическая поддержка помогают клиенту чувствовать себя увереннее, видеть смысл в лечении и продолжать его до достижения ремиссии.',
			gridClass: 'col-span-1 md:col-span-24'
		},
		{
			highlight: 'рост удовлетворённости лечением',
			text: 'Я вовлекаю клиента в процесс, информирую о ходе терапии, валидирую его переживания и помогаю справляться с побочными эффектами на ранних этапах.',
			gridClass: 'col-span-1 md:col-span-10'
		},
		{
			highlight: 'улучшение коммуникации',
			text: 'Организую обмен информацией между клиентом и врачом. При согласии пациента предоставляю обратную связь о динамике состояния, сне и уровне тревоги.',
			gridClass: 'col-span-1 md:col-span-14'
		},
		{
			highlight: 'повышение эффективности медикаментозного лечения',
			text: 'Работаю над комплаенсом, мотивацией и поведенческой активацией, что улучшает отклик на фармакотерапию.',
			gridClass: 'col-span-1 md:col-span-14'
		},
		{
			highlight: 'разъяснение назначений и психообразование',
			text: 'Помогаю клиенту понять цели терапии, объясняю логику назначений и нормализую сам факт лечения.',
			gridClass: 'col-span-1 md:col-span-10'
		}
	];

	type RequestGroup = {
		theme: string;
		gridClass: string;
		points: string[];
	};

	// Убрана дублирующаяся агорафобия, заголовки с большой буквы
	const requestGroups: RequestGroup[] = [
		{
			theme: 'Неклинические и субклинические состояния',
			gridClass: 'md:col-span-1',
			points: [
				'хроническая усталость и выгорание',
				'прокрастинация, проблемы с самоорганизацией',
				'перфекционизм, жесткая самокритика',
				'трудности в межличностной коммуникации',
				'нарушения гигиены сна'
			]
		},
		{
			theme: 'депрессия и родственные состояния',
			gridClass: 'md:col-span-1',
			points: [
				'депрессивный эпизод',
				'рекуррентное депрессивное расстройство',
				'дистимия',
			]
		},
		{
			theme: 'Фобические и тревожные расстройства',
			gridClass: 'md:col-span-1',
			points: [
				'социальная фобия',
				'агорафобия',
				'другие фобические тревожные расстройства',
				'навязчивые мысли, руминации, катастрофизация'
			]
		},
		{
			theme: 'Другие тревожные расстройства',
			gridClass: 'md:col-span-1',
			points: [
				'паническое расстройство',
				'генерализованное тревожное расстройство',
				'обсессивно-компульсивное расстройство'
			]
		}
	];
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

<PageHero
	title="Эффективное взаимодействие психолога с врачом"
	description="Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения"
/>

<div class="relative mt-8 flex w-full flex-col gap-14.5 overflow-x-hidden md:gap-24.5 lg:mt-0">
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:mt-10 lg:max-w-[1200px] lg:gap-y-0"
	>
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src="/1.webp"
				srcSmall="/1_small.webp"
				alt="Андрей"
				shadowPosition="bottom-left"
				imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
				width={505}
				height={720}
			/>
		</div>

		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div
				class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8"
			>
				<div
					class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-4 lg:gap-6"
				>
					<p>
						Меня зовут Андрей Калмыков, я практикующий психолог. Работаю в научно-обоснованных
						подходах: <b>Когнитивно-поведенческая терапия (CBT)</b> и
						<b>Терапия принятия и ответственности (ACT)</b>.
					</p>
					<p>
						Современные исследования показывают, что интеграция психотерапии параллельно с
						фармакотерапией позволяет добиться более стойкой ремиссии, снизить риски обострений и
						повысить удовлетворенность пациентов качеством жизни.
					</p>
					<p>
						Партнерство с психологом освобождает врача от необходимости контролировать все аспекты
						поведения и мотивации пациента, помогая сфокусироваться на подборе схемы лечения и
						клинических задачах.
					</p>
							<div class="flex flex-col gap-2 rounded-lg bg-[#F2F0EF] p-4 text-sm md:p-6 md:text-base">
						<p class="font-semibold text-[#191919]">Организационные моменты:</p>
						<ul class="ml-4 list-disc space-y-1 list-none ">
							<li>Работаю со взрослыми клиентами (18+).</li>
							<li>Формат: онлайн (видеосвязь).</li>
							<li>Регулярность: один раз в неделю.</li>
							<li>
								При подозрении на клиническое расстройство всегда рекомендую консультацию врача.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div
		class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h2 class="px-6 text-center subtitle md:px-0 md:text-left">
			Принципы взаимодействия и границы компетенций
		</h2>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0 lg:gap-8">
			<div class="rounded-lg bg-[#F2F0EF] p-6 md:p-8">
				<h3 class="mb-4 text-lg font-semibold text-[#191919]">Позиция по фармакотерапии</h3>
				<p class="leading-relaxed">
					Я строго придерживаюсь профессиональных границ: <b>не назначаю, не отменяю и не корректирую
					медикаментозное лечение</b>. Моя задача — поддерживать приверженность назначенной вами
					терапии, работать с убеждениями пациента относительно лекарств и помогать адаптироваться к
					процессу лечения.
				</p>
			</div>
			<div class="rounded-lg bg-[#F2F0EF] p-6 md:p-8">
				<h3 class="mb-4 text-lg font-semibold text-[#191919]">Коммуникация и мониторинг</h3>
				<p class="leading-relaxed">
					Эффективная помощь — это командная работа. По согласованию с пациентом я готов
					информировать лечащего врача о динамике состояния (фон настроения, сон, тревога) и
					изменениях в поведении, чтобы вы могли своевременно корректировать тактику лечения. В работе использую валидизированные шкалы и опросники.
				</p>
			</div>
		</div>
	</div>

	<div
		class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h2 class="px-6 text-center subtitle md:px-0 md:text-left">
			какие проблемы я помогаю решить врачу
		</h2>

		<div
			class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24"
		>
			{#each items as item}
				<div class={item.gridClass}>
					<div
						class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6"
					>
						<div>
							<h3 class="text-lg font-semibold text-[#191919]">{item.highlight}</h3>
						</div>
						<p class="leading-relaxed text-[#191919] mt-2">{item.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="m-auto flex max-w-[720px] flex-col items-center gap-6 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<div class="flex flex-col items-center gap-4 px-6 md:items-start md:px-0">
			<h2 class="text-center subtitle md:text-left">
				Основные группы запросов для совместной работы
			</h2>

		</div>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
			{#each requestGroups as group}
				<div class="{group.gridClass} min-h-[220px]">
					<div
						class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6"
					>
						<div class="mb-4 flex items-center gap-3">
							<h3 class="text-lg font-semibold text-[#191919]">{group.theme}</h3>
						</div>

						<ul
							class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5 list-none"
						>
							{#each group.points as point}
								<li class="flex items-start gap-3">
							—
									<div>
										<div class="reveal-root w-fit">
											<p>{point}</p>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="mx-auto mt-6 flex max-w-[720px] flex-col items-center gap-6 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h2 class="subtitle">С чем я не работаю</h2>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-1 md:px-0">
			<div
				class="w-full max-w-[720px] rounded-lg bg-[#F2F0EF] px-5 py-6 md:max-w-[960px] md:px-8 md:py-8 lg:max-w-[600px]"
			>
				<ul class="flex flex-col gap-2.5">
					<li>— Расстройства пищевого поведения</li>
					<li>— Биполярное аффективное расстройство</li>
					<li>— РАС, СДВГ</li>
					<li>— Шизофрения, большая психиатрия</li>
				</ul>
			</div>
		</div>
	</div>

	<div
		class="col-span-1 mx-auto mt-8 flex w-full max-w-[720px] flex-col items-stretch gap-2.5 px-5 md:col-span-1 md:max-w-[960px] md:gap-14.5 lg:max-w-[1200px]"
	>
		<div class="w-full">
			<Education isOpen={true} />
		</div>

		<div class="mt-6 mb-10 flex w-full flex-col items-center gap-2.5 md:gap-3.5">
			<h2 class="subtitle">Как со мной связаться</h2>

			<div
				class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-lg bg-[#F2F0EF] px-6 py-6 md:px-8 md:py-8"
			>
				<div class="flex flex-col gap-3">
					<p>
						Буду рад профессиональному знакомству. Вы можете рекомендовать меня своим пациентам или написать мне напрямую для обсуждения вариантов сотрудничества.
					</p>
				</div>

				<ul class="flex flex-col gap-3 mt-2">
					<li class="flex items-center gap-3">
						<span class="icon-[lucide--phone] h-5 w-5 text-[#B8A98A]"></span>
						<span
							><MarkdownLink
								text="
						[+7 906 534-82-41](https://api.whatsapp.com/send?phone=79065378241)  
				"
							/></span
						>
					</li>
					<li class="flex items-center gap-3">
						<span class="icon-[lucide--message-circle] h-5 w-5 text-[#B8A98A]"></span>
						<span
							><MarkdownLink
								text=" 
						[t.me/psy_kalmykov](https://t.me/psy_kalmykov)."
							/></span
						>
					</li>
					<MarkdownLink
						text="
						[Условия работы для клиентов](https://kalmykov-psy.ru/online-therapy)"
					/>
				</ul>
			</div>
		</div>
	</div>
</div>