<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import EducationNew from '$lib/components/sections/EducationNew.svelte';
	import Media from '$lib/components/sections/Media.svelte';

	const problems = [
		{
			icon: 'icon-[lucide--zap]',
			title: 'работа и самореализация',
			items: [
				'**Работаете на износ** и не можете позволить себе замедлиться',
				'Прокрастинируете, хотя дедлайны горят — не лень, а **внутреннее опустошение**',
				'Синдром самозванца и ощущение, что «недостаточно стараетесь»',
				'Старая работа перестала зажигать, но **непонятно, куда двигаться**'
			]
		},
		{
			icon: 'icon-[lucide--orbit]',
			title: 'эмоции и состояние',
			items: [
				'**Не можете отдыхать без чувства вины** — даже в выходные мозг продолжает «жевать» задачи',
				'Тревога в нерабочее время: маниакально проверяете чаты и не можете выключить режим «спасателя»',
				'Просыпаетесь разбитым **даже после выходных**',
				'Всё кажется бессмысленным — работа, которую когда-то любили, **стала просто функцией**'
			]
		},
		{
			icon: 'icon-[lucide--search]',
			title: 'отношения с собой',
			items: [
				'Говорите «да», когда хотите сказать «нет» — и потом злитесь на себя',
				'**Боитесь остановиться**: кажется, стоит сбавить темп — и всё рухнет',
				'Понимаете, что нужно что-то менять, но каждый раз откладываете'
			]
		},
		{
			icon: 'icon-[lucide--leaf]',
			title: 'жизнь и смыслы',
			items: [
				'Живёте от дедлайна к дедлайну и ждёте, что **«само пройдёт»**',
				'Ощущение, что **жизнь проходит мимо** — на себя времени нет совсем',
				'Сложно понять: это выгорание, депрессия или просто усталость?'
			]
		}
	];

	const approaches = [
		{
			title: 'последовательность, не хаос',
			desc: 'Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план работы и двигаемся к изменениям.'
		},
		{
			title: 'позрачность на каждом шаге',
			desc: 'Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших действий на каждом этапе работы. Никаких туманных процессов без ориентиров.'
		},
		{
			title: 'только доказательные методы',
			desc: 'Применяю методы с доказанной эффективностью, которые фокусируются на реальных действиях, а не только на симптомах.'
		},
		{
			title: 'измеримый прогресс',
			desc: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было вовремя корректировать курс.'
		},
		{
			title: 'опыт в IT изнутри',
			desc: 'Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.'
		},
		{
			title: 'без удержания в терапии',
			desc: 'Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько, сколько нужно для реальных изменений.'
		}
	];

	const steps = [
		{
			title: 'Знакомство и запрос',
			time: '~50 мин',
			desc: 'Вы рассказываете, что происходит. Я объясняю, чем смогу помочь. Мы вместе определяем направление — я ничего не навязываю.'
		},
		{
			title: 'Разбор ситуации на детали',
			time: '1–2 сессии',
			desc: 'Фиксируем: что конкретно происходит, где именно ломается система, что вы уже пробовали и почему не сработало. Ставим ясную цель — не «стать счастливее», а конкретное измеримое изменение.'
		},
		{
			title: 'Работа с мышлением и поведением',
			time: 'основной блок',
			desc: 'Разбираем убеждения, которые поддерживают истощение. Вводим поведенческие изменения — небольшими шагами, которые реально вписать в вашу жизнь. При необходимости — осваиваем конкретные навыки: границы, работа с тревогой, эмоциональная регуляция.'
		},
		{
			title: 'Трекинг прогресса',
			time: 'на протяжении всей работы',
			desc: 'Прозрачная система отслеживания изменений. Вы всегда видите, что меняется — и мы вовремя корректируем курс. Не застреваем в терапии без ориентиров.'
		},
		{
			title: 'Финал: вы сами себе психолог',
			time: '',
			desc: 'Конечная цель — вы больше не нуждаетесь в терапии. Вы понимаете свои паттерны, умеете с ними работать и не возвращаетесь в ту же яму снова.'
		}
	];

	const faqs = [
		{
			q: 'сколько нужно сессий?',
			a: 'Предсказать заранее — почти невозможно. У каждого своя динамика. Кто-то уходит через три месяца, кто-то работает год. Психика не укладывается в расписание. Могу сказать точно, что я работаю **не на количество сессий, а на то, чтобы вы перестали в них нуждаться**.'
		},
		{
			q: 'как часто нужно встречаться?',
			a: 'Наиболее эффективно — **раз в неделю** — это поддерживает терапевтический процесс в нужном ритме. Как только появятся устойчивые изменения, частоту можно постепенно снижать.'
		},
		{
			q: 'будут задания между сессиями?',
			a: 'Да — изменения происходят не на сессиях, а в жизни между ними. Но это не школа: задания мы подбираем **под ваш темп и контекст**, и только, если они необходимы. Мы всегда будем адаптировать их под вас.'
		},
		{
			q: 'не могу сформулировать запрос — это обязательно?',
			a: 'Нет. Достаточно общего ощущения, что что-то идёт не так. **Конкретный запрос мы сформулируем вместе** в процессе — именно для этого и нужна первая встреча.'
		},
		{
			q: 'боюсь осуждения',
			a: 'На сессиях нет места осуждению — ни морализаторства, ни «правильных» эмоций. **Пространство терапии — это безопасная среда**. Делитесь только тем, к чему готовы, в своём темпе.'
		},
		{
			q: 'буду нервничать на первой встрече — это нормально?',
			a: 'Абсолютно нормально — многие испытывают тревогу в начале. Первая встреча именно для этого и нужна: оценить, комфортно ли вам, и создать пространство для разговора. Начнём мягко, без давления.'
		},
		{
			q: 'как понять, нужна ли мне вообще терапия?',
			a: 'Если проблемы не решаются самостоятельно длительное время, или вы чувствуете, что что-то идёт не так — терапия может помочь. Для того чтобы понять, подойдёт ли вам мой подход — именно **для этого существует диагностическая встреча**.'
		}
	];
