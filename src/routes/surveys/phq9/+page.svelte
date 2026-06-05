<script lang="ts">
	import Survey from '$lib/components/survey/Survey.svelte';
	import { phq9Config } from '../../../configs/phq9Config';

	const url = 'https://kalmykov.pro/surveys/phq9';
	const title = 'Тест на депрессию PHQ-9 онлайн | Опросник депрессивного состояния';
	const description =
		'Пройдите тест на депрессию PHQ-9 онлайн бесплатно. Валидированный опросник для оценки депрессивного состояния. Мгновенные результаты и рекомендации психолога.';
	const questionsCount = phq9Config.questions.filter((q) => q.type !== 'subheading').length;

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
		content="тест на депрессию, PHQ-9, опросник депрессии, депрессивное состояние, симптомы депрессии, оценка депрессии"
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


			<h1 class="font-caveat mb-5 text-[80px] leading-[0.9] font-bold tracking-[1px] text-navy md:text-[104px]">
				{phq9Config.title}
			</h1>

			<p class="mb-6 max-w-[460px] text-[20px] leading-[1.45] font-medium text-foreground md:text-[22px]">
				{phq9Config.description}
			</p>

			<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[16px] font-medium text-foreground/80">
				<span class="inline-flex items-center gap-2 whitespace-nowrap">
					<span class="icon-[lucide--clock] h-[19px] w-[19px] text-foreground/45"></span>{phq9Config.time}
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
			<svg class="h-auto w-full max-w-[360px]" viewBox="0 0 380 320" fill="none" aria-hidden="true">
				<circle cx="232" cy="138" r="98" fill="#F6E7CF" />
				<path d="M188 150 C190 110 196 78 214 50" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M214 50 C224 38 240 32 256 34" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M200 96 C212 84 228 82 242 88" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M194 122 C182 116 170 118 160 128" stroke="var(--color-navy)" stroke-width="2.2" stroke-linecap="round" />
				<path d="M256 34 C268 26 282 28 288 38 C278 44 264 44 256 34 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M242 88 C254 82 268 86 272 96 C261 100 248 97 242 88 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M160 128 C148 124 136 128 132 138 C143 142 154 138 160 128 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M214 50 C206 38 206 26 214 18 C222 26 222 40 214 50 Z" stroke="var(--color-navy)" stroke-width="2" fill="none" stroke-linejoin="round" />
				<path d="M174 152 C172 178 178 192 181 206 C166 232 158 252 163 280 C165 298 170 308 186 309 L206 309 C222 308 226 298 228 280 C233 252 224 232 210 206 C213 192 219 178 216 152" stroke="var(--color-navy)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
				<ellipse cx="195" cy="152" rx="21" ry="6" stroke="var(--color-navy)" stroke-width="2.2" fill="none" />
				<path d="M173 170 C185 175 205 175 217 170" stroke="var(--color-navy)" stroke-width="1.6" stroke-linecap="round" opacity="0.5" />
				<path d="M86 312 C150 320 240 314 318 318" stroke="var(--color-navy)" stroke-width="2" stroke-linecap="round" />
			</svg>
		</div>
	</div>
</section>
<div class="container mx-auto max-w-[720px] lg:max-w-[760px]">
	<Survey config={phq9Config} />
</div>
