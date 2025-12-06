<script lang="ts">
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';

	import PageHero from '$lib/components/PageHero.svelte';
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

<div class="relative mt-8 flex w-full flex-col gap-8.5 overflow-x-hidden md:gap-10.5 lg:mt-0">
	<!-- Hero: мотивация сотрудничества -->
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
	>
		<!-- Image 1 -->
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

		<!-- Text 1: мотивация -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8">
				<div
					class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
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
		<h2 class="px-6 text-center subtitle md:px-0 md:text-left">
			какие проблемы психологи помогают решить врачам
		</h2>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24">
			{#each items as item}
				<div class={item.gridClass}>
					<div class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6">
						<div>
							<h3 class="text-lg font-semibold text-[#191919]">{item.highlight}</h3>
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
		<h2 class="px-6 text-center subtitle md:px-0 md:text-left">
			основные группы запросов с которыми я работаю в совместном формате с врачами
		</h2>
		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
			{#each requestGroups as group}
				<div class="{group.gridClass} min-h-[220px]">
					<div class="flex h-full min-h-[180px] flex-col justify-start rounded-lg bg-[#F2F0EF] p-6">
						<!-- Заголовок карточки -->
						<div class="mb-4 flex items-center gap-3">
							<h3 class="text-lg font-semibold text-[#191919]">{group.theme}</h3>
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
		class="mx-auto mt-6 flex max-w-[720px] flex-col items-center gap-6 md:max-w-[960px] lg:max-w-[1200px]"
	>
		<h2 class="subtitle">с чем я не работаю</h2>

		<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-1 md:px-0">
			<div
				class="w-full max-w-[720px] rounded-lg bg-[#F2F0EF] px-5 py-6 md:max-w-[960px] md:px-8 md:py-8 lg:max-w-[600px]"
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
		class="col-span-1 mx-auto mt-8 flex w-full max-w-[720px] flex-col items-stretch gap-2.5 px-5 md:col-span-1 md:max-w-[960px] md:gap-3.5 lg:max-w-[1200px]"
	>
		<div class="w-full">
			<Education isOpen={true} />
		</div>

		<!-- Контакты для связи -->
		<div class="mt-6 mb-10 flex w-full flex-col items-center gap-2.5 md:gap-3.5">
			<h2 class="subtitle">как со мной связаться</h2>

			<div
				class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-lg bg-[#F2F0EF] px-6 py-6 md:px-8 md:py-8"
			>
				<div class="flex flex-col gap-3">
					Вы можете рекомендовать меня как психолога вашим пациентам либо предложить мне другие
					форматы взаимодействия.
					<p>Я консультирую онлайн, мои контакты:</p>
				</div>

				<ul class="flex flex-col gap-3">
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