</script>

<svelte:head>
	<title>Консультации для выгорающих профессионалов | Андрей Калмыков</title>
</svelte:head>

<section data-hero class="relative overflow-hidden text-gray-100 xl:min-h-[max(50vh,800px)]">
	<HeroBackground />
	<div
		class="absolute z-0 h-full w-full bg-linear-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"
	></div>

	<div class="relative z-10 mx-auto px-5 pt-32 pb-16 md:max-w-[960px] lg:max-w-[1200px] xl:pt-48">
		<Reveal width="full">
			<h1 class="mb-6 font-circe text-3xl leading-tight md:text-5xl">
				Живёте в режиме «дотянуть до пятницы», но выходные уже не восстанавливают?
			</h1>
		</Reveal>
		<Reveal width="full">
			<p class="mb-8 text-lg leading-relaxed text-gray-200 md:text-xl">
				Разберитесь, что происходит — и начните это менять. С доказательным подходом, без
				бесконечного копания в детстве и размытых советов.
			</p>
		</Reveal>
		<Reveal width="full">
			<p
				class="mb-10 border-l-2 border-[#B8A98A] pl-5 text-base leading-relaxed text-gray-300 md:text-lg"
			>
				Научитесь отключаться от работы без чувства вины и верните себе энергию — не застревая в
				терапии на годы.
			</p>
		</Reveal>
		<Reveal width="full">
			<div class="mt-8 flex flex-wrap items-center gap-6">
				<Button href="#pricing" variant="primary" class="hidden px-8 py-4 text-lg md:inline">
					<span>Записаться на диагностическую сессию</span>
				</Button>
				<Button
					href="https://t.me/psy_kalmykov"
					target="_blank"
					rel="noopener noreferrer"
					variant="primary">Записаться</Button
				>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal
			><h2 class="mb-8 mb-12 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				узнаёте себя?
			</h2></Reveal
		>
		<Reveal width="full">
			<div class="grid gap-6 text-lg leading-relaxed text-[#191919]">
				<p>
					Вы работаете в IT, маркетинге или управлении. <strong class="font-medium"
						>Умный, продуктивный, привыкли справляться сами.</strong
					>
				</p>
				<p>
					Открываете рабочий чат в 23:00 — <strong class="font-semibold">«просто проверить»</strong
					>. Просыпаетесь в воскресенье с тревогой, что
					<strong class="font-semibold">что-то упустили</strong>. Берёте ноутбук в отпуск «на всякий
					случай».
				</p>
				<p>
					Пробовали взять отпуск — не помогло. Пробовали «просто меньше работать» — чувство вины
					съедало изнутри. Читали про work-life balance — красиво, но непонятно, что с этим делать.
				</p>
				<p>
					<strong class="font-medium"
						>Сил хватает только на работу и быт. На остальное — нет.</strong
					>
				</p>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-[#f7f5f0] py-16 md:py-24" id="requests">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal
			><h2 class="mb-8 mb-12 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				вам ко мне, если...
			</h2></Reveal
		>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each problems as cat}
				<Reveal class="h-full w-full">
					<div
						class="group flex h-full flex-col rounded-2xl bg-white px-6 py-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 md:p-8 md:p-10"
					>
						<div class="mb-6 flex items-center gap-4">
							<div
								class="flex h-12 min-h-[55px] w-12 min-w-[55px] items-center justify-center rounded-full bg-[#f7f5f0] transition-colors group-hover:bg-[#B8A98A] md:min-w-[72px]"
							>
								<span
									class="text-xl text-[#B8A98A] transition-colors group-hover:text-white md:text-2xl {cat.icon}"
								></span>
							</div>
							<h3 class="text-xl font-semibold text-[#191919]">{cat.title}</h3>
						</div>
						<ul class="flex flex-col gap-4">
							{#each cat.items as item}
								<li
									class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A]/50 before:content-['']"
								>
									<MarkdownLink text={item} />
								</li>
							{/each}
						</ul>
					</div>
				</Reveal>
			{/each}
		</div>
		<Reveal>
			<p class="mx-auto mt-12 text-center text-lg text-[#191919]/50">
				Дело не в силе воли и не в усталости. У этого состояния есть причины — и с ними можно
				работать.
			</p>
		</Reveal>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[960px]">
		<Reveal
			><h2 class="mb-8 mb-12 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				почему отпуск, тайм-менеджмент и «просто взять себя в руки» не работают
			</h2></Reveal
		>

		<div class="space-y-12">
			<div class="space-y-4">
				<h3 class="font-circe text-2xl font-semibold text-[#191919]">
					Сначала — что такое выгорание на самом деле
				</h3>
				<p class="leading-relaxed text-[#191919]">
					Выгорание — это синдром хронического рабочего стресса, который долго не удавалось
					преодолеть. Три признака: постоянное истощение, ощущение, что работа стала чем-то далёким
					и бессмысленным, и падение эффективности.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Ключевое слово — хронического. Выгорание накапливается там, где <strong
						>требования работы систематически превышают ваши ресурсы</strong
					>: слишком много задач, слишком мало контроля над происходящим, ощущение несправедливости
					или конфликт между тем, что вы делаете, и тем, во что верите.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Именно поэтому всё, что работает с симптомами, а не с этим несоответствием, даёт <strong
						>только временное облегчение</strong
					>.
				</p>
			</div>

			<div class="space-y-4">
				<h3 class="font-circe text-2xl font-semibold text-[#191919]">Почему отпуск не помогает</h3>
				<p class="leading-relaxed text-[#191919]">
					Исследования дают однозначные ответ: отпуск умеренно улучшает самочувствие — снижает
					стресс, улучшает настроение, снимает усталость. Но эффект невелик, и в большинстве
					продольных исследований он <strong class="font-semibold"
						>полностью гаснет в течение одной-двух недель</strong
					> после возвращения на работу.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Причём — и это особенно интересно — <strong
						>продолжительность отпуска почти ничего не меняет</strong
					>. Более длинный отпуск не даёт более устойчивого эффекта, чем несколько коротких
					перерывов.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Почему? Пока вы в отпуске, стрессовая среда временно исчезает. Но за это время не
					происходит ничего, что изменило бы то, как вы в ней работаете: <strong
						class="font-semibold"
						>не меняются убеждения, не появляются новые способы реагирования, не становятся другими
						поведенческие паттерны</strong
					>. А когда вы возвращаетесь — вас встречают те же требования, та же организационная среда,
					и плюс к этому — накопившийся хвост задач, который стирает послевкусие отдыха за несколько
					дней.
				</p>
			</div>

			<div class="space-y-4">
				<h3 class="font-circe text-2xl font-semibold text-[#191919]">
					Почему тайм-менеджмент не спасает
				</h3>
				<p class="leading-relaxed text-[#191919]">
					Логика кажется убедительной: если проблема в перегрузке — научись лучше организовывать
					время, расставлять приоритеты, работать эффективнее, и станет легче. Иногда — да, временно
					помогает. Но у этого подхода есть принципиальное ограничение: тайм-менеджмент — это
					<strong class="font-semibold"
						>инструмент для работы внутри системы, а не для её изменения</strong
					>.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Исследования в рамках модели Job Demands–Resources показывают: выгорание снижается, когда
					либо уменьшаются требования (объём нагрузки, организационный хаос, конфликты ролей), либо
					увеличиваются ресурсы (автономия, поддержка, справедливость, ощущение, что ваша работа
					соответствует вашим ценностям). Тайм-менеджмент сам по себе ни того, ни другого не даёт.
				</p>
				<p class="leading-relaxed text-[#191919]">
					Хуже того — если его используют для того, чтобы впихнуть больше задач в тот же день, <strong
						class="font-semibold">он не снижает выгорание, а поддерживает его</strong
					>. Вы работаете эффективнее, но в той же дисфункциональной системе, с теми же
					несоответствиями. Просто быстрее к ней адаптируетесь — на какое-то время. Обзоры по
					выгоранию подчёркивают прямо: программы, которые нацелены только на индивидуальные навыки
					без изменения организационной среды, дают меньший и менее устойчивый эффект.
				</p>
			</div>

			<div class="space-y-4">
				<h3 class="font-circe text-2xl font-semibold text-[#191919]">
					Почему «просто взять себя в руки» только ускоряет разрушение
				</h3>
				<p class="leading-relaxed text-[#191919]">
					Самодисциплина и мотивация — инструменты здоровой системы. Они хорошо работают, когда у
					вас есть ресурс. Когда ресурса нет — они перестают быть инструментами роста и <strong
						>превращаются в механизм давления</strong
					>.
				</p>
				<p class="leading-relaxed text-[#191919]">
					При выгорании ваш организм уже работает на пределе. Восстановительные механизмы ослаблены.
					В этой точке требование «собраться и работать» означает одно: <strong
						class="font-semibold">усилить давление на систему, которая уже истощена</strong
					>. Это не путь к восстановлению — это
					<strong class="font-semibold">путь к более глубокому выгоранию</strong>. Мотивация и
					способность к самоорганизации возвращаются сами, когда система снова становится
					устойчивой.
				</p>
			</div>

			<Reveal width="full">
				<div class="relative my-4 flex flex-col justify-center gap-3">
					<p
						class="relative z-10 max-w-[800px] text-center font-circe text-xl leading-relaxed text-[#191919] md:text-3xl"
					>
						Отпуск убирает стресс временно. Тайм-менеджмент помогает работать быстрее в той же
						сломанной системе. «Взять себя в руки» при истощении — это давление на истощённый
						ресурс.
					</p>
					<p
						class="relative z-10 max-w-[800px] text-center font-circe text-xl leading-relaxed text-[#191919] md:text-3xl"
					>
						<span class="font-semibold text-[#B8A98A]"
							>Психотерапия меняет то, как вы функционируете в среде, которая никуда не делась.</span
						>
					</p>
				</div>
			</Reveal>
			<div
				class="flex h-full flex-col justify-between space-y-6 rounded-2xl bg-[#f7f5f0] px-4 py-6 md:p-12"
			>
				<h3 class="font-circe text-xl font-semibold text-[#191919] md:text-3xl">
					Что мы делаем в терапии принципиально иначе
				</h3>
				<p class="text-md leading-relaxed text-[#191919]/80">
					Подход в котором я работаю, сосредоточен не на борьбе с симптомами, а с тем, что их
					производит — с <strong class="font-semibold">архитектурой</strong> выгорания.
				</p>
				<ul class="space-y-6 pt-4">
					<!-- flex-col для мобилки (цифра сверху), md:flex-row для десктопа (цифра слева) -->
					<li class="flex flex-col gap-1 md:flex-row md:gap-6">
						<span class="text-xl font-bold text-[#B8A98A]">01</span>
						<span class="text-md leading-relaxed text-[#191919]/80">
							Мы в первую очередь выявляем ваши убеждения, которые поддерживают истощение:
							<strong class="font-semibold">перфекционизм</strong>, установку «я должен всегда быть
							доступен», катастрофизацию ошибок, и делаем так, чтобы они перестали влиять на ваше
							поведение. Параллельно — обучаем конкретным стратегиям: как принимать решения в
							условиях перегрузки, как выстраивать поведение в рабочем контексте, а не только
							«думать правильно». Клинические данные подтверждают значимое снижение всех трёх
							компонентов выгорания.
						</span>
					</li>
					<li class="flex flex-col gap-1 md:flex-row md:gap-6">
						<span class="text-xl font-bold text-[#B8A98A]">02</span>
						<span class="text-md leading-relaxed text-[#191919]/80">
							Мы смещаем фокус с попытки контролировать симптомы на развитие
							<strong class="font-semibold">психологической гибкости</strong>: контакт с настоящим
							моментом, принятие трудных эмоций без борьбы с ними, и — что особенно важно — действия
							в направлении личных ценностей даже в условиях стресса. Согласно накопленным научным
							данным, именно рост осознанности и ценностно-ориентированного поведения является
							ключевым механизмом снижения выгорания.
						</span>
					</li>
					<li class="flex flex-col gap-1 md:flex-row md:gap-6">
						<span class="text-xl font-bold text-[#B8A98A]">03</span>
						<span class="text-md leading-relaxed text-[#191919]/80">
							Мы тренируем новые способы реагирования
							<strong class="font-semibold">в реальных или смоделированных рабочих ситуациях</strong
							>
							— через поведенческие эксперименты, ролевые игры, домашние задания. Это принципиально отличает
							нашу работу от отпуска: навык формируется именно там, где возникает проблема.
						</span>
					</li>
				</ul>
				<div class="mt-6 border-t border-[#E5E5E5] pt-6">
					<p class="text-md leading-relaxed text-[#191919]">
						<strong class="font-semibold">Результат:</strong> исследования показывают, что эффект по
						снижению выгорания и стресса
						<strong class="font-semibold"
							>не только сохраняется, но и усиливается на 6–12-месячном горизонте</strong
						>. Человек продолжает применять освоенные способы реагирования
						<strong class="font-semibold">уже без терапевта</strong>.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="bg-[#f7f5f0] py-16 md:py-24" id="approach">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal
			><h2
				class="mb-8 mb-16 text-center font-circe text-3xl font-semibold text-[#191919] md:text-4xl"
			>
				как я работаю
			</h2></Reveal
		>

		<!-- Воздушный грид без рамок -->
		<div class="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-16 lg:grid-cols-3">
			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--route] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">последовательность, не хаос</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план
						работы и двигаемся к изменениям.
					</p>
				</div>
			</Reveal>

			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--signpost] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">прозрачность на каждом шаге</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Вы всегда понимаете, что мы делаем, зачем и как это работает: объясняю логику наших
						действий на каждом этапе работы.
					</p>
				</div>
			</Reveal>

			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--flask-conical] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">доказательные методы</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Применяю методы с доказанной эффективностью, которые фокусируются на реальных действиях,
						а не только на симптомах.
					</p>
				</div>
			</Reveal>

			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--trending-up] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">измеримый прогресс</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к
						конкретным результатам и можно было корректировать курс.
					</p>
				</div>
			</Reveal>

			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--briefcase] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">опыт в IT изнутри</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Знаю реалии цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и
						говорю с вами на одном языке.
					</p>
				</div>
			</Reveal>

			<Reveal>
				<div class="group flex flex-col">
					<span
						class="mb-5 icon-[lucide--door-open] h-8 w-8 text-[#B8A98A] transition-all duration-300 group-hover:text-[#B8A98A]"
					></span>
					<h3 class="mb-3 text-xl font-semibold text-[#191919]">Без удержания в терапии</h3>
					<p class="leading-relaxed text-[#191919]/70">
						Конечная цель — сделать так, чтобы терапия вам стала не нужна. Работаем ровно столько,
						сколько нужно для реальных изменений.
					</p>
				</div>
			</Reveal>
		</div>
	</div>
