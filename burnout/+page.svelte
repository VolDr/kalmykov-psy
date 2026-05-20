<script lang="ts">
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	// Компоненты-заглушки для ссылок и кнопок, если они потребуются (по примеру MainGridNew)
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
	<title>Психолог при выгорании — онлайн-консультация</title>
	
	<meta 
		name="description" 
		content="Психологическая помощь при профессиональном выгорании: диагностика по BAT-23, КПТ и ACT-терапия, онлайн-консультация. Узнайте, когда нужен психолог и как проходит первая сессия."
	/>
	<meta property="og:title" content="Психолог при выгорании — онлайн-консультация" />
	<meta 
		property="og:description" 
		content="Психологическая помощь при профессиональном выгорании: диагностика по BAT-23, КПТ и ACT-терапия, онлайн-консультация. Узнайте, когда нужен психолог и как проходит первая сессия."
	/>
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{import.meta.env.VITE_URL}/burnout/consultation/" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Психолог при выгорании — онлайн-консультация" />
	<meta 
		name="twitter:description" 
		content="Психологическая помощь при профессиональном выгорании: диагностика по BAT-23, КПТ и ACT-терапия, онлайн-консультация. Узнайте, когда нужен психолог и как проходит первая сессия."
	/>
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />

	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Article",
		"headline": "Психологическое консультирование при выгорании",
		"description": "Руководство по психологической помощи при профессиональном выгорании: диагностика, методы терапии (КПТ, ACT, майндфулнесс), формат работы и критерии выбора специалиста.",
		"url": "${import.meta.env.VITE_URL}/burnout/",
		"dateModified": "2026-05-01",
		"inLanguage": "ru",
		"author": {
			"@type": "Person",
			"name": "Андрей Калмыков",
			"jobTitle": "Клинический психолог, специалист по выгоранию",
			"knowsAbout": [
				"Профессиональное выгорание",
				"Терапия принятия и ответственности (ACT)",
				"Когнитивно-поведенческая терапия"
			]
		},
		"publisher": {
			"@type": "Organization",
			"name": "Андрей Калмыков — Психолог",
			"url": "${import.meta.env.VITE_URL}"
		},
		"about": [
			{
				"@type": "MedicalCondition",
				"name": "Синдром профессионального выгорания",
				"code": {
					"@type": "MedicalCode",
					"code": "QD85",
					"codingSystem": "ICD-11"
				}
			},
			{
				"@type": "Thing",
				"name": "Психологическое консультирование"
			}
		],
		"mentions": [
			{
				"@type": "MedicalStudy",
				"name": "Burnout Assessment Tool (BAT-23)"
			},
			{
				"@type": "Thing",
				"name": "Maslach Burnout Inventory (MBI)"
			},
			{
				"@type": "MedicalTherapy",
				"name": "Когнитивно-поведенческая терапия (КПТ)"
			},
			{
				"@type": "MedicalTherapy",
				"name": "Терапия принятия и ответственности (ACT)"
			},
			{
				"@type": "MedicalTherapy",
				"name": "Майндфулнесс-интервенции (MBSR)"
			}
		],
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": "${import.meta.env.VITE_URL}/burnout/"
		}
	}
	</script>`}
</svelte:head>

<section data-hero class="relative overflow-hidden text-gray-100 xl:min-h-[max(50vh,600px)]">
	<HeroBackground />
	<div class="absolute z-0 h-full w-full bg-linear-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"></div>

	<div class="relative z-10 mx-auto px-5 pt-32 pb-16 md:max-w-[760px] lg:max-w-[960px] xl:pt-48">
		<Reveal width="full">
			<h1 class=" font-circe text-3xl leading-tight md:text-5xl">
				Психолог при выгорании: консультация и психотерапия онлайн
			</h1>
		</Reveal>
		<Reveal width="full">
			<p class="text-lg leading-relaxed text-gray-200 md:text-xl md:w-3/4">
				Эмоциональное выгорание — не «просто усталость», которая пройдёт после отпуска. Это клинически описанный синдром (МКБ-11, код QD85), при котором хронический рабочий стресс разрушает мотивацию, эмоциональный ресурс и способность получать удовлетворение от деятельности. Психологическое консультирование при выгорании работает с причинами истощения — не маскирует симптомы.
			</p>
		</Reveal>
	</div>
</section>

<section class="bg-[#f7f5f0] py-4">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[960px]">
		<nav class="flex text-sm text-[#191919]/60" aria-label="Breadcrumb">
			<ol class="inline-flex items-center space-x-1 md:space-x-3">
				<li class="inline-flex items-center">
					<a href="/buronut" class="inline-flex items-center hover:text-[#B8A98A] transition-colors text-[#191919] font-medium">Выгорание</a>
				</li>
			</ol>
		</nav>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				Психологическая помощь при выгорании — когда пора обратиться
			</h2>
		</Reveal>
		<Reveal width="full">
			<div class="space-y-6 text-lg leading-relaxed text-[#191919]">
				<p>
					Барьер «а вдруг это просто лень?» откладывает обращение к специалисту в среднем на 6–18 месяцев после появления первых симптомов. За это время эмоциональное истощение переходит в стойкое снижение продуктивности, деперсонализацию и психосоматические нарушения.
				</p>
				<p>
					Обратиться к психологу стоит, если вы узнаёте в себе несколько из следующих признаков:
				</p>
				<ul class="flex flex-col gap-3 py-2">
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Хроническая усталость, которая не проходит после выходных
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Цинизм или безразличие к работе, которая раньше была значимой
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Трудности с концентрацией, прокрастинация как защитный механизм
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Ощущение пустоты или «я ничего не чувствую»
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Раздражительность без очевидного повода, срывы на близких
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						Частые простуды, головные боли, нарушения сна — психосоматика при стрессе
					</li>
				</ul>
				<p>
					Если три и более пункта из этого списка стабильно присутствуют дольше двух недель — это основание для профессиональной диагностики, а не самодиагностики. Подробнее о том, как отличить стадию тревожного сигнала от тяжёлого истощения, читайте в разделе 
					<a href="/burnout/sindrom-professionalnogo-vygoraniya/priznaki-i-simptomy/" class="text-[#B8A98A] underline hover:no-underline transition-all">Признаки и симптомы выгорания</a>.
				</p>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-[#f7f5f0] py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				Как проходит консультация психолога при выгорании
			</h2>
		</Reveal>
		<Reveal width="full">
			<div class="space-y-6 text-lg leading-relaxed text-[#191919]">
				<p>
					Консультация при выгорании строится иначе, чем работа с тревогой или депрессией: акцент смещён с симптоматики на рабочий контекст, функциональные паттерны и ценностную ориентацию специалиста.
				</p>
				<p>
					<strong class="font-semibold">Первая сессия</strong> включает:
				</p>
				<ol class="list-decimal pl-6 space-y-3 marker:text-[#B8A98A] marker:font-bold py-2">
					<li class="pl-2">
						<strong class="font-semibold">Психодиагностику</strong> — структурированное клиническое интервью и, при необходимости, опросник BAT-23 (Burnout Assessment Tool) или MBI (Maslach Burnout Inventory). Это позволяет объективно оценить три компонента: эмоциональное истощение, деперсонализацию и редукцию профессиональных достижений.
					</li>
					<li class="pl-2">
						<strong class="font-semibold">Функциональный анализ</strong> — выявление конкретных триггеров, рабочих условий и поведенческих паттернов, поддерживающих истощение.
					</li>
					<li class="pl-2">
						<strong class="font-semibold">Психотерапевтический контракт</strong> — совместное формулирование запроса, частоты встреч, формата работы и критериев прогресса. Это не формальность: исследования терапевтического альянса (Bordin, 1979; Norcross, 2011) показывают, что согласованность целей и задач между клиентом и психологом является предиктором эффективности терапии сильнее, чем выбор метода.
					</li>
				</ol>
				<p>
					Со второй сессии начинается основная работа: когнитивная реструктуризация дисфункциональных убеждений («я должен быть всегда эффективен»), поведенческая активация, развитие психологической гибкости через ACT-интервенции, регуляция эмоций через майндфулнесс-практики. Средняя длительность курса при умеренном выгорании — 12–20 сессий.
				</p>

				<h3 class="font-circe text-2xl font-semibold text-[#191919] mt-12 mb-4">
					Консультативный альянс как основа эффективной работы
				</h3>
				<p>
					Терапевтический альянс — рабочий союз между клиентом и психологом — объясняет до 30% дисперсии терапевтических исходов (Wampold, 2015). В контексте выгорания это особенно критично: клиент, у которого истощён эмоциональный ресурс, нуждается в безопасном пространстве без требований и оценки. Качество альянса формируется в первых трёх сессиях — именно поэтому важно, чтобы психолог имел опыт работы с синдромом выгорания, а не только с общими запросами «на тему работы».
				</p>

				<h3 class="font-circe text-2xl font-semibold text-[#191919] mt-12 mb-4">
					Психотерапевтический контракт: что важно обсудить на первой сессии
				</h3>
				<p>На первой встрече необходимо прояснить:</p>
				<ul class="flex flex-col gap-3 py-2">
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Запрос и цели</strong> — конкретные, измеримые («я хочу снова чувствовать смысл в работе», а не «я хочу не выгорать»)
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Конфиденциальность</strong> — условия и ограничения
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Формат</strong> — онлайн или очно, частота встреч
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Метод</strong> — какой подход использует специалист и почему он подходит для вашего запроса
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Критерии завершения</strong> — как вы будете оценивать прогресс
					</li>
				</ul>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				Индивидуальное консультирование или психотерапия: в чём разница
			</h2>
		</Reveal>
		<Reveal width="full">
			<div class="space-y-6 text-lg leading-relaxed text-[#191919]">
				<p>Оба формата работают при выгорании, но решают разные задачи.</p>

				<div class="overflow-x-auto my-10 rounded-xl border border-[#E5E5E5] shadow-sm">
					<table class="w-full text-left border-collapse min-w-[600px]">
						<thead>
							<tr class="bg-[#f7f5f0] border-b border-[#E5E5E5]">
								<th class="p-5 font-semibold text-[#191919] w-1/4">Параметр</th>
								<th class="p-5 font-semibold text-[#191919] w-3/8">Психологическое консультирование</th>
								<th class="p-5 font-semibold text-[#191919] w-3/8">Психотерапия</th>
							</tr>
						</thead>
						<tbody class="text-base text-[#191919]/90">
							<tr class="border-b border-[#E5E5E5] hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Глубина работы</td>
								<td class="p-5">Ситуативные паттерны, рабочий контекст</td>
								<td class="p-5">Личностные структуры, схемы, история</td>
							</tr>
							<tr class="border-b border-[#E5E5E5] hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Длительность</td>
								<td class="p-5">5–15 сессий</td>
								<td class="p-5">20–60+ сессий</td>
							</tr>
							<tr class="border-b border-[#E5E5E5] hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Фокус</td>
								<td class="p-5">Навыки, стратегии, ресурс</td>
								<td class="p-5">Причины уязвимости к истощению</td>
							</tr>
							<tr class="border-b border-[#E5E5E5] hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Метод</td>
								<td class="p-5">Коучинг-элементы, КПТ-протокол</td>
								<td class="p-5">ACT, схема-терапия, психодинамика</td>
							</tr>
							<tr class="border-b border-[#E5E5E5] hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Показания</td>
								<td class="p-5">Умеренное выгорание без коморбидности</td>
								<td class="p-5">Тяжёлое выгорание, сопутствующая депрессия</td>
							</tr>
							<tr class="hover:bg-[#f7f5f0]/50 transition-colors">
								<td class="p-5 font-medium text-[#191919]">Результат</td>
								<td class="p-5">Возвращение к функционированию</td>
								<td class="p-5">Изменение базовых паттернов отношений</td>
							</tr>
						</tbody>
					</table>
				</div>

				<p>
					Если по результатам диагностики выявляется коморбидная депрессия (МКБ-11: 6A70–6A71), тревожное расстройство или расстройство адаптации — необходима консультация психиатра для исключения медикаментозной поддержки. Психолог направит вас к нужному специалисту.
				</p>
				<p>
					Подробнее о дифференциальной диагностике — в разделе 
					<a href="/burnout/sindrom-professionalnogo-vygoraniya/vygoranie-vs-depressiya/" class="text-[#B8A98A] underline hover:no-underline transition-all">Выгорание vs депрессия: как отличить</a>.
				</p>

				<h3 class="font-circe text-2xl font-semibold text-[#191919] mt-12 mb-4">
					Онлайн-психотерапия при эмоциональном истощении
				</h3>
				<p>
					Онлайн-формат при выгорании показывает сопоставимую эффективность с очной работой. Для клиентов с истощением это особенно важно: отсутствие необходимости «доехать» снижает порог входа и устраняет один из распространённых барьеров — «у меня нет сил идти к психологу». Сессии проходят в Zoom или другом защищённом видеоканале, конфиденциальность обеспечена.
				</p>

				<h3 class="font-circe text-2xl font-semibold text-[#191919] mt-12 mb-4">
					Нужен ли психолог или психиатр при выгорании
				</h3>
				<p>
					Психолог — первая точка контакта при выгорании без признаков клинической депрессии. Психиатр необходим, если присутствуют: суицидальные мысли, стойкое ангедония (неспособность испытывать удовольствие) дольше двух недель, резкое снижение веса, психотические симптомы или если психологическая работа не даёт результата на протяжении 2–3 месяцев. В таких случаях медикаментозная поддержка (антидепрессанты СИОЗС, адаптогены) комбинируется с психотерапией.
				</p>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-[#f7f5f0] py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				Какие методы психотерапии применяются при выгорании
			</h2>
		</Reveal>
		<Reveal width="full">
			<div class="space-y-6 text-lg leading-relaxed text-[#191919]">
				<p>
					Доказательная база по работе с профессиональным выгоранием охватывает несколько подходов с различными механизмами действия.
				</p>
				<p>
					<strong class="font-semibold">КПТ (когнитивно-поведенческая терапия)</strong> — наиболее исследованный метод при выгорании. Работает с дисфункциональными убеждениями о работе («я должен справляться сам», «попросить помощь — слабость»), поведенческой активацией и планированием восстановительных активностей. Эффективность подтверждена в РКИ для помогающих профессий.
				</p>
				<p>
					<strong class="font-semibold">ACT (терапия принятия и ответственности)</strong> — работает с психологической гибкостью: снижает когнитивный фьюжн с мыслями об усталости, развивает ценностно-ориентированное поведение даже в условиях истощения. Особенно эффективна при выгорании у психологов, врачей и педагогов — специалистов, чья профессиональная идентичность тесно переплетена с работой.
				</p>
				<p>
					<strong class="font-semibold">Майндфулнесс-интервенции (MBSR/MBCT)</strong> — снижают реактивность к рабочим стрессорам, развивают осознанность как навык регуляции эмоций. Данные 8-недельного протокола MBSR показывают снижение индекса эмоционального истощения по MBI на 23–31%.
				</p>
				<p class="mt-8 border-l-2 border-[#B8A98A] pl-5">
					Подробный обзор методов — в разделе 
					<a href="/burnout/metody-psikhoterapii/" class="text-[#B8A98A] font-medium underline hover:no-underline transition-all">Методы психотерапии при выгорании</a>.
				</p>
			</div>
		</Reveal>
	</div>
</section>

<section class="bg-white py-16 md:py-24">
	<div class="mx-auto px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal>
			<h2 class="mb-8 font-circe text-3xl font-semibold text-[#191919] md:text-4xl">
				Диагностика, профилактика и восстановление: навигация по теме
			</h2>
		</Reveal>
		<Reveal width="full">
			<div class="space-y-6 text-lg leading-relaxed text-[#191919]">
				<p>
					Психологическое консультирование при выгорании — часть более широкой системы работы с этим состоянием. В зависимости от вашей ситуации:
				</p>
				<ul class="flex flex-col gap-5 py-4">
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Не уверены, это выгорание?</strong> → 
						<a href="/burnout/sindrom-professionalnogo-vygoraniya/" class="text-[#B8A98A] underline hover:no-underline transition-all">Синдром профессионального выгорания: что это такое</a> — описание трёх компонентов модели Маслач, механизмов развития и ранних маркеров.
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Хотите проверить себя прямо сейчас?</strong> → 
						<a href="/burnout/diagnostika/" class="text-[#B8A98A] underline hover:no-underline transition-all">Диагностика выгорания: тесты и методики</a> — онлайн-скрининг BAT-23, сравнение опросников Бойко и Маслач, расшифровка результатов.
					</li>
					<li class="relative pl-6 leading-relaxed text-[#191919] before:absolute before:top-2.5 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#B8A98A] before:content-['']">
						<strong class="font-semibold">Уже выгорели и хотите восстановиться?</strong> → 
						<a href="/burnout/profilaktika-i-vosstanovlenie/" class="text-[#B8A98A] underline hover:no-underline transition-all">Профилактика и восстановление после выгорания</a> — этапы восстановления, ресурсные упражнения, work-life balance и супервизия.
					</li>
				</ul>
			</div>
		</Reveal>
	</div>
</section>
<section class="bg-[#191919] py-20 text-center text-white">
	<div class="mx-auto space-y-8 px-5 md:max-w-[760px] lg:max-w-[760px]">
		<Reveal width="full">
			<p class="mx-auto mt-4 text-lg leading-relaxed text-white/90 md:text-xl">
			Если вы <strong>узнали себя в описании</strong> и чувствуете, что самопомощь больше не работает — запишитесь на первичную консультацию для профессиональной диагностики и выбора протокола.
			</p>
		</Reveal>
		<Reveal width="full">
			<div class="flex flex-col items-center justify-center gap-6 pt-6 sm:flex-row">
				<Button
					href="https://t.me/psy_kalmykov"
					target="_blank"
					rel="noopener noreferrer"
					variant="primary"
					class="w-full justify-center sm:w-auto"
				>
					Записаться на консультацию
				</Button>
			</div>
		</Reveal>
	</div>
</section>