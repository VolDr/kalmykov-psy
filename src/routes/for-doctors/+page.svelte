<script lang="ts">
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';

	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import { parseMarkdownLinks } from '$lib/utils/markdown';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';

	export const items = [
		{
			highlight: 'снижение преждевременного прекращения терапии',
			text: 'Совместная работа с с врачом, врачом-психиатром и психологическая поддержка помогают клиенту чувствовать себя увереннее, видеть смысл в лечении и продолжать его.',
			gridClass: 'col-span-1 md:col-span-24'
		},
		{
			highlight: 'рост удовлетворённости лечением',
			text: 'Психолог вовлекает клиента в процесс, информирует о ходе терапии, отвечает на вопросы и помогает принимать решения.',
			gridClass: 'col-span-1 md:col-span-10'
		},
		{
			highlight: 'улучшение коммуникации между всеми участниками процесса',
			text: 'Психолог организует обмен информацией между клиентом, врачом, врачом-психиатром и другими специалистами, согласует цели и этапы терапии.',
			gridClass: 'col-span-1 md:col-span-14'
		},
		{
			highlight: 'повышение эффективности медикаментозного лечения',
			text: 'Психолог отслеживает реакцию клиента, поддерживает мотивацию и комплаентность, что улучшает результаты фармакотерапии.',
			gridClass: 'col-span-1 md:col-span-14'
		},
		{
			highlight: 'разъяснение назначений и рекомендаций',
			text: 'Психолог помогает клиенту понять цели и логику терапии, объясняет, зачем назначаются те или иные методы.',
			gridClass: 'col-span-1 md:col-span-10'
		}
	];

	type RequestGroup = {
		theme: string;
		gridClass: string;
		points: string[];
	};

	const requestGroups: RequestGroup[] = [
		{
			theme: 'неклинические и субклинические состояния',
			gridClass: 'md:col-span-1',
			points: [
				'усталость',
				'прокрастинация, самосаботаж',
				'перфекционизм, самокритика, страх ошибок',
				'проблемы с коммуникацией',
				'эмоциональное выгорание',
				'проблемы со сном, бессонница'
			]
		},
		{
			theme: 'депрессия и родственные состояния',
			gridClass: 'md:col-span-1',
			points: [
				'депрессивный эпизод',
				'рекуррентное депрессивное расстройство',
				'хронические расстройства настроения',
				'поддержка приверженности фармакотерапии'
			]
		},
		{
			theme: 'фобические тревожные расстройства',
			gridClass: 'md:col-span-1',
			points: [
				'социальные фобии',
				'агорафобия',
				'другие фобические тревожные расстройства',
				'навязчивые тревожные мысли, катастрофизация',
				'агорафобия'
			]
		},
		{
			theme: 'другие тревожные расстройства',
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
		content="Психолог Андрей Калмыков (КПТ, ACT). Совместная работа с врачами-психиатрами: повышение приверженности лечению, поддержка пациентов с депрессией и тревожными расстройствами, улучшение эффективности терапии."
	/>

	<meta property="og:title" content="Совместная работа психолога и психиатра | Андрей Калмыков" />
	<meta
		property="og:description"
		content="Поддержка пациентов на всех этапах терапии. Повышение комплаентности, улучшение коммуникации и эффективности медикаментозного лечения."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/header.webp" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Совместная работа психолога и психиатра | Андрей Калмыков" />
	<meta
		name="twitter:description"
		content="Психолог КПТ/ACT. Совместная работа с психиатрами для поддержки пациентов с депрессивной и тревожной симптоматикой."
	/>
	<meta name="twitter:image" content="/header.webp" />
</svelte:head>


<section data-hero class="relative min-h-[30vh] overflow-hidden bg-cover bg-center text-gray-100">
	<HeroBackground />
	<div
		class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<!-- Mobile layout -->
	<div class="container mx-auto mt-10 max-w-[720px] px-5 lg:max-w-[960px] lg:px-0">
		<div
			class="relative z-10 mx-auto mt-[10vh] mb-4 min-h-[100px] max-w-[960px] pt-[63px] lg:hidden"
		>
			<h1 class="self-end font-circe text-3xl">Эффективное взаимодействие психолога с врачом</h1>
		</div>
		<div class="relative z-10 -mt-2 mb-5 flex flex-col gap-2 lg:hidden">
			<p class="col-start-1 col-end-6 row-start-5 row-end-7 text-left">
				Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения
			</p>
		</div>
	</div>

	<!-- Desktop layout -->
	<div
		class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px] grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14 leading-relaxed lg:grid lg:max-w-[1200px]"
	>
		<div class="col-start-1 col-end-12 row-start-5 row-end-12">
			<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">
				Эффективное взаимодействие психолога с врачом
			</h1>
		</div>

		<div
			class="lg:text-md col-start-1 col-end-12 row-start-9 row-end-11 flex flex-col gap-4 text-base"
		>
			<p class="mx-auto text-center lg:mx-0 lg:text-left">
		Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения
			</p>
		</div>
	</div>
</section>

<div class="w-full flex flex-col gap-8.5 md:gap-10.5 relative mt-8 lg:mt-0 overflow-x-hidden">
	<!-- Hero: мотивация сотрудничества -->
	<div
		class="max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-y-8.5 lg:gap-y-0 items-center lg:my-10"
	>
		<!-- Image 1 -->
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6">
			<ImageWithShadow
				src="/1.webp"
				srcSmall="/1_small.webp"
				alt="Андрей"
				shadowPosition="bottom-left"
				imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
			/>
		</div>

		<!-- Text 1: мотивация -->
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6">
			<div class="min-h-[50px] flex flex-col flex-nowrap gap-4 lg:gap-8 items-center justify-start">
				<div
					class="container mx-auto flex flex-col flex-nowrap gap-2 lg:gap-4 items-center justify-start"
				>
					<p>Меня зовут Андрей Калмыков, я психолог, работаю в подходах КПТ и ACT.</p>
					<p>
						Веду индивидуальную терапию для взрослых, преимущественно с депрессивной и тревожной
						симптоматикой, хроническим стрессом и профессиональным выгоранием. Работаю в связке с
						психиатрами, обеспечивая пациенту согласованный план помощи.
					</p>
					<p>
						Эффективная помощь людям с психическими расстройствами — это всегда командная работа
						врача и психолога.
					</p>
					<p>
						Современные исследования и практика показывают, что интеграция психотерапии параллельно
						с фармакотерапией позволяет добиться более стойкой ремиссии, снизить риски обострений и
						повысить удовлетворенность пациентов от помощи.
					</p>
					<p>
						Партнерство с психологом освобождает врача от необходимости контролировать все аспекты
						поведения и мотивации пациента, помогая сфокусироваться на клинических задачах.
					</p>
				</div>
			</div>
		</div>
	</div>

	<div
		class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h3 class="subtitle text-center md:text-left px-6 md:px-0">
			какие проблемы психологи помогают решить врачам
		</h3>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24">
			{#each items as item}
				<div class={item.gridClass}>
					<div class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6">
						<div>
							<h4 class="text-lg font-semibold text-[#191919]">{item.highlight}</h4>
						</div>
						<p class="leading-relaxed text-[#191919]">{item.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="m-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h3 class="subtitle text-center md:text-left px-6 md:px-0">
			основные группы запросов с которыми я работаю в совместном формате с врачами
		</h3>
		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
			{#each requestGroups as group}
				<div class="{group.gridClass} min-h-[220px]">
					<div class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6">
						<!-- Заголовок карточки -->
						<div class="mb-4 flex items-center gap-3">
							<h4 class="text-lg font-semibold text-[#191919]">{group.theme}</h4>
						</div>

						<!-- Список пунктов -->
						<ul class="flex flex-col content-start items-start justify-start gap-2.5 lg:gap-3.5">
							{#each group.points as point}
								<li class="flex items-center gap-3">
									<span class="flex-shrink-0">—</span>
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

	<!-- С чем я не работаю -->
	<div
		class="mx-auto flex max-w-[720px] flex-col items-center gap-6 md:max-w-[960px] lg:max-w-[1200px] mt-6"
	>
		<h3 class="subtitle">с чем я не работаю</h3>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-1 md:px-0">
			<div
				class="w-full rounded-lg bg-[#F2F0EF] px-5 py-6 md:px-8 md:py-8 max-w-[720px] md:max-w-[960px] lg:max-w-[600px]"
			>
				<ul class="flex flex-col gap-2.5">
					<li>— расстройства пищевого поведения</li>
					<li>— люди с расстройствами личности, если основной запрос связан с компенсацией РЛ</li>
					<li>— биполярное аффективное расстройство</li>
					<li>— РАС/СДВГ</li>
					<li>— Шизофрения</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Образование (как в примере) -->
	<div
		class="col-span-1 md:col-span-1 flex-col max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto flex gap-2.5 md:gap-3.5 items-stretch w-full px-5 mt-8"
	>
		<div class="w-full">
			<Education isOpen={true} />
		</div>

		<!-- Контакты для связи -->
		<div class="flex flex-col items-center gap-2.5 md:gap-3.5 w-full mt-6 mb-10">
			<h3 class="subtitle">как со мной связаться</h3>

			<div
				class="w-full max-w-[600px] mx-auto rounded-lg bg-[#F2F0EF] px-6 py-6 md:px-8 md:py-8 flex flex-col gap-4"
			>
				<div class="flex flex-col gap-3">
					Вы можете рекомендовать меня как психолога вашим пациентам либо предложить мне другие
					форматы взаимодействия.
					<p>Я консультирую онлайн, мои контакты:</p>
				</div>

				<ul class="flex flex-col gap-3">
					<li class="flex items-center gap-3">
						<span class="icon-[lucide--phone] text-[#B8A98A] w-5 h-5"></span>
						<span
							><MarkdownLink
								text="
						[+7 906 534-82-41](https://api.whatsapp.com/send?phone=79065378241)  
				"
							/></span
						>
					</li>
					<li class="flex items-center gap-3">
						<span class="icon-[lucide--message-circle] text-[#B8A98A] w-5 h-5"></span>
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