</section>

<section class="bg-white py-16 md:py-24" id="about">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal
			><h2
				class="mb-8 mb-16 text-center font-circe text-3xl font-semibold text-[#191919] md:text-4xl"
			>
				обо мне
			</h2></Reveal
		>
		<div class="mb-[24px] grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
			<Reveal width="full">
				<div class="space-y-4 leading-relaxed text-[#191919]">
					<p>Меня звоут Андрей Калмыков, я психолог для выгорающих профессионалов.</p>
					<p>
						Я сам долго жил в режиме, который описывают мои клиенты: аспирантура плюс две работы
						одновременно, ощущение, что остановиться нельзя, и всегда нужно двигаться к цели и быть
						эффективным.
					</p>
					<p>
						Это не делает меня лучше других психологов. Но это значит, что я понимаю вас без
						предисловий — не только потому, что читал об этом, а потому что сам через это прошёл.
					</p>
					<p>В психологию пришёл осознанно, это моя вторая профессия, после долгой работы в IT.</p>
					<ul>
						<li
							class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A]/50 before:content-['']"
						>
							Регулярно посещаю профессиональные конференции и слежу за актуальными исследованиями —
							потому что это интересно.
						</li>
						<li
							class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A]/50 before:content-['']"
						>
							<MarkdownLink
								text="[Состою](https://akpn.org/members/kalmykov-andrei-viktorovich-2314)"
							/> в Ассоциации специалистов в сфере контекстуально-поведенческой науки
						</li>
						<li
							class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A]/50 before:content-['']"
						>
							Веду <MarkdownLink text="[Telegram-канал](https://t.me/kalmykov_psy)" /> о психологии —
							там можно познакомиться со мной поближе до записи.
						</li>
					</ul>
				</div>
			</Reveal>
			<Reveal width="full">
				<ImageWithShadow
					src="/2.webp"
					srcSmall="/2_small.webp"
					alt="Андрей"
					shadowPosition="bottom-left"
					imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
					shadowClass="bg-[#f7f5f0]"
					width={505}
					height={720}
				/>
			</Reveal>
		</div>
	</div>
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]"><EducationNew /></div>
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]"><Media /></div>
	<div class="mx-auto mt-16 px-5 md:mt-24 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal width="full">
			<div>
				<h3 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
					Почему здесь нет отзывов?
				</h3>
				<div
					class="space-y-6 border-l-2 border-[#B8A98A] pl-6 text-lg leading-relaxed text-[#191919] md:pl-8 md:text-xl"
				>
					<p>
						Вы не найдёте здесь отзывов клиентов — и это осознанный выбор. Я строго отношусь к
						конфиденциальности, поэтому <strong class="font-semibold"
							>не собираю и не публикую отзывы</strong
						> ни в каком виде, даже обезличенном.
					</p>
					<p>
						Кроме того, в терапии мы находимся в неравной позиции: просить отзыв у человека, который
						пришёл в уязвимом состоянии, — значит эксплуатировать его доверие. <strong
							class="font-semibold">Я не использую клиентов в маркетинговых целях</strong
						>.
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>

