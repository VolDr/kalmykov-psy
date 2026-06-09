<script lang="ts">
	import Questionnaire from '$lib/components/questionnaire/Questionnaire.svelte';

	import { ipsConfig } from '../../../configs/ipsConfig';

	const url = 'https://kalmykov.pro/questionnaires/ips';
	const title =
		'Тест на прокрастинацию ИПШ (IPS) онлайн | Шкала иррациональной прокрастинации П. Стила';
	const description =
		'Пройдите тест на иррациональную прокрастинацию ИПШ (IPS) онлайн бесплатно. Короткая версия шкалы П. Стила для оценки чистой иррациональной прокрастинации. Мгновенные результаты и рекомендации психолога.';
	const questionsCount = ipsConfig.questions.filter((q) => q.type !== 'subheading').length;

	function questionsLabel(n: number) {
		const d = n % 10;
		const dd = n % 100;
		if (dd >= 11 && dd <= 14) return 'вопросов';
		if (d === 1) return 'вопрос';
		if (d >= 2 && d <= 4) return 'вопроса';
		return 'вопросов';
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="тест на прокрастинацию, ИПШ, IPS, иррациональная прокрастинация, откладывание дел, Пирс Стил, оценка прокрастинации"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />
</svelte:head>

<section class="bg-background pt-16 lg:pt-24">
	<div
		class="mx-auto grid grid-cols-1 items-center gap-8 px-5 md:max-w-[760px] lg:max-w-[1200px] lg:grid-cols-[1.15fr_0.85fr] xl:px-0 pt-[43px]"
	>
		<div class="flex flex-col">


			<h1 class="font-caveat mb-5 text-[52px] leading-[0.9] font-bold tracking-[1px] text-navy lg:text-[72px]">
				{ipsConfig.title}
			</h1>

			<p class="mb-6 max-w-[460px] text-[18px] leading-[1.45] font-medium text-foreground md:text-[22px]">
				{ipsConfig.description}
			</p>

			<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[16px] font-medium text-foreground/80">
				<span class="inline-flex items-center gap-2 whitespace-nowrap">
					<span class="icon-[lucide--clock] h-[19px] w-[19px] text-foreground/45"></span>{ipsConfig.time}
				</span>
				<span class="h-1 w-1 rounded-full bg-[#d8cfbc]"></span>
				<span class="whitespace-nowrap">{questionsCount} {questionsLabel(questionsCount)}</span>
				<span class="h-1 w-1 rounded-full bg-[#d8cfbc]"></span>
				<span class="inline-flex items-center gap-2 whitespace-nowrap">
					<span class="icon-[lucide--sparkles] h-[19px] w-[19px] text-primary"></span>Результат сразу
				</span>
			</div>
		</div>

		<!-- иллюстрация: ваза с веточкой -->
		<div class="hidden items-center justify-center lg:flex">
			<img src="/vaza.webp" alt="" class="h-auto w-full max-w-[360px]" aria-hidden="true" />
		</div>
	</div>
</section>
<div class="container mx-auto max-w-[720px] lg:max-w-[760px]">
	<Questionnaire config={ipsConfig} />
</div>