<section id="pricing" class="bg-[#f7f5f0] py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal>
			<h2 class="mb-6 mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				формат и стоимость
			</h2>
			<p class="mb-12 text-lg text-[#191919]/70">
				Индивидуальные психологические консультации. Одна встреча — 50 минут, онлайн, в удобное для
				вас время.
			</p>
		</Reveal>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full flex-col rounded-lg border border-[#B8A98A] bg-white p-6 shadow-sm md:p-8"
				>
					<h3 class="mb-2 font-circe text-2xl font-semibold text-[#191919] md:pt-[58px]">
						Диагностическая сессия
					</h3>
					<div class="mb-8 text-3xl font-semibold text-[#191919]">4 000 ₽</div>
					<p class="mb-6 text-[#191919]/70">
						Если хотите разобраться в конкретной ситуации, познакомиться с подходом или понять,
						нужна ли вам терапия вообще.
					</p>

					<ul class="mb-10 space-y-3 leading-relaxed text-[#191919]">
						<li>— 1 сессия (50 минут)</li>
						<li>— Онлайн</li>
						<li>— Ни к чему не обязывает</li>
					</ul>
					<div class="mt-auto flex">
						<Button
							href="https://t.me/psy_kalmykov"
							target="_blank"
							rel="noopener noreferrer"
							variant="primary"
							class="w-full justify-center"
						>
							Записаться
						</Button>
					</div>
				</div>
			</Reveal>
			<Reveal class="h-full w-full">
				<div class="flex h-full flex-col rounded-lg bg-[#191919] p-8 text-white shadow-xl">
					<div class="mb-4 w-fit rounded-full bg-[#B8A98A] px-3 py-1 text-xs text-white uppercase">
						Популярный формат
					</div>
					<h3 class="mb-2 font-circe text-2xl font-semibold">Регулярные встречи</h3>
					<div class="mb-8 text-3xl font-semibold">
						14 000 ₽ <span class="text-lg font-normal text-white/50">/ месяц</span>
					</div>
					<p class="mb-6 text-white/70">Для устойчивых изменений, а не временного облегчения.</p>

					<ul class="mb-10 space-y-3 leading-relaxed text-white/90">
						<li>— 4 сессии в месяц</li>
						<li>— Система трекинга прогресса</li>
						<li>— Обратная связь по сессиям</li>
						<li>— Онлайн, гибкое расписание</li>
					</ul>
					<div class="mt-auto flex">
						<Button
							href="https://t.me/psy_kalmykov"
							target="_blank"
							rel="noopener noreferrer"
							variant="secondary"
							class="w-full justify-center"
						>
							Начать работу
						</Button>
					</div>
				</div>
			</Reveal>
		</div>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[960px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:mb-12 md:text-4xl">
				как мы придём к результату
			</h2>
		</Reveal>

		<div class="w-full">
			{#each steps as step, i}
				<Reveal width="full">
					<div
						class="flex flex-col gap-2 border-b border-[#B8A98A] py-8 last:border-0 md:flex-row md:gap-6"
					>
						<div class="font-circe text-3xl font-bold text-[#B8A98A] opacity-40 md:text-4xl">
							0{i + 1}
						</div>
						<div class="space-y-2">
							<div class="md:flex md:flex-row md:items-baseline">
								<h3 class="text-xl font-semibold text-[#191919]">
									{step.title}
								</h3>
								<span class="md:ml-2 text-sm font-normal text-[#191919]/50">{step.time}</span>
							</div>
							<p class="leading-relaxed text-[#191919]">{step.desc}</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>

<section class="bg-[#f7f5f0] py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal width="full">
			<div
				class="flex flex-col items-center gap-8 rounded-lg border border-[#B8A98A] bg-white p-8 shadow-sm md:flex-row"
			>
				<div class="icon-[lucide--gift] text-6xl text-[#B8A98A]"></div>
				<div class="w-full">
					<h3 class="mb-3 font-circe text-2xl font-semibold text-[#191919]">
						Гайд «Как отдыхать правильно»
					</h3>
					<p class="mb-6 leading-relaxed text-[#191919]">
						Большинство людей отдыхают неправильно — и дело не в количестве часов. Дело в том, что
						<strong class="font-semibold">тип отдыха не совпадает с типом усталости</strong>. Гайд
						объясняет: какие бывают виды усталости, почему телефон и сериалы не восстанавливают, и
						что на самом деле помогает — с конкретными примерами на 5, 15, 30 и 60+ минут.
					</p>
					<Button
						href="https://t.me/psy_kalmykov"
						target="_blank"
						rel="noopener noreferrer"
						variant="primary"
					>
						Получить
					</Button>
				</div>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-[#191919] py-20 text-center text-white">
	<div class="mx-auto space-y-8 px-5 md:max-w-[960px] lg:max-w-[1200px]">
		<Reveal width="full">
			<h2 class="font-circe text-3xl leading-tight font-semibold md:text-4xl">
				Вы уже достаточно долго живёте в режиме «потерплю ещё немного»
			</h2>
			<p class="mx-auto mt-4 max-w-[800px] text-lg text-white/80">
				Выгорание не проходит само — оно накапливается. Но оно решаемо, если работать с правильной
				точкой приложения усилий.
			</p>
		</Reveal>
		<Reveal width="full">
			<div class="flex flex-col items-center justify-center gap-6 pt-6 md:flex-row">
				<Button href="#pricing" variant="primary" class="hidden px-8 py-4 text-lg md:inline">
					<span>Записаться на диагностическую сессию</span>
				</Button>
				<Button
					href="https://t.me/psy_kalmykov"
					target="_blank"
					rel="noopener noreferrer"
					variant="primary">Записаться</Button
				>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-white py-16 md:py-24" id="faq">
	<div class="mx-auto px-5 md:max-w-[960px] lg:max-w-[960px]">
		<Reveal
			><h2
				class="mb-8 mb-12 text-center font-circe text-3xl font-semibold text-[#191919] md:text-4xl"
			>
				вопросы и ответы
			</h2></Reveal
		>
		<div class="w-full border-t border-[#B8A98A]">
			{#each faqs as item}
				<AccordionItem class="border-b border-[#B8A98A]">
					{#snippet header()}
						<h3 class="pr-4 text-lg font-medium">{item.q}</h3>
					{/snippet}
					{#snippet children()}
						<p class="leading-relaxed text-[#191919]"><MarkdownLink text={item.a} /></p>
					{/snippet}
				</AccordionItem>
			{/each}
		</div>
	</div>
</section>
